/**
 * 封装 wx.request 为 Promise
 *
 * @param {string} path  接口路径，如 '/api/user/login'
 * @param {string} method 请求方法 GET/POST
 * @param {object} data  请求参数
 * @returns {Promise}
 */
const request = (path, method = 'GET', data = {}) => {
  return new Promise((resolve, reject) => {
    const baseUrl = 'http://117.72.182.195';
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

/**
 * 封装 wx.uploadFile 为 Promise
 */
const uploadFile = (path, filePath, name = 'file') => {
  return new Promise((resolve, reject) => {
    const baseUrl = 'http://117.72.182.195';
    const app = getApp();
    const openid = (app && app.globalData && app.globalData.openid) || '';

    wx.uploadFile({
      url: baseUrl + path,
      filePath,
      name,
      header: { 'x-wx-openid': openid },
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (data.code === 0) {
            resolve(data);
          } else {
            reject({ message: data.message || '上传失败' });
          }
        } catch (e) {
          reject({ message: '解析响应失败' });
        }
      },
      fail: (err) => {
        reject({ message: '上传请求失败', ...err });
      }
    });
  });
};

const BASE_URL = 'http://117.72.182.195';

/** 将相对路径的图标 URL 补全为完整 URL */
const resolveIconUrl = (icon) => {
  if (!icon) return '';
  if (icon.startsWith('/')) return BASE_URL + icon;
  if (icon.startsWith('http')) return icon;
  return '';
};

module.exports = {
  request,
  uploadFile,
  resolveIconUrl
};
