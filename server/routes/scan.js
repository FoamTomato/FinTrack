const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const scanController = require('../controllers/scanController')

const scanDir = path.join(__dirname, '..', 'uploads', 'scan')
if (!fs.existsSync(scanDir)) {
  fs.mkdirSync(scanDir, { recursive: true })
}

const scanStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, scanDir),
  filename: (req, file, cb) => {
    const openid = req.headers['x-wx-openid'] || 'unknown'
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, `${openid}_${Date.now()}${ext}`)
  }
})

const scanUpload = multer({
  storage: scanStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true)
    else cb(new Error('只允许上传图片文件'))
  }
})

router.post('/upload', scanUpload.single('file'), (req, res, next) => scanController.upload(req, res, next))
router.get('/list', (req, res, next) => scanController.list(req, res, next))
router.get('/status/:taskId', (req, res, next) => scanController.status(req, res, next))
router.get('/result/:taskId', (req, res, next) => scanController.result(req, res, next))

module.exports = router
