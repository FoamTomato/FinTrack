const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 登录（wx.login code 换 openid）
router.post('/login', userController.login.bind(userController));

// 获取个人档案
router.get('/profile', userController.getProfile.bind(userController));

// 绑定/更新个人信息
router.post('/update', userController.updateProfile.bind(userController));

module.exports = router;
