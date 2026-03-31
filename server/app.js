require('dotenv').config()

const express = require('express')
const cors = require('cors')
const app = express()

// ======== 静态文件 ========
const path = require('path')
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ======== 中间件 ========
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(require('./middleware/logger'))
app.use(require('./middleware/auth'))

// ======== 健康检查 ========
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// ======== 路由挂载 ========
app.use('/api/user', require('./routes/user'))
app.use('/api/transaction', require('./routes/transaction'))
app.use('/api/category', require('./routes/category'))
app.use('/api/group', require('./routes/group'))
app.use('/api/upload', require('./routes/upload'))

// ======== 错误处理（必须在路由之后） ========
app.use(require('./middleware/errorHandler'))

// ======== 启动服务 ========
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
