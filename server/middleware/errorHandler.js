const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  console.error(`[Error] ${req.method} ${req.url}:`, err)

  // 业务校验错误
  if (err.type === 'VALIDATION_ERROR') {
    return res.json({
      code: 4001,
      message: err.message || '参数错误'
    })
  }

  // 服务器内部错误
  res.json({
    code: 5001,
    message: err.message || '服务器内部错误'
  })
}

module.exports = errorHandler
