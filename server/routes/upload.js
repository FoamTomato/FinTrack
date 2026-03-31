const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const db = require('../config/db')

// ======== 头像上传 ========

const avatarDir = path.join(__dirname, '..', 'uploads', 'avatar')
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true })
}

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const openid = req.headers['x-wx-openid'] || 'unknown'
    const ext = path.extname(file.originalname) || '.png'
    cb(null, `${openid}${ext}`)
  }
})

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true)
    else cb(new Error('只允许上传图片文件'))
  }
})

router.post('/avatar', avatarUpload.single('file'), (req, res) => {
  if (!req.file) return res.json({ code: 1, message: '未收到文件' })
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const url = `${protocol}://${host}/uploads/avatar/${req.file.filename}?t=${Date.now()}`
  res.json({ code: 0, data: { url }, message: '上传成功' })
})

// ======== 分类图标上传 ========

const iconDir = path.join(__dirname, '..', 'uploads', 'icon')
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true })
}

const iconStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, iconDir),
  filename: (req, file, cb) => {
    const openid = req.headers['x-wx-openid'] || 'unknown'
    const ext = path.extname(file.originalname) || '.png'
    cb(null, `${openid}_${Date.now()}${ext}`)
  }
})

const iconUpload = multer({
  storage: iconStorage,
  limits: { fileSize: 512 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true)
    else cb(new Error('只允许上传图片文件'))
  }
})

router.post('/icon', iconUpload.single('file'), async (req, res) => {
  if (!req.file) return res.json({ code: 1, message: '未收到文件' })
  const openid = req.headers['x-wx-openid']
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const url = `${protocol}://${host}/uploads/icon/${req.file.filename}?t=${Date.now()}`

  // 自动存入用户图标库
  try {
    await db.execute('INSERT INTO user_icons (openid, url) VALUES (?, ?)', [openid, url])
  } catch (err) {
    console.error('保存用户图标记录失败:', err)
  }

  res.json({ code: 0, data: { url }, message: '上传成功' })
})

// ======== 查询用户图标库 ========

router.get('/icons', async (req, res) => {
  const openid = req.headers['x-wx-openid']
  try {
    const [rows] = await db.execute(
      'SELECT id, url FROM user_icons WHERE openid = ? ORDER BY created_at DESC',
      [openid]
    )
    res.json({ code: 0, data: rows })
  } catch (err) {
    console.error('查询用户图标失败:', err)
    res.json({ code: 1, message: '查询失败' })
  }
})

module.exports = router
