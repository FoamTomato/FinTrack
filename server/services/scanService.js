const fs = require('fs')
const path = require('path')
const db = require('../config/db')
const categoryService = require('./categoryService')
const llmChatService = require('./llmChatService')
const billParser = require('./billParser')
const imageService = require('./imageService')

class ScanService {
  async createTask(openid, imageUrl) {
    const [result] = await db.execute(
      'INSERT INTO scan_tasks (openid, image_url, status) VALUES (?, ?, ?)',
      [openid, imageUrl, 'pending']
    )
    return { id: result.insertId }
  }

  async getTaskStatus(taskId, openid) {
    const [rows] = await db.execute(
      'SELECT status, result, imported FROM scan_tasks WHERE id = ? AND openid = ?',
      [taskId, openid]
    )
    if (!rows.length) {
      throw { type: 'VALIDATION_ERROR', message: '任务不存在' }
    }
    const row = rows[0]
    let itemCount = null
    if (row.status === 'completed' && row.result) {
      try {
        const parsed = typeof row.result === 'string' ? JSON.parse(row.result) : row.result
        itemCount = Array.isArray(parsed) ? parsed.length : null
      } catch (_) {}
    }
    return { status: row.status, itemCount, imported: !!row.imported }
  }

  async getTaskResult(taskId, openid) {
    const [rows] = await db.execute(
      'SELECT status, result FROM scan_tasks WHERE id = ? AND openid = ?',
      [taskId, openid]
    )
    if (!rows.length) {
      throw { type: 'VALIDATION_ERROR', message: '任务不存在' }
    }
    const row = rows[0]
    if (row.status !== 'completed') {
      throw { type: 'VALIDATION_ERROR', message: '任务尚未完成' }
    }
    const items = typeof row.result === 'string' ? JSON.parse(row.result) : row.result
    return { items: items || [] }
  }

  async processTask(taskId, openid) {
    try {
      await db.execute(
        "UPDATE scan_tasks SET status = 'processing' WHERE id = ? AND openid = ?",
        [taskId, openid]
      )

      // 获取图片路径
      const [rows] = await db.execute(
        'SELECT image_url FROM scan_tasks WHERE id = ?',
        [taskId]
      )
      if (!rows.length) return
      const imageUrl = rows[0].image_url

      const localPath = path.join(__dirname, '..', imageUrl)
      if (!fs.existsSync(localPath)) {
        throw new Error('图片文件不存在: ' + localPath)
      }

      // 只获取用户已启用的分类（含用户自建分类）
      const categoryTree = await categoryService.getTree(openid, undefined, true)

      // 预处理：缩放 + 超长截图竖向分块；任何异常回退到「整图直发」
      let tiles
      try {
        const prepared = await imageService.prepareTiles(localPath)
        tiles = prepared.tiles
      } catch (e) {
        const base64 = fs.readFileSync(localPath).toString('base64')
        const ext = path.extname(localPath).toLowerCase()
        const mimeType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg'
        tiles = [{ base64, mimeType, y0: 0, y1: 1 }]
      }

      // 逐瓦片识别 → bbox 由瓦片局部映射回原图归一化坐标 → 汇总
      let rawItems = []
      for (const tile of tiles) {
        const tileItems = await this._callVisionModel(tile.base64, tile.mimeType, categoryTree)
        for (const it of (tileItems || [])) {
          rawItems.push(this._remapItem(it, tile))
        }
      }

      // 合并相邻瓦片重叠区的重复项，并按原图从上到下重排
      rawItems = this._mergeTileItems(rawItems)

      // 匹配分类 ID
      const items = billParser.matchCategories(rawItems, categoryTree)

      // 逐笔按 bbox 从原图精确裁图存档（bbox 不可用则跳过，优雅降级）
      await this._cropItems(localPath, items, taskId)

      await db.execute(
        "UPDATE scan_tasks SET status = 'completed', result = ? WHERE id = ?",
        [JSON.stringify(items), taskId]
      )
    } catch (err) {
      const msg = (err && err.message) ? err.message : String(err)
      // 失败重试：retry_count+1 未达 3 次退回 pending(由 taskWorker 再认领)，否则置 failed
      await db.execute(
        `UPDATE scan_tasks
           SET status = IF(retry_count + 1 < 3, 'pending', 'failed'),
               error_msg = ?, retry_count = retry_count + 1
         WHERE id = ?`,
        [msg.substring(0, 500), taskId]
      ).catch(() => {})
    }
  }

