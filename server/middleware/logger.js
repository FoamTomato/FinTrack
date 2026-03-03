const morgan = require('morgan');

// 自定义日志格式
// [reqId] POST /api/order/create 120ms
const requestLogger = morgan((tokens, req, res) => {
  const reqId = req.headers['x-request-id'] || 'NO_ID';
  return [
    `[${reqId}]`,
    tokens.method(req, res),
    tokens.url(req, res),
    tokens['response-time'](req, res), 'ms'
  ].join(' ');
});

module.exports = requestLogger;
