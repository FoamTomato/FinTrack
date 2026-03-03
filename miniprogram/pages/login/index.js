const app = getApp();

Page({
  data: {
    phase: 'welcome',   // 'welcome' | 'setup'
    avatarUrl: '',
    nickname: '',
    submitting: false,
    canSubmit: false
  },

  /** 点击"使用微信账号登录"，进入信息填写阶段 */
  handleStart() {
    this.setData({ phase: 'setup' });
  },

  /** 选择微信头像（open-type="chooseAvatar" 回调） */
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    if (avatarUrl) {
      this.setData({ avatarUrl });
      this._updateCanSubmit();
    }
  },

  /** 昵称输入（type="nickname" 支持自动填充微信昵称） */
  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value.trim() });
    this._updateCanSubmit();
  },

  _updateCanSubmit() {
    const { avatarUrl, nickname } = this.data;
    this.setData({ canSubmit: !!(avatarUrl && nickname) });
  },

  /** 提交授权信息，完成登录 */
  async handleSubmit() {
    if (this.data.submitting || !this.data.canSubmit) return;

    const { nickname, avatarUrl } = this.data;
    this.setData({ submitting: true });

    try {
      wx.showLoading({ title: '登录中...' });
      const success = await app.updateUserInfo(nickname, avatarUrl);
      wx.hideLoading();

      if (success) {
        wx.reLaunch({ url: '/pages/home/index' });
      } else {
        wx.showToast({ title: '登录失败，请重试', icon: 'none' });
        this.setData({ submitting: false });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '登录失败', icon: 'none' });
      this.setData({ submitting: false });
    }
  }
});
