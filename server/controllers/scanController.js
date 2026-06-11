const scanService = require('../services/scanService')
const taskWorker = require('../services/taskWorker')
const { success } = require('../utils/response')

class ScanController {
  async upload(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid']
      if (!req.file) {
        throw { type: 'VALIDATION_ERROR', message: '未收到图片文件' }
      }
      // 存储相对路径（相对于 server/ 目录）
      const imageUrl = `uploads/scan/${req.file.filename}`
      const { id: taskId } = await scanService.createTask(openid, imageUrl)

      // 交由后台 worker 认领处理（受并发限流、重启可恢复），即时催一次降低延迟
      taskWorker.nudge()

      success(res, { taskId }, '上传成功')
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
      const data = await scanService.getTaskStatus(taskId, openid)
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
      const data = await scanService.getTaskResult(taskId, openid)
      success(res, data)
    } catch (err) {
      next(err)
    }
  }

  async list(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid']
      const data = await scanService.getTaskList(openid)
      success(res, data)
    } catch (err) {
      next(err)
    }
  }
}

module.exports = new ScanController()
