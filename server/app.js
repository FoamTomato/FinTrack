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

// 仅在非生产环境加载 .env 文件
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// 验证必需的环境变量
const requiredEnvVars = ['WX_APPID', 'WX_SECRET', 'PORT'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT;

// 基础中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// 健康检查
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
  console.log(`deployment environment: Docker Self-hosted`);
});
