const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// 记一笔
router.post('/create', transactionController.create);
// 查列表
router.get('/list', transactionController.list);
// 查统计
router.get('/stats', (req, res, next) => transactionController.stats(req, res, next));
// 首页仪表盘 (聚合)
router.get('/dashboard', (req, res, next) => transactionController.dashboard(req, res, next));
// 月度趋势对比
router.get('/trend', (req, res, next) => transactionController.trend(req, res, next));
// 统计分析
router.get('/analysis', (req, res, next) => transactionController.analysis(req, res, next));

// 删除账单
router.post('/delete', transactionController.delete);

module.exports = router;
