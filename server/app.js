const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const requestLogger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const { success } = require('./utils/response');

// 路由
const transactionRouter = require('./routes/transaction');
const categoryRouter = require('./routes/category');
const groupRouter = require('./routes/group');
const userRouter = require('./routes/user');

// 环境变量加载
dotenv.config();

const app = express();
const PORT = process.env.PORT || 80;

// 基础中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// 健康检查 (微信云托管必需)
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

// API 路由
app.use('/api/transaction', transactionRouter);
app.use('/api/category', categoryRouter);
app.use('/api/group', groupRouter);
app.use('/api/user', userRouter);

// 全局错误处理
app.use(errorHandler);

// 启动服务
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`deployment environment: WeChat Cloud Hosting`);
});