  async getTaskList(openid) {
    const [rows] = await db.execute(
      `SELECT id, status, result, imported, image_url, created_at
       FROM scan_tasks WHERE openid = ? ORDER BY created_at DESC LIMIT 50`,
      [openid]
    )
    return rows.map(r => {
      let parsed = null
      if (r.status === 'completed' && r.result) {
        try { parsed = typeof r.result === 'string' ? JSON.parse(r.result) : r.result } catch (_) {}
      }
      const items = Array.isArray(parsed) ? parsed : null
      return {
        id: r.id,
        status: r.status,
        imported: !!r.imported,
        imageUrl: r.image_url || '',
        createdAt: r.created_at,
        itemCount: items ? items.length : null,
        // 实际入账条数（result 内 imported===true 的数量）
        importedCount: items ? items.filter(it => it.imported === true).length : null
      }
    })
  }

  // 逐笔按 bbox（原图归一化竖向区间）从原图裁出小图，写 item.crop_url；失败/无 bbox 静默跳过
  async _cropItems(localPath, items, taskId) {
    const cropDir = path.join(__dirname, '..', 'uploads', 'scan-crops')
    try { fs.mkdirSync(cropDir, { recursive: true }) } catch (_) {}
    for (let i = 0; i < items.length; i++) {
      const bbox = items[i].bbox
      if (!Array.isArray(bbox) || bbox.length < 2) continue
      const outName = `${taskId}_${i}.jpg`
      try {
        const ok = await imageService.cropVertical(localPath, bbox[0], bbox[1], path.join(cropDir, outName))
        if (ok) items[i].crop_url = `uploads/scan-crops/${outName}`
      } catch (_) {}
    }
  }

  // 把瓦片内的 item（bbox 为瓦片局部 0~1）映射回原图归一化坐标，并附 _y 中心用于去重/排序
  _remapItem(it, tile) {
    const span = (tile.y1 - tile.y0) || 1
    let bbox = null
    let yCenter = null
    if (Array.isArray(it.bbox) && it.bbox.length >= 2) {
      const bt = Number(it.bbox[0])
      const bb = Number(it.bbox[1])
      if (Number.isFinite(bt) && Number.isFinite(bb)) {
        const top = tile.y0 + Math.min(bt, bb) * span
        const bottom = tile.y0 + Math.max(bt, bb) * span
        bbox = [top, bottom]
        yCenter = (top + bottom) / 2
      }
    }
    return Object.assign({}, it, { bbox, _y: yCenter })
  }

  // 合并各瓦片汇总后的 items：重叠区同一笔会被相邻瓦片各识别一次，按 (类型|金额|备注|日期) 且竖向位置相近判为重复；
  // 最终按原图从上到下(_y)重排并重写 order，去掉内部辅助字段。
  _mergeTileItems(items) {
    const norm = s => String(s || '').replace(/\s+/g, '').toLowerCase()
    const kept = []
    for (const it of items) {
      const amt = (Math.abs(parseFloat(it.amount) || 0)).toFixed(2)
      const key = `${Number(it.type) === 1 ? 1 : 2}|${amt}|${norm(it.note)}|${it.date || ''}`
      const dup = kept.find(k =>
        k._key === key && k._y != null && it._y != null && Math.abs(k._y - it._y) < 0.06
      )
      if (dup) {
        // 保留信息更全的一条（优先有 bbox 的）
        if (!dup.bbox && it.bbox) { dup.bbox = it.bbox; dup._y = it._y }
        continue
      }
      kept.push(Object.assign({}, it, { _key: key }))
    }
    kept.sort((a, b) => (a._y == null ? Infinity : a._y) - (b._y == null ? Infinity : b._y))
    return kept.map((it, idx) => {
      const rest = Object.assign({}, it)
      delete rest._key
      delete rest._y
      rest.order = idx
      return rest
    })
  }

