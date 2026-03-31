const express = require('express')
const router = express.Router()
const groupController = require('../controllers/groupController')

// 创建小组
router.post('/create', (req, res, next) => groupController.create(req, res, next))

// 加入小组
router.post('/join', (req, res, next) => groupController.join(req, res, next))

// 我的小组列表
router.get('/list', (req, res, next) => groupController.list(req, res, next))

// 小组成员列表
router.get('/members', (req, res, next) => groupController.members(req, res, next))

module.exports = router
