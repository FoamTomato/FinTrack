/**
 * 封装 wx.request 为 Promise
 * 直接调用微信云托管公网地址
 *
 * @param {string} path  接口路径，如 '/api/user/login'
 * @param {string} method 请求方法 GET/POST
 * @param {object} data  请求参数
 * @returns {Promise}
 */
const request = (path, method = 'GET', data = {}) => {
  return new Promise((resolve, reject) => {
    const baseUrl = 'https://express-ncb7-224779-6-1403690123.sh.run.tcloudbase.com';
    const app = getApp();
    const openid = (app && app.globalData && app.globalData.openid) || '';

    wx.request({
      url: baseUrl + path,
      method,
      header: {
        'Content-Type': 'application/json',
        'x-wx-openid': openid
      },
      data,
      timeout: 15000,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.code === 0) {
          resolve(res.data);
        } else {
          const errMsg = (res.data && res.data.message) || '请求异常';
          reject({ message: errMsg, ...res.data });
        }
      },
      fail: (err) => {
        console.error('请求失败:', path, err);
        reject({ message: '网络请求失败', ...err });
      }
    });
  });
};

module.exports = {
  request
};
