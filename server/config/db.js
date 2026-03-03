const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// 创建连接池
// 使用腾讯云 CDB 数据库
let dbHost = process.env.MYSQL_HOST || 'sh-cynosdbmysql-grp-cq9vhtoy.sql.tencentcdb.com';
let dbPort = process.env.MYSQL_PORT || '21257';

// 创建连接池
const pool = mysql.createPool({
  host: dbHost,
  port: parseInt(dbPort),
  user: process.env.MYSQL_USERNAME || 'root',
  password: process.env.MYSQL_PASSWORD || 'vtb8MuRw',
  database: process.env.MYSQL_DATABASE || 'account_app',
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
