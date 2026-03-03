const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// 获取分类树
router.get('/tree', categoryController.getTree.bind(categoryController));
// 获取分类列表
router.get('/list', categoryController.getList.bind(categoryController));

// 创建分类
router.post('/create', categoryController.create.bind(categoryController));

// 更新分类
router.post('/update', categoryController.update.bind(categoryController));

// 删除分类
router.post('/delete', categoryController.delete.bind(categoryController));

module.exports = router;
