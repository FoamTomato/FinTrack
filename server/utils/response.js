// 统一响应封装
const success = (res, data = {}) => {
  res.json({
    code: 0,
    message: 'ok',
    data: data
  });
};

const error = (res, code = 5000, message = 'Internal Server Error') => {
  res.json({
    code: code,
    message: message
  });
};

module.exports = {
  success,
  error
};
