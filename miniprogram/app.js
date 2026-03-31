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
      if (cachedUser && cachedUser.openid && cachedUser.nickname) {
        this.globalData.openid = cachedUser.openid;
        this.globalData.userInfo = { nickname: cachedUser.nickname, avatarUrl: validAvatar(cachedUser.avatarUrl) };
        this.globalData.isAuthorized = true;
        console.log('使用缓存用户信息:', cachedUser);
        this._notifyLoginCallbacks(true);
        return;
      }

      // 第一步：wx.login 获取 code
      const loginRes = await this.wxLogin();
      console.log('wx.login 成功, code:', loginRes.code);

      // 第二步：发送 code 到后端，换取 openid
      const res = await API.userLogin(loginRes.code);
      const { openid, nickname, avatarUrl, isNew } = res.data;

      // 保存 openid 到全局
      this.globalData.openid = openid;

      if (!isNew && nickname) {
        // 用户已授权，存储到缓存
        const safeAvatar = validAvatar(avatarUrl);
        const userInfo = { openid, nickname, avatarUrl: safeAvatar };
        wx.setStorage({ key: 'userInfo', data: userInfo });
        this.globalData.userInfo = { nickname, avatarUrl: safeAvatar };
        this.globalData.isAuthorized = true;
      } else {
        // 未授权，需要在授权页完成授权
        this.globalData.isAuthorized = false;
      }
    } catch (err) {
      // 40163: code 已被使用，用新 code 重试一次
      const isCodeUsed = err && (err.message || '').includes('code been used');
      if (isCodeUsed && !retried) {
        console.warn('code 已使用，正在用新 code 重试...');
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

    // 未授权时跳转到登录页
    if (!this.globalData.isAuthorized) {
      wx.reLaunch({ url: '/pages/login/index' });
    }
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
