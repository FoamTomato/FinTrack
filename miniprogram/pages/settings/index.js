const app = getApp();
const API = require('../../utils/api');

Page({
  data: {
    userInfo: {
      nickname: '',
      avatarUrl: ''
    },
    showBindModal: false,
    tempNickname: '',
    tempAvatarUrl: ''
  },

  onShow() {
    this.fetchUserProfile();
  },

  async fetchUserProfile() {
    try {
      const res = await API.userProfile();
      this.setData({
        userInfo: {
          nickname: res.data.nickname || '',
          avatarUrl: res.data.avatarUrl || ''
        }
      });
    } catch (err) {
      console.error('Fetch profile failed', err);
    }
  },

  navTo(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({
        url,
        fail: () => wx.showToast({ title: '跳转失败', icon: 'none' })
      });
    }
  },

  showBind() {
    this.setData({
      showBindModal: true,
      tempNickname: this.data.userInfo.nickname,
      tempAvatarUrl: ''
    });
  },

  hideBind() {
    this.setData({ showBindModal: false, tempAvatarUrl: '' });
  },

  onChooseAvatar(e) {
    this.setData({ tempAvatarUrl: e.detail.avatarUrl });
  },

  onNicknameInput(e) {
    this.setData({ tempNickname: e.detail.value });
  },

  async confirmBind() {
    if (!this.data.tempNickname.trim()) {
      return wx.showToast({ title: '请输入昵称', icon: 'none' });
    }

    const finalAvatarUrl = this.data.tempAvatarUrl || this.data.userInfo.avatarUrl;

    try {
      wx.showLoading({ title: '保存中...' });
      await API.userUpdate(this.data.tempNickname.trim(), finalAvatarUrl);
      // 同步更新全局缓存
      app.globalData.userInfo = { nickname: this.data.tempNickname.trim(), avatarUrl: finalAvatarUrl };
      wx.setStorageSync('userInfo', { openid: app.globalData.openid, nickname: this.data.tempNickname.trim(), avatarUrl: finalAvatarUrl });
      wx.showToast({ title: '更新成功' });
      this.setData({ showBindModal: false });
      this.fetchUserProfile();
    } catch (err) {
      wx.showToast({ title: '更新失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});
