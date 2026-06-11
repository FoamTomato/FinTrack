/**
 * 时间线聚合层（纯数据，不碰 UI / 不调网络 / 不 setData）
 *
 * 把三种数据源合并成「记一笔」页的对话式时间线卡片，按时间倒序、按天分组：
 *   - manual：transactions 中 source==='manual' 的每一笔（一笔一卡）
 *   - voice ：voiceTasks 每个 task 一卡（口述文字 + 解析账单 mini 列表 + 状态）
 *   - scan  ：scanTasks 按 batchId 聚合成「批次卡片合集」（九宫格），无 batchId 的旧 task 单图成卡
 *
 * 输入均为后端原样返回的结构；时间戳来源：
 *   - transaction：date('YYYY-MM-DD') + trade_time('HH:mm' | null)
 *   - task：createdAt（后端时间字符串或带时区）
 */

const { resolveIconUrl } = require('./request');

// scan 的 image_url / crop_url 存为 'uploads/scan/...'（无前导斜杠），复用现有解析约定
function resolveUpload(rel) {
  return rel ? resolveIconUrl('/' + rel) : '';
}

/**
 * 把任意时间值归一成可排序毫秒数 + 显示用结构。
 * 兼容「YYYY-MM-DD HH:mm:ss」「YYYY-MM-DDTHH:mm:ssZ」「YYYY-MM-DD」纯日期。
 * 不带时区的本地库时间按原始时分展示（与 home 的 formatShanghaiTime 思路一致）。
 */
function parseTime(value) {
  if (!value) return { ts: 0, ymd: '', hm: '' };

  if (typeof value === 'string') {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    const hasTz = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
    if (m && !hasTz) {
      const [, y, mo, d, hh, mi, ss] = m;
      const ymd = `${y}-${mo}-${d}`;
      const hm = hh != null ? `${hh}:${mi}` : '';
      // 本地构造，仅用于排序，不参与展示
      const ts = new Date(
        Number(y), Number(mo) - 1, Number(d),
        hh != null ? Number(hh) : 0,
        mi != null ? Number(mi) : 0,
        ss != null ? Number(ss) : 0
      ).getTime();
      return { ts, ymd, hm };
    }
  }

  // 带时区或非字符串：统一按 UTC+8 折算
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { ts: 0, ymd: '', hm: '' };
  const sh = new Date(parsed.getTime() + 8 * 3600 * 1000);
  const y = sh.getUTCFullYear();
  const mo = ('0' + (sh.getUTCMonth() + 1)).slice(-2);
  const d = ('0' + sh.getUTCDate()).slice(-2);
  const hh = ('0' + sh.getUTCHours()).slice(-2);
  const mi = ('0' + sh.getUTCMinutes()).slice(-2);
  return { ts: parsed.getTime(), ymd: `${y}-${mo}-${d}`, hm: `${hh}:${mi}` };
}

// 日期分隔显示文案：今天 / 昨天 / M月D日
function dayLabel(ymd, todayYmd, yesterdayYmd) {
  if (ymd === todayYmd) return '今天';
  if (ymd === yesterdayYmd) return '昨天';
  const m = ymd.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (!m) return ymd;
  return `${parseInt(m[1], 10)}月${parseInt(m[2], 10)}日`;
}

function ymdOffset(baseYmd, deltaDays) {
  const [y, mo, d] = baseYmd.split('-').map(Number);
  const dt = new Date(y, mo - 1, d + deltaDays);
  return `${dt.getFullYear()}-${('0' + (dt.getMonth() + 1)).slice(-2)}-${('0' + dt.getDate()).slice(-2)}`;
}

// 任务状态 → 卡片状态标签（pill）
function taskPill(task) {
  if (task.status === 'failed') return { key: 'fail', text: '解析失败 · 重试' };
  if (task.status === 'pending' || task.status === 'processing') {
    return { key: 'proc', text: 'AI 解析中…' };
  }
  // completed
  if (task.imported) {
    return { key: 'done', text: `已记账 ${task.itemCount != null ? task.itemCount + ' 笔' : ''}`.trim() };
  }
  return { key: 'wait', text: '待核对 · 点开导入' };
}

/**
 * 构建时间线。
 * @param {Object} p
 * @param {Array}  p.transactions  dashboard.list（已含 source / source_task_id / trade_time）
 * @param {Array}  p.voiceTasks    getVoiceHistory().data
 * @param {Array}  p.scanTasks     getScanHistory().data
 * @param {Object} p.scanBatchMap  本地 storage：{ [taskId]: batchId }
 * @returns {Array} 分组数组：[{ label, ymd, items: [card...] }]
 */
