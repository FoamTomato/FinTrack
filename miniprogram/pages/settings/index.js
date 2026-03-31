const app = getApp();
const API = require('../../utils/api');
const Loading = require('../../utils/loading');

/** 过滤已失效的微信默认头像等无效 URL */
function validAvatar(url) {
  if (!url) return '';
  if (url.includes('mmbiz.qpic.cn/mmbiz/icTdbqWNOwBHc')) return '';
  if (url.startsWith('http://tmp/')) return '';
  return url;
}

Page({
  /**
   * 页面数据
   */
  data: {
    userInfo: {
      nickname: '',
      avatarUrl: ''
    },
    showBindModal: false,
    tempNickname: '',
    tempAvatarUrl: ''
  },

  /**
   * 生命周期 —— 只做调度
   */
  onShow() {
    this.fetchUserProfile();
  },

  /**
   * 数据获取 —— 用户信息
   */
  async fetchUserProfile() {
    try {
      const res = await API.userProfile();
      const safeAvatar = validAvatar(res.data.avatarUrl);
      this.setData({
        userInfo: {
          nickname: res.data.nickname || '',
          avatarUrl: safeAvatar
        }
      });
    } catch (err) {
      console.error('fetchUserProfile failed:', err);
    }
  },

  /**
   * 事件处理 —— 导航跳转
   */
  onNavTo(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({
        url,
        fail: () => Loading.toast('跳转失败')
      });
    }
  },

  /**
   * 事件处理 —— 弹窗控制
   */
  onShowBind() {
    this.setData({
      showBindModal: true,
      tempNickname: this.data.userInfo.nickname,
      tempAvatarUrl: ''
    });
  },

  onHideBind() {
    this.setData({ showBindModal: false, tempAvatarUrl: '' });
  },

  onChooseAvatar(e) {
    this.setData({ tempAvatarUrl: e.detail.avatarUrl });
  },

  onNicknameInput(e) {
    this.setData({ tempNickname: e.detail.value });
  },

  onAvatarError() {
    this.setData({ 'userInfo.avatarUrl': '/images/icons/avatar.png' });
  },

  /**
   * 事件处理 —— 确认保存（防重复）
   */
  async onConfirmBind() {
    if (this._submitting) return;

    if (!this.data.tempNickname.trim()) {
      return Loading.toast('请输入昵称');
    }

    const finalAvatarUrl = validAvatar(this.data.tempAvatarUrl || this.data.userInfo.avatarUrl);

    this._submitting = true;
    Loading.show('保存中...');
    try {
      const nickname = this.data.tempNickname.trim();
      await API.userUpdate(nickname, finalAvatarUrl);

      // 更新全局数据和缓存
      app.globalData.userInfo = { nickname, avatarUrl: finalAvatarUrl };
      wx.setStorageSync('userInfo', {
        openid: app.globalData.openid,
        nickname,
        avatarUrl: finalAvatarUrl
      });

      Loading.success('更新成功');
      this.setData({ showBindModal: false });
      this.fetchUserProfile();
    } catch (err) {
      Loading.error('更新失败');
    } finally {
      Loading.hide();
      this._submitting = false;
    }
  }
});
