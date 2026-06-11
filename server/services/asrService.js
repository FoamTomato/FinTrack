const llmChatService = require('./llmChatService')

// 录音格式 → MIME。qwen3-asr-flash 接受 wav / mp3 / aac 等
const MIME = { mp3: 'audio/mpeg', wav: 'audio/wav', aac: 'audio/aac', m4a: 'audio/aac', amr: 'audio/amr' }

/**
 * 语音转文字（端上录音 → 后端 ASR）。
 * 复用 llmChatService 的 key 轮转，但 model 覆盖为 qwen3-asr-flash（同 DashScope 账号 key 可调）。
 * @param {string} base64  纯 base64（不含 data: 前缀）
 * @param {string} format  'mp3' | 'wav' | 'aac' ...
 * @returns {Promise<string>} 识别出的文字
 */
async function transcribe(base64, format = 'mp3') {
  const fmt = String(format || 'mp3').toLowerCase()
  const mime = MIME[fmt] || 'audio/mpeg'

  const messages = [
    { role: 'system', content: [{ type: 'text', text: '' }] },
    {
      role: 'user',
      content: [
        { type: 'input_audio', input_audio: { data: `data:${mime};base64,${base64}`, format: fmt } }
      ]
    }
  ]

  const content = await llmChatService.chat(messages, {
    model: 'qwen3-asr-flash',
    maxTokens: null,
    temperature: null,
    timeout: 60000,
    extraBody: { asr_options: { enable_itn: true, language: 'zh' } }
  })

  return String(content || '').trim()
}

module.exports = { transcribe }