function buildTimeline({ transactions = [], voiceTasks = [], scanTasks = [], scanBatchMap = {} } = {}) {
  const cards = [];

  // 1) 手动交易 —— 仅 source==='manual'（语音/识图来源的交易由 task 卡承载，避免重复）
  for (const t of transactions) {
    if (t.source && t.source !== 'manual') continue;
    // 历史数据 source 缺失默认按 manual 处理（计划已接受）
    const { ts, ymd, hm } = parseTime(t.trade_time ? `${t.date} ${t.trade_time}` : t.date);
    cards.push({
      cardType: 'manual',
      key: 'm' + t.id,
      id: t.id,
      ts, ymd, hm,
      type: Number(t.type),
      amount: parseFloat(t.amount || 0).toFixed(2),
      category: t.category || '未分类',
      category_id: t.category_id || 0,
      note: t.note || '',
      iconUrl: resolveIconUrl(t.icon)
    });
  }

  // 2) 语音任务 —— 每 task 一卡
  for (const task of voiceTasks) {
    const { ts, ymd, hm } = parseTime(task.createdAt);
    const items = Array.isArray(task.items) ? task.items : [];
    cards.push({
      cardType: 'voice',
      key: 'v' + task.id,
      taskId: task.id,
      ts, ymd, hm,
      status: task.status,
      imported: !!task.imported,
      itemCount: task.itemCount,
      inputText: task.inputText || '',
      miniItems: items.slice(0, 4).map(it => ({
        // 解析结果的 suggested_category 形如「父 > 子 (id:N)」，去掉 (id:N) 仅留分类名
        category: String(it.suggested_category || it.category || '未分类').replace(/\s*\(id:\d+\)\s*$/, ''),
        type: Number(it.type) === 1 ? 1 : 2,
        amount: parseFloat(it.amount || 0).toFixed(2)
      })),
      pill: taskPill(task)
    });
  }

  // 3) 识图任务 —— 按 batchId 聚合成九宫格合集；无 batchId 的单图成卡
  const batches = {};   // batchId -> 聚合卡
  for (const task of scanTasks) {
    const batchId = scanBatchMap[task.id] || ('single-' + task.id);
    if (!batches[batchId]) {
      const { ts, ymd, hm } = parseTime(task.createdAt);
      batches[batchId] = {
        cardType: 'scan',
        key: 'b' + batchId,
        batchId,
        ts, ymd, hm,
        tasks: [],
        photos: [],          // 九宫格缩略（最多展示 9，超出折叠 +N）
        total: 0,
        doneCount: 0,
        importedCount: 0,
        processingCount: 0,
        failedCount: 0
      };
    }
    const b = batches[batchId];
    // 取批次内最早创建时间作为卡片时间（同批通常相近）
    const tp = parseTime(task.createdAt);
    if (tp.ts && (!b.ts || tp.ts < b.ts)) { b.ts = tp.ts; b.ymd = tp.ymd; b.hm = tp.hm; }
    b.tasks.push(task);
    b.total += 1;
    if (task.status === 'completed') b.doneCount += 1;
    if (task.imported) b.importedCount += 1;
    if (task.status === 'pending' || task.status === 'processing') b.processingCount += 1;
    if (task.status === 'failed') b.failedCount += 1;
    b.photos.push({
      taskId: task.id,
      thumb: resolveUpload(task.imageUrl),
      itemCount: task.status === 'completed' ? task.itemCount : null,
      recognized: task.status === 'completed',
      processing: task.status === 'pending' || task.status === 'processing',
      failed: task.status === 'failed'
    });
  }

  for (const b of Object.values(batches)) {
    // 九宫格：超过 9 张时第 9 格显示 +N
    b.photoCount = b.photos.length;
    b.gridPhotos = b.photos.slice(0, 9);
    b.overflow = b.photoCount > 9 ? b.photoCount - 8 : 0;  // 第9格变 +N，故被折叠的是 photoCount-8
    if (b.overflow > 0) b.gridPhotos = b.photos.slice(0, 8);
    // 汇总状态 pill
    if (b.processingCount > 0) {
      b.pill = { key: 'proc', text: `识别中 ${b.doneCount}/${b.total} …` };
    } else if (b.failedCount === b.total) {
      b.pill = { key: 'fail', text: '识别失败 · 重试' };
    } else if (b.importedCount > 0) {
      b.pill = { key: 'done', text: `已记账 ${b.importedCount}/${b.total} 张` };
    } else {
      b.pill = { key: 'wait', text: '待核对 · 点开导入' };
    }
    cards.push(b);
  }

  // 4) 全局按时间倒序
  cards.sort((a, b) => (b.ts || 0) - (a.ts || 0));

  // 5) 按天分组
  const now = new Date();
  const todayYmd = `${now.getFullYear()}-${('0' + (now.getMonth() + 1)).slice(-2)}-${('0' + now.getDate()).slice(-2)}`;
  const yesterdayYmd = ymdOffset(todayYmd, -1);

  const groups = [];
  let cur = null;
  for (const card of cards) {
    if (!cur || cur.ymd !== card.ymd) {
      cur = { ymd: card.ymd, label: dayLabel(card.ymd, todayYmd, yesterdayYmd), items: [] };
      groups.push(cur);
    }
    cur.items.push(card);
  }
  return groups;
}

module.exports = { buildTimeline, parseTime };
