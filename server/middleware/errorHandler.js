const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error Stack:', err.stack);
  
  // 区分不同类型的错误
  if (err.type === 'VALIDATION_ERROR') {
    return error(res, 4001, err.message);
  }

  // 默认服务器错误 — 始终返回具体信息便于调试
  error(res, 5001, err.message);
};

module.exports = errorHandler;