  // 以北京时间(UTC+8)为基准返回 YYYY-MM-DD，避免容器 UTC 时区在北京凌晨算错日期
  _beijingDate(offsetDays = 0) {
    const ms = Date.now() + 8 * 3600 * 1000 + offsetDays * 24 * 3600 * 1000
    return new Date(ms).toISOString().split('T')[0]
  }

  // 由 YYYY-MM-DD 算中文星期，供 prompt 推算"星期X/上周X"
  _weekdayCn(ymd) {
    const [y, m, d] = ymd.split('-').map(Number)
    const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return names[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  }

  async _callVisionModel(base64, mimeType, categoryTree) {
    const categoryListText = billParser.buildCategoryListText(categoryTree)

    const today = this._beijingDate(0)
    const yesterday = this._beijingDate(-1)
    const dayBefore = this._beijingDate(-2)
    const currentYear = today.substring(0, 4)
    const weekdayCn = this._weekdayCn(today)

    // 将 system 指令合并进 user 消息（兼容 Gemini 不支持 system role）
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `你是专业的账单识别助手，负责从微信支付 / 支付宝 / 银行等账单截图中逐笔提取交易。

【时间基准】
- 今天：${today}（${weekdayCn}）
- 昨天：${yesterday}
- 前天：${dayBefore}
- 当前年份：${currentYear}

【输出格式】严格只输出 JSON，禁止任何额外文字、解释或 markdown：
{"items":[{"amount":数字,"type":1或2,"suggested_category":"父分类 > 子分类 (id:N)","date":"YYYY-MM-DD","time":"HH:MM","refunded":false,"note":"备注","bbox":[上边界,下边界],"order":0}]}

【字段规则】
- type：1=收入，2=支出。截图里"+金额"一般是收入(1)，"-金额"或扣款是支出(2)。
- amount：正数，保留两位小数，不要带正负号。
- date：必须换算成绝对日期 YYYY-MM-DD：
  · "今天"→${today}；"昨天"→${yesterday}；"前天"→${dayBefore}
  · "星期X / 周X / 上周X"→以今天是${weekdayCn}为基准，推算成那一天最近一次出现的具体日期
  · 只有"M月D日"或"MM-DD"没有年份时→年份填 ${currentYear}
  · 完全无法识别日期→填 ${today}
  · 不要臆测年份（如 2024），没有明确年份一律用 ${currentYear}
- time："HH:MM"（24 小时制），账单上识别不到时分就填 ""。
- refunded：该笔若出现"退款 / 已退款 / 退款成功 / 退款中 / 原路退回 / 交易关闭 / 已关闭 / 支付失败"等字样，填 true，否则 false。
- note：商户名或交易说明，简短。
- suggested_category：必须从下方候选分类里选最接近的一个，格式为"父分类 > 子分类 (id:N)"。
- bbox：该笔在整张图中的竖直位置 [上边界, 下边界]，用占图片总高度的比例（0~1，保留两位小数）；只需竖直范围，横向默认整宽。
- order：按从上到下的屏幕顺序编号，最上面一笔为 0，依次 +1。

【顺序】items 必须严格按截图中从上到下的视觉顺序排列。

可用分类列表：
${categoryListText}

请逐笔识别图片中所有账单条目：`
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64}`
            }
          }
        ]
      }
    ]

    return llmChatService.chat(messages, { parse: billParser.extractItems })
  }
}

module.exports = new ScanService()
