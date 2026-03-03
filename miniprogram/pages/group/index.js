const app = getApp();
const { request } = require('../../utils/request');

Page({
  data: {
    activeTab: 0, // 0: 我的小组, 1: 加入/创建
    myGroups: [],
    loading: true,
    
    // 输入绑定
    newGroupName: '',
    inviteCodeInput: '',
    
    // 弹窗控制
    showMembersModal: false,
    currentMembers: [],
    currentGroup: null
  },

  onLoad() {
    this.fetchMyGroups();
  },

  onPullDownRefresh() {
    this.fetchMyGroups().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  switchTab(e) {
    const idx = parseInt(e.currentTarget.dataset.index);
    this.setData({ activeTab: idx });
  },

  onInputName(e) {
    this.setData({ newGroupName: e.detail.value });
  },

  onInputCode(e) {
    this.setData({ inviteCodeInput: e.detail.value });
  },

  stopPop() {
    // 阻止冒泡
    return;
  },

  // 获取小组列表
  async fetchMyGroups() {
    try {
      this.setData({ loading: true });
      const res = await request('/api/group/list', 'GET');
      if (res.code === 0) {
        this.setData({ myGroups: res.data || [] });
      }
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 创建小组
  async onCreateGroup() {
    if (!this.data.newGroupName.trim()) {
      return wx.showToast({ title: '请输入小组名称', icon: 'none' });
    }
    
    try {
      wx.showLoading({ title: '创建中' });
      const res = await request('/api/group/create', 'POST', { name: this.data.newGroupName });
      if (res.code === 0) {
        wx.showToast({ title: '创建成功' });
        this.setData({ newGroupName: '', activeTab: 0 }); // 切回列表
        this.fetchMyGroups();
      } else {
        wx.showToast({ title: res.msg || '创建失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 加入小组
  async onJoinGroup() {
    if (!this.data.inviteCodeInput.trim()) {
      return wx.showToast({ title: '请输入邀请码', icon: 'none' });
    }

    try {
      wx.showLoading({ title: '加入中' });
      const res = await request('/api/group/join', 'POST', { inviteCode: this.data.inviteCodeInput });
      if (res.code === 0) {
        wx.showToast({ title: '加入成功' });
        this.setData({ inviteCodeInput: '', activeTab: 0 });
        this.fetchMyGroups();
      } else {
        wx.showToast({ title: res.message || res.msg || '加入失败', icon: 'none' });
      }
    } catch (err) {
      const msg = err.message || '网络异常';
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 查看成员详情
  async viewMembers(e) {
    const group = e.currentTarget.dataset.group;
    this.setData({ currentGroup: group });
    
    try {
      wx.showLoading({ title: '加载成员' });
      const res = await request('/api/group/members', 'GET', { id: group.id });
      if (res.code === 0) {
        this.setData({ 
          currentMembers: res.data,
          showMembersModal: true 
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      wx.hideLoading();
    }
  },

  closeMembersModal() {
    this.setData({ showMembersModal: false });
  },

  // 复制邀请码
  copyCode(e) {
    const code = e.currentTarget.dataset.code;
    wx.setClipboardData({
      data: code,
      success: () => wx.showToast({ title: '邀请码已复制' })
    });
  }
});
