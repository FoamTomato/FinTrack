const express = require('express')
const router = express.Router()
const categoryController = require('../controllers/categoryController')

// 获取分类树
router.get('/tree', (req, res, next) => categoryController.getTree(req, res, next))

// 获取分类列表
router.get('/list', (req, res, next) => categoryController.getList(req, res, next))

// 创建分类
router.post('/create', (req, res, next) => categoryController.create(req, res, next))

// 更新分类
router.post('/update', (req, res, next) => categoryController.update(req, res, next))

// 删除分类
router.post('/delete', (req, res, next) => categoryController.delete(req, res, next))

module.exports = router
