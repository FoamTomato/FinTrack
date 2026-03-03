// app.js
const API = require('./utils/api');

App({
  onLaunch() {
    // 云开发初始化（traceUser 用于云托管日志追踪用户）
    wx.cloud.init({
      env: 'prod-7giupeh49138bbcf',
      traceUser: true
    });

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
        this.globalData.userInfo = { nickname: cachedUser.nickname, avatarUrl: cachedUser.avatarUrl };
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

      if (!isNew && nickname && avatarUrl) {
        // 用户已授权，存储到缓存
        const userInfo = { openid, nickname, avatarUrl };
        wx.setStorage({ key: 'userInfo', data: userInfo });
        this.globalData.userInfo = { nickname, avatarUrl };
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
      const res = await API.userUpdate(nickname, avatarUrl);
      if (res.code === 0) {
        this.globalData.userInfo = { nickname, avatarUrl };
        // 更新缓存
        const userInfo = { openid: this.globalData.openid, nickname, avatarUrl };
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
