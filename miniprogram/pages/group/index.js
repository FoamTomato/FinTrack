const API = require('../../utils/api');
const Loading = require('../../utils/loading');

Page({
  /**
   * 页面数据
   */
  data: {
    activeTab: 0,
    myGroups: [],
    loading: true,
    newGroupName: '',
    inviteCodeInput: '',
    showMembersModal: false,
    currentMembers: [],
    currentGroup: null
  },

  /**
   * 生命周期 —— 只做调度
   */
  onLoad() {
    this.fetchMyGroups();
  },

  onPullDownRefresh() {
    this.fetchMyGroups().then(() => wx.stopPullDownRefresh());
  },

  /**
   * 事件处理 —— Tab 切换
   */
  onSwitchTab(e) {
    const idx = parseInt(e.currentTarget.dataset.index);
    this.setData({ activeTab: idx });
  },

  onInputName(e) {
    this.setData({ newGroupName: e.detail.value });
  },

  onInputCode(e) {
    this.setData({ inviteCodeInput: e.detail.value });
  },

  // 阻止冒泡
  stopPop() {},

  /**
   * 数据获取 —— 小组列表
   */
  async fetchMyGroups() {
    this.setData({ loading: true });
    try {
      const res = await API.getGroups();
      if (res.code === 0) {
        this.setData({ myGroups: res.data || [] });
      }
    } catch (err) {
      console.error('fetchMyGroups failed:', err);
      Loading.error('加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 事件处理 —— 创建小组（防重复）
   */
  async onCreateGroup() {
    if (this._submitting) return;

    if (!this.data.newGroupName.trim()) {
      return Loading.toast('请输入小组名称');
    }

    this._submitting = true;
    Loading.show('创建中...');
    try {
      const res = await API.createGroup(this.data.newGroupName);
      if (res.code === 0) {
        Loading.success('创建成功');
        this.setData({ newGroupName: '', activeTab: 0 });
        this.fetchMyGroups();
      } else {
        Loading.error(res.msg || '创建失败');
      }
    } catch (err) {
      Loading.error('网络异常');
    } finally {
      Loading.hide();
      this._submitting = false;
    }
  },

  /**
   * 事件处理 —— 加入小组（防重复）
   */
  async onJoinGroup() {
    if (this._submitting) return;

    if (!this.data.inviteCodeInput.trim()) {
      return Loading.toast('请输入邀请码');
    }

    this._submitting = true;
    Loading.show('加入中...');
    try {
      const res = await API.joinGroup(this.data.inviteCodeInput);
      if (res.code === 0) {
        Loading.success('加入成功');
        this.setData({ inviteCodeInput: '', activeTab: 0 });
        this.fetchMyGroups();
      } else {
        Loading.error(res.message || res.msg || '加入失败');
      }
    } catch (err) {
      Loading.error(err.message || '网络异常');
    } finally {
      Loading.hide();
      this._submitting = false;
    }
  },

  /**
   * 事件处理 —— 查看成员
   */
  async onViewMembers(e) {
    const group = e.currentTarget.dataset.group;
    this.setData({ currentGroup: group });

    Loading.show('加载成员...');
    try {
      const res = await API.getGroupMembers(group.id);
      if (res.code === 0) {
        this.setData({
          currentMembers: res.data,
          showMembersModal: true
        });
      }
    } catch (err) {
      console.error('onViewMembers failed:', err);
      Loading.error('加载失败');
    } finally {
      Loading.hide();
    }
  },

  onCloseMembersModal() {
    this.setData({ showMembersModal: false });
  },

  /**
   * 事件处理 —— 复制邀请码
   */
  onCopyCode(e) {
    const code = e.currentTarget.dataset.code;
    wx.setClipboardData({
      data: code,
      success: () => Loading.success('邀请码已复制')
    });
  }
});
