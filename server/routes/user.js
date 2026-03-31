const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')

// 登录（wx.login code 换 openid）
router.post('/login', (req, res, next) => userController.login(req, res, next))

// 获取个人档案
router.get('/profile', (req, res, next) => userController.getProfile(req, res, next))

// 绑定/更新个人信息
router.post('/update', (req, res, next) => userController.updateProfile(req, res, next))

module.exports = router
