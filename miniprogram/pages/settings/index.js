const app = getApp();
const API = require('../../utils/api');
const Loading = require('../../utils/loading');
const { downloadAvatar } = require('../../utils/avatar');

/** 过滤已失效的微信默认头像等无效 URL */
function validAvatar(url) {
  if (!url) return '';
  if (url.includes('mmbiz.qpic.cn/mmbiz/icTdbqWNOwBHc')) return '';
  return url;
}

/** 判断是否为本地临时文件（需要上传到服务器） */
function isTempFile(url) {
  if (!url) return false;
  return url.startsWith('http://tmp/') || url.startsWith('wxfile://');
}

Page({
  /**
   * 页面数据
   */
  data: {
    userInfo: {
      nickname: '',
      avatarUrl: '',
      localAvatarUrl: ''
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
      // HTTP URL 无法在 <image> 组件中直接展示，需下载到本地
      const localPath = await downloadAvatar(safeAvatar);
      this.setData({
        userInfo: {
          nickname: res.data.nickname || '',
          avatarUrl: safeAvatar,
          localAvatarUrl: localPath
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
      tempAvatarUrl: this.data.userInfo.localAvatarUrl || ''
    });
  },

  onHideBind() {
    this.setData({ showBindModal: false, tempAvatarUrl: '' });
  },

  /**
   * 事件处理 —— 选择头像（open-type="chooseAvatar" 官方接口）
   * 用户在弹出的菜单里可选微信头像或从相册
   */
  onChooseAvatar(e) {
    const avatarUrl = e.detail && e.detail.avatarUrl;
    if (avatarUrl) this.setData({ tempAvatarUrl: avatarUrl });
  },

  onNicknameInput(e) {
    this.setData({ tempNickname: e.detail.value });
  },

  onAvatarError() {
    this.setData({ 'userInfo.localAvatarUrl': '/images/icons/avatar.png' });
  },

  /**
   * 事件处理 —— 确认保存（防重复）
   */
  async onConfirmBind() {
    if (this._submitting) return;

    if (!this.data.tempNickname.trim()) {
      return Loading.toast('请输入昵称');
    }

    const rawAvatarUrl = this.data.tempAvatarUrl || this.data.userInfo.avatarUrl;

    this._submitting = true;
    Loading.show('保存中...');
    try {
      const nickname = this.data.tempNickname.trim();

      // 本地临时文件先上传到服务器
      let finalAvatarUrl = validAvatar(rawAvatarUrl);
      if (isTempFile(rawAvatarUrl)) {
        const uploadRes = await API.uploadAvatar(rawAvatarUrl);
        finalAvatarUrl = uploadRes.data.url;
      }

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
      console.error('onConfirmBind failed:', err);
      Loading.error('更新失败');
    } finally {
      Loading.hide();
      this._submitting = false;
    }
  }
});
