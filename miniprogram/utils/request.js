const BASE_URL = 'https://xiaohang.site';

/**
 * 判断当前运行的小程序版本：
 *   release → 正式版   → 生产环境
 *   trial   → 体验版   → 测试环境
 *   develop → 开发版   → 测试环境
 * 非 release 一律走测试，把 URL 中的 /api/ 替换为 /api-test/，/uploads/ 替换为 /uploads-test/
 */
function isTestEnv() {
  try {
    const env = wx.getAccountInfoSync().miniProgram.envVersion;
    return env !== 'release';
  } catch (e) {
    return true;
  }
}

function resolvePath(path) {
  if (!isTestEnv()) return path;
  return path
    .replace(/^\/api\//, '/api-test/')
    .replace(/^\/uploads\//, '/uploads-test/');
}

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
    const app = getApp();
    const openid = (app && app.globalData && app.globalData.openid) || '';

    wx.request({
      url: BASE_URL + resolvePath(path),
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
    const app = getApp();
    const openid = (app && app.globalData && app.globalData.openid) || '';

    wx.uploadFile({
      url: BASE_URL + resolvePath(path),
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

/** 将相对路径的图标 URL 补全为完整 URL（按环境切换 /uploads 前缀）*/
const resolveIconUrl = (icon) => {
  if (!icon) return '';
  if (icon.startsWith('/')) return BASE_URL + resolvePath(icon);
  if (icon.startsWith('http')) return icon;
  return '';
};

module.exports = {
  request,
  uploadFile,
  resolveIconUrl
};
