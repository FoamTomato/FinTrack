const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

// 创建小组
router.post('/create', groupController.create.bind(groupController));

// 加入小组
router.post('/join', groupController.join.bind(groupController));

// 我的小组列表
router.get('/list', groupController.list.bind(groupController));

// 小组成员列表 (传入 ?id=groupId)
router.get('/members', groupController.members.bind(groupController));

module.exports = router;
