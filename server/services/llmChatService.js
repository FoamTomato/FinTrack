const axios = require('axios')
const llmKeyService = require('./llmKeyService')

/**
 * 通用 LLM chat 调用 + 多 key 轮转/容错。
 * 与输入形态（图片/文本）无关，scan 与 voice 共享。
 *
 * @param {Array} messages  OpenAI 兼容的 messages 数组
 * @param {Object} opts
 * @param {number} [opts.maxTokens=2048]
 * @param {number} [opts.temperature=0.1]
 * @param {number} [opts.timeout=90000]
 * @param {Function} [opts.parse]  可选的成功校验/解析器：接收 content 字符串，返回解析结果。
 *                                  若抛错，视为"格式错误"直接终止（不切换 key），且不计 markSuccess——
 *                                  与原 scanService._callVisionModel 行为完全一致。
 * @param {string} [opts.model]    覆盖该 key 默认 model（如 ASR 用 qwen3-asr-flash）。同账号 key 可调任意模型。
 * @param {Object} [opts.extraBody] 额外合并进请求体的字段（如 ASR 的 asr_options）。
 *   maxTokens / temperature 传 null 则不下发该字段（ASR 不需要）。
 * @returns {Promise<*>}  parse 存在时返回 parse(content)，否则返回原始 content 字符串
 */
async function chat(messages, opts = {}) {
  const { model, timeout = 90000, parse, extraBody } = opts
  const maxTokens = opts.maxTokens === undefined ? 2048 : opts.maxTokens
  const temperature = opts.temperature === undefined ? 0.1 : opts.temperature
  const MAX_KEY_ATTEMPTS = 5
  let lastErr
  const triedKeyIds = []

  for (let keyAttempt = 0; keyAttempt < MAX_KEY_ATTEMPTS; keyAttempt++) {
    let keyRow
    try {
      keyRow = await llmKeyService.getActiveKey(triedKeyIds)
    } catch (e) {
      if (lastErr) throw lastErr
      throw new Error('所有 API Key 均已耗尽或不可用')
    }
    triedKeyIds.push(keyRow.id)

    try {
      const body = { model: model || keyRow.model, messages }
      if (maxTokens != null) body.max_tokens = maxTokens
      if (temperature != null) body.temperature = temperature
      if (extraBody) Object.assign(body, extraBody)
      const resp = await axios.post(
        `${keyRow.base_url}/chat/completions`,
        body,
        {
          headers: { Authorization: `Bearer ${keyRow.api_key}`, 'Content-Type': 'application/json' },
          timeout
        }
      )
      const content = resp.data.choices[0].message.content
      const result = parse ? parse(content) : content
      await llmKeyService.markSuccess(keyRow.id)
      await llmKeyService.checkAndDisableIfExhausted(keyRow.id)
      return result
    } catch (err) {
      lastErr = err
      const status = err.response && err.response.status
      const errMsg = err.response && err.response.data && err.response.data.error && err.response.data.error.message
      // 额度耗尽或鉴权失败 → 永久禁用该 key 并切换
      if (status === 429 || status === 401 || status === 403 ||
          (errMsg && /quota|exceeded|invalid.*key|auth/i.test(errMsg))) {
        await llmKeyService.markDisabled(keyRow.id, errMsg || `HTTP ${status}`)
        continue
      }
      // 服务端错误/超时（502/503/504/网络） → 临时跳过该 key，本次切换不禁用
      if (status === 502 || status === 503 || status === 504 ||
          err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET' ||
          (errMsg && /no.*available|distributor|model_not_found/i.test(errMsg))) {
        continue
      }
      // 其他错误（格式等）直接抛出
      throw err
    }
  }
  throw lastErr
}

module.exports = { chat }
