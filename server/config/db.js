const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// 仅在非生产环境加载 .env 文件
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// 验证必需的环境变量
const requiredEnvVars = ['MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_USERNAME', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// 创建连接池
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+08:00',
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

// 测试连接
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ MySQL Database connection failed:', error.message);
    }
})();

module.exports = pool;
