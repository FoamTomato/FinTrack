const app = getApp();
const Loading = require('../../utils/loading');

Page({
  /**
   * 页面数据
   */
  data: {
    avatarUrl: '',
    nickname: '',
    submitting: false,
    canSubmit: false
  },

  /**
   * 事件处理 —— 选择头像（从相册或相机）
   */
  onChooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ avatarUrl: res.tempFiles[0].tempFilePath });
        this._updateCanSubmit();
      }
    });
  },

  /**
   * 事件处理 —— 昵称输入
   */
  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value.trim() });
    this._updateCanSubmit();
  },

  _updateCanSubmit() {
    const { avatarUrl, nickname } = this.data;
    this.setData({ canSubmit: !!(avatarUrl && nickname) });
  },

  /**
   * 事件处理 —— 提交授权（防重复）
   */
  async handleSubmit() {
    if (this.data.submitting || !this.data.canSubmit) return;

    const { nickname, avatarUrl } = this.data;
    this.setData({ submitting: true });

    Loading.show('登录中...');
    try {
      const success = await app.updateUserInfo(nickname, avatarUrl);

      if (success) {
        Loading.success('登录成功');
        wx.reLaunch({ url: '/pages/home/index' });
      } else {
        Loading.error('登录失败，请重试');
        this.setData({ submitting: false });
      }
    } catch (err) {
      Loading.error(err.message || '登录失败');
      this.setData({ submitting: false });
    } finally {
      Loading.hide();
    }
  }
});
