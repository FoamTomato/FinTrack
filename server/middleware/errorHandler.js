const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error Stack:', err.stack);
  
  // 区分不同类型的错误
  if (err.type === 'VALIDATION_ERROR') {
    return error(res, 4001, err.message);
  }

  // 默认服务器错误
  error(res, 5001, process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message);
};

module.exports = errorHandler;
