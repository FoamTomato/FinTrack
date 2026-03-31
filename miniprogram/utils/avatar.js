/**
 * 头像工具类
 * 微信小程序 <image> 组件不再支持 HTTP 协议，
 * 需要先用 wx.downloadFile 下载到本地临时路径再展示。
 */

/**
 * 将远程头像 URL 下载为本地临时路径
 * @param {string} url - 头像 URL（HTTP/HTTPS）
 * @returns {Promise<string>} 本地临时文件路径，失败返回空字符串
 */
function downloadAvatar(url) {
  if (!url || !url.startsWith('http')) return Promise.resolve('');

  return new Promise((resolve) => {
    wx.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.tempFilePath);
        } else {
          resolve('');
        }
      },
      fail: () => resolve('')
    });
  });
}

module.exports = { downloadAvatar };
