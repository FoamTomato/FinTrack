/**
 * 账单解析公共纯函数。与输入形态（图片/文本）无关，scan 与 voice 共享。
 */

/** 把分类树拍平成「父分类 > 子分类 (id:N)」的多行文本，供 prompt 注入 */
function buildCategoryListText(categoryTree) {
  return (categoryTree || []).flatMap(parent =>
    (parent.children || []).map(child =>
      `${parent.name} > ${child.name} (id:${child.id})`
    )
  ).join('\n')
}

/**
 * 从 LLM 返回文本中提取 items 数组。
 * 优先抓 ```json ... ``` 代码块，再 fallback 到第一段 { ... }。
 * 解析失败抛错（调用方将其当作"格式错误"终止，与原逻辑一致）。
 */
function extractItems(content) {
  const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = codeBlock ? codeBlock[1].trim() : content
  const match = jsonStr.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('返回格式异常: ' + content.substring(0, 200))
  const parsed = JSON.parse(match[0])
  return Array.isArray(parsed.items) ? parsed.items : []
}

// 模糊匹配阈值：>= HIGH 视为可信；[MIN, HIGH) 视为低置信（需用户复核）；< MIN 视为未命中
const SIM_HIGH = 0.8
const SIM_MIN = 0.5

/** 归一化分类名：去掉 "(id:N)"、所有空白，便于稳定比较 */
function normalizeName(s) {
  return String(s || '').replace(/\(id:\d+\)/g, '').replace(/\s+/g, '').trim()
}

/** 归一化竖向裁剪区间 bbox=[y_top, y_bottom]（0~1）；非法/越界/零高返回 null */
function normalizeBbox(b) {
  if (!Array.isArray(b) || b.length < 2) return null
  const top = Number(b[0])
  const bottom = Number(b[1])
  if (!Number.isFinite(top) || !Number.isFinite(bottom)) return null
  const t = Math.max(0, Math.min(1, Math.min(top, bottom)))
  const bo = Math.max(0, Math.min(1, Math.max(top, bottom)))
  if (bo - t <= 0) return null
  return [Number(t.toFixed(4)), Number(bo.toFixed(4))]
}

/**
 * 两个归一化字符串的相似度（0~1）。
 * 完全相等=1；包含关系按长度占比给分；否则取最长公共子串占较长串的比例。
 * 比原来的"任意子串命中即算匹配"更克制，避免「午餐」误命中「工作日午餐 / 周末午餐」中的任意一个。
 */
function similarity(a, b) {
  if (!a || !b) return 0
  if (a === b) return 1
  const long = a.length >= b.length ? a : b
  const short = a.length >= b.length ? b : a
  if (long.includes(short)) return short.length / long.length
  let best = 0
  for (let i = 0; i < short.length; i++) {
    for (let j = i + 1; j <= short.length; j++) {
      const sub = short.slice(i, j)
      if (sub.length > best && long.includes(sub)) best = sub.length
    }
  }
  return best / long.length
}

/**
 * 把 LLM 给出的 suggested_category 文本匹配到真实 category_id。
 * 匹配顺序：(id:N) 提取 → 归一化精确名 → 按收支类型过滤后的「评分最优」模糊匹配。
 * 相比旧实现的改进：
 *   1. 模糊匹配改为「全候选评分取最优」，而非 Object.keys().find() 的任意首个子串命中（消除顺序相关的错配）；
 *   2. 模糊匹配先按 item.type 过滤候选，避免支出条目误匹配到收入分类；
 *   3. 返回 low_confidence 标记：id/精确命中为 false，弱模糊或未命中为 true，供确认页标红复核。
 * 返回规整后的交易条目数组。
 */
function matchCategories(rawItems, categoryTree) {
  // 构建查找表
  const byId = {}
  const byName = {}
  const candidates = []
  for (const parent of (categoryTree || [])) {
    for (const child of (parent.children || [])) {
      const entry = { id: child.id, name: child.name, parentName: parent.name, type: parent.type }
      byId[child.id] = entry
      byName[normalizeName(child.name)] = entry
      // 父>子 组合名也能精确命中
      byName[normalizeName(`${parent.name}${child.name}`)] = entry
      candidates.push(entry)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (rawItems || []).map((item, index) => {
    const type = Number(item.type) === 1 ? 1 : 2
    const suggested = String(item.suggested_category || '')
    let matched = null
    let lowConfidence = false

    // 1) 显式 (id:N)
    const idMatch = suggested.match(/\(id:(\d+)\)/)
    if (idMatch) matched = byId[parseInt(idMatch[1])]

    // 2) 归一化精确名（含 父+子 组合）
    if (!matched) matched = byName[normalizeName(suggested)] || null

    // 3) 评分最优的模糊匹配（仅在同收支类型的候选里挑）
    if (!matched && suggested) {
      const target = normalizeName(suggested)
      let best = null
      let bestScore = 0
      for (const c of candidates) {
        if (c.type !== type) continue
        const score = Math.max(
          similarity(target, normalizeName(c.name)),
          similarity(target, normalizeName(`${c.parentName}${c.name}`))
        )
        if (score > bestScore) { bestScore = score; best = c }
      }
      if (best && bestScore >= SIM_MIN) {
        matched = best
        lowConfidence = bestScore < SIM_HIGH
      }
    }

    // 未命中任何分类 → 留待用户复核
    if (!matched) lowConfidence = true

    return {
      type,
      amount: Math.abs(parseFloat(item.amount) || 0).toFixed(2),
      category: matched ? matched.name : (normalizeName(suggested) || '其他'),
      category_id: matched ? matched.id : 0,
      date: item.date || today,
      time: typeof item.time === 'string' ? item.time.trim() : '',
      refunded: item.refunded === true || item.refunded === 'true',
      bbox: normalizeBbox(item.bbox),
      order: Number.isInteger(item.order) ? item.order : index,
      note: item.note || '',
      low_confidence: lowConfidence
    }
  })
}

module.exports = { buildCategoryListText, extractItems, matchCategories }
