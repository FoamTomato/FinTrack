const express = require('express')
const router = express.Router()
const multer = require('multer')
const voiceController = require('../controllers/voiceController')

// 音频走内存，转完即丢，无需落盘
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
})

router.post('/transcribe', audioUpload.single('audio'), (req, res, next) => voiceController.transcribe(req, res, next))
router.post('/parse', (req, res, next) => voiceController.parse(req, res, next))
router.get('/list', (req, res, next) => voiceController.list(req, res, next))
router.get('/status/:taskId', (req, res, next) => voiceController.status(req, res, next))
router.get('/result/:taskId', (req, res, next) => voiceController.result(req, res, next))

module.exports = router
