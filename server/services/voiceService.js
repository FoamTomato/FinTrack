const db = require('../config/db')
const categoryService = require('./categoryService')
const llmChatService = require('./llmChatService')
const billParser = require('./billParser')

class VoiceService {
  async createTask(openid, text) {
    const [result] = await db.execute(
      'INSERT INTO voice_tasks (openid, input_text, status) VALUES (?, ?, ?)',
      [openid, text, 'pending']
    )
    return { id: result.insertId }
  }

  async getTaskStatus(taskId, openid) {
    const [rows] = await db.execute(
      'SELECT status, result, imported FROM voice_tasks WHERE id = ? AND openid = ?',
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
      'SELECT status, result FROM voice_tasks WHERE id = ? AND openid = ?',
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

  async getTaskList(openid) {
    const [rows] = await db.execute(
      `SELECT id, status, result, imported, input_text, created_at
       FROM voice_tasks WHERE openid = ? ORDER BY created_at DESC LIMIT 50`,
      [openid]
    )
    return rows.map(r => {
      // 解析 result 一次，供 itemCount 与时间线 mini 列表共用
      let parsed = null
      if (r.status === 'completed' && r.result) {
        try { parsed = typeof r.result === 'string' ? JSON.parse(r.result) : r.result } catch (_) {}
      }
      const items = Array.isArray(parsed) ? parsed : null
      return {
        id: r.id,
        status: r.status,
        imported: !!r.imported,
        inputText: r.input_text || '',
        createdAt: r.created_at,
        itemCount: items ? items.length : null,
        // 实际入账条数（result 内 imported===true 的数量）
        importedCount: items ? items.filter(it => it.imported === true).length : null,
        // 时间线卡片 mini 列表用（精简字段，最多前 4 条由前端截）
        items: items ? items.map(it => ({
          type: Number(it.type) === 1 ? 1 : 2,
          amount: it.amount,
          category: it.category || '',
          imported: it.imported === true,
          skip_reason: it.skip_reason || ''
        })) : []
      }
    })
  }

  async processTask(taskId, openid) {
    try {
      await db.execute(
        "UPDATE voice_tasks SET status = 'processing' WHERE id = ? AND openid = ?",
        [taskId, openid]
      )

      // 取口述文本
      const [rows] = await db.execute(
        'SELECT input_text FROM voice_tasks WHERE id = ?',
        [taskId]
      )
      if (!rows.length) return
      const text = rows[0].input_text || ''

      // 只获取用户已启用的分类（含用户自建分类）
      const categoryTree = await categoryService.getTree(openid, undefined, true)

      // 调用文本模型解析
      const rawItems = await this._callTextModel(text, categoryTree)

      // 匹配分类 ID
      const items = billParser.matchCategories(rawItems, categoryTree)

      await db.execute(
        "UPDATE voice_tasks SET status = 'completed', result = ? WHERE id = ?",
        [JSON.stringify(items), taskId]
      )
    } catch (err) {
      const msg = (err && err.message) ? err.message : String(err)
      // 失败重试：retry_count+1 未达 3 次退回 pending(由 taskWorker 再认领)，否则置 failed
      await db.execute(
        `UPDATE voice_tasks
           SET status = IF(retry_count + 1 < 3, 'pending', 'failed'),
               error_msg = ?, retry_count = retry_count + 1
         WHERE id = ?`,
        [msg.substring(0, 500), taskId]
      ).catch(() => {})
    }
  }

  async _callTextModel(text, categoryTree) {
    const categoryListText = billParser.buildCategoryListText(categoryTree)
    const today = new Date().toISOString().split('T')[0]
    const currentYear = today.substring(0, 4)

    const messages = [
      {
        role: 'user',
        content: `你是记账助手。今天是 ${today}。下面是用户口述的一段话，可能包含一笔或多笔消费或收入，请逐笔提取，严格按以下 JSON 格式输出，不输出任何其他文字：\n{"items":[{"amount":数字,"type":1或2,"suggested_category":"分类名(id:N)","date":"YYYY-MM-DD","note":"备注"}]}\n其中 type=1 为收入，type=2 为支出。amount 保留两位小数。\n金额识别规则：把口语数字（如"三十"、"二十五块五"）换算成阿拉伯数字金额。\n日期处理规则：\n- 口述中如果说"今天"或没提日期，date 填今天 ${today}\n- 说"昨天/前天/X月X日"等，按今天推算具体日期；只说"月-日"没有年份时，年份填 ${currentYear}\n- 不要假设年份是 2024 或其他年份，没有明确年份信息一律用 ${currentYear}\nsuggested_category 必须从候选分类中选择最接近的一个，格式为"父分类 > 子分类 (id:N)"。\nnote 填该笔的简短描述（如"打车"、"午饭"）。\n\n可用分类列表：\n${categoryListText}\n\n用户口述内容：\n${text}`
      }
    ]

    return llmChatService.chat(messages, { parse: billParser.extractItems })
  }
}

module.exports = new VoiceService()
