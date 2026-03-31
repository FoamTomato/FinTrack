// 统一响应封装
const success = (res, data = null, message = 'ok') => {
  res.json({
    code: 0,
    message,
    data
  })
}

module.exports = { success }
