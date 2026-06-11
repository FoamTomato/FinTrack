const db = require('../config/db')

class LlmKeyService {
  // 取优先级最高的可用 key（全局，不限 provider），可排除指定 id 列表
  async getActiveKey(excludeIds = []) {
    let sql = `SELECT * FROM llm_keys
       WHERE is_active = 1
         AND (quota_limit = 0 OR quota_used < quota_limit)`
    const params = []
    if (excludeIds && excludeIds.length) {
      sql += ` AND id NOT IN (${excludeIds.map(() => '?').join(',')})`
      params.push(...excludeIds)
    }
    sql += ` ORDER BY priority DESC LIMIT 1`
    const [rows] = await db.execute(sql, params)
    if (!rows.length) throw new Error('所有 API Key 均已耗尽或不可用')
    return rows[0]
  }

  // 调用成功，累加使用次数
  async markSuccess(id) {
    await db.execute(
      'UPDATE llm_keys SET quota_used = quota_used + 1 WHERE id = ?',
      [id]
    )
  }

  // 额度耗尽或鉴权失败，禁用该 key
  async markDisabled(id, reason) {
    await db.execute(
      `UPDATE llm_keys SET is_active = 0, disabled_at = NOW(), disable_reason = ? WHERE id = ?`,
      [String(reason).substring(0, 255), id]
    )
  }

  // 用完额度（quota_used >= quota_limit），自动禁用
  async checkAndDisableIfExhausted(id) {
    const [rows] = await db.execute(
      'SELECT quota_used, quota_limit FROM llm_keys WHERE id = ?',
      [id]
    )
    if (!rows.length) return
    const { quota_used, quota_limit } = rows[0]
    if (quota_limit > 0 && quota_used >= quota_limit) {
      await this.markDisabled(id, '额度已用完')
    }
  }
}

module.exports = new LlmKeyService()
