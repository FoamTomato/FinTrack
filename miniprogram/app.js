// app.js
const API = require('./utils/api');

/** 过滤已失效的微信默认头像等无效 URL */
function validAvatar(url) {
  if (!url) return '';
  if (url.includes('mmbiz.qpic.cn/mmbiz/icTdbqWNOwBHc')) return '';
  return url;
}

/** 判断是否为临时文件路径（需要上传） */
function isTempFile(url) {
  if (!url) return false;
  return url.startsWith('http://tmp/') || url.startsWith('wxfile://');
}

App({
  onLaunch() {
    this.globalData = {
      openid: '',        // 用户 openid
      userInfo: null,    // 用户信息（昵称、头像）
      isAuthorized: null // null=检查中, true=已授权, false=未授权
    };
    this._loginCallbacks = [];
    this._loginChecking = false;

    // 登录并检查用户状态
    this.loginAndCheck();
  },

  /**
   * 注册登录完成回调。
   * 如果登录检查已完成，立即执行；否则等待完成后执行。
   */
  onLoginReady(cb) {
    if (this.globalData.isAuthorized !== null) {
      cb(this.globalData.isAuthorized);
    } else {
      this._loginCallbacks.push(cb);
    }
  },

  /**
   * 调用 wx.login 获取 code，发送到后端换 openid，并检查授权状态。
   * retried=true 表示这是一次重试，防止无限循环。
   */
  async loginAndCheck(retried = false) {
    // 防止并发重入（如 DevTools 快速重编译触发多次 onLaunch）
    if (this._loginChecking) return;
    this._loginChecking = true;

    try {
      // 先检查本地缓存
      const cachedUser = wx.getStorageSync('userInfo');
      if (cachedUser && cachedUser.openid) {
        this.globalData.openid = cachedUser.openid;
        this.globalData.userInfo = {
          nickname: cachedUser.nickname || '',
          avatarUrl: validAvatar(cachedUser.avatarUrl)
        };
        this.globalData.isAuthorized = true;
        this._notifyLoginCallbacks(true);
        return;
      }

      // 第一步：wx.login 获取 code
      const loginRes = await this.wxLogin();

      // 第二步：发送 code 到后端，后端若是首次会用默认昵称自动建号
      const res = await API.userLogin(loginRes.code);
      const { openid, nickname, avatarUrl } = res.data;

      const safeAvatar = validAvatar(avatarUrl);
      this.globalData.openid = openid;
      this.globalData.userInfo = { nickname: nickname || '', avatarUrl: safeAvatar };
      this.globalData.isAuthorized = true;
      wx.setStorage({ key: 'userInfo', data: { openid, nickname, avatarUrl: safeAvatar } });
    } catch (err) {
      // 40163: code 已被使用，用新 code 重试一次
      const isCodeUsed = err && (err.message || '').includes('code been used');
      if (isCodeUsed && !retried) {
        this._loginChecking = false;
        this.loginAndCheck(true);
        return;
      }
      console.error('登录失败:', err);
      this.globalData.isAuthorized = false;
    } finally {
      this._loginChecking = false;
    }

    this._notifyLoginCallbacks(this.globalData.isAuthorized);
  },

  /**
   * 通知所有等待的回调
   */
  _notifyLoginCallbacks(authorized) {
    this._loginCallbacks.forEach(cb => cb(authorized));
    this._loginCallbacks = [];
  },

  /**
   * 用户完成授权后调用，更新用户信息
   */
  async updateUserInfo(nickname, avatarUrl) {
    try {
      let finalAvatar = validAvatar(avatarUrl);

      // 临时文件需要先上传到服务器
      if (isTempFile(avatarUrl)) {
        const uploadRes = await API.uploadAvatar(avatarUrl);
        finalAvatar = uploadRes.data.url;
      }

      const res = await API.userUpdate(nickname, finalAvatar);
      if (res.code === 0) {
        this.globalData.userInfo = { nickname, avatarUrl: finalAvatar };
        const userInfo = { openid: this.globalData.openid, nickname, avatarUrl: finalAvatar };
        wx.setStorage({ key: 'userInfo', data: userInfo });
        return true;
      }
    } catch (err) {
      console.error('更新用户信息失败:', err);
    }
    return false;
  },

  /** 将 wx.login 封装为 Promise */
  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: reject
      });
    });
  }
});
