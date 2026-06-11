const voiceService = require('../services/voiceService')
const asrService = require('../services/asrService')
const taskWorker = require('../services/taskWorker')
const { success } = require('../utils/response')

const AUDIO_EXTS = ['mp3', 'wav', 'aac', 'm4a', 'amr']

class VoiceController {
  // 端上录音 → 上传音频 → ASR 转文字（同步返回文字，供用户复核后再解析）
  async transcribe(req, res, next) {
    try {
      if (!req.file || !req.file.buffer) {
        throw { type: 'VALIDATION_ERROR', message: '未收到音频文件' }
      }
      const ext = (String(req.file.originalname || '').split('.').pop() || '').toLowerCase()
      const mime = req.file.mimetype || ''
      const fmt = AUDIO_EXTS.includes(ext) ? ext
        : /wav/.test(mime) ? 'wav'
        : /aac|m4a|mp4/.test(mime) ? 'aac'
        : 'mp3'
      const text = await asrService.transcribe(req.file.buffer.toString('base64'), fmt)
      success(res, { text })
    } catch (err) {
      next(err)
    }
  }

  async parse(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid']
      const text = (req.body && req.body.text != null) ? String(req.body.text).trim() : ''
      if (!text) {
        throw { type: 'VALIDATION_ERROR', message: '未收到语音文字' }
      }
      if (text.length > 2000) {
        throw { type: 'VALIDATION_ERROR', message: '语音文字过长（最多 2000 字）' }
      }
      const { id: taskId } = await voiceService.createTask(openid, text)

      // 交由后台 worker 认领处理（受并发限流、重启可恢复），即时催一次降低延迟
      taskWorker.nudge()

      success(res, { taskId }, '提交成功')
    } catch (err) {
      next(err)
    }
  }

  async status(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid']
      const taskId = parseInt(req.params.taskId)
      if (!taskId) {
        throw { type: 'VALIDATION_ERROR', message: 'taskId 无效' }
      }
      const data = await voiceService.getTaskStatus(taskId, openid)
      success(res, data)
    } catch (err) {
      next(err)
    }
  }

  async result(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid']
      const taskId = parseInt(req.params.taskId)
      if (!taskId) {
        throw { type: 'VALIDATION_ERROR', message: 'taskId 无效' }
      }
      const data = await voiceService.getTaskResult(taskId, openid)
      success(res, data)
    } catch (err) {
      next(err)
    }
  }

  async list(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid']
      const data = await voiceService.getTaskList(openid)
      success(res, data)
    } catch (err) {
      next(err)
    }
  }
}

module.exports = new VoiceController()
