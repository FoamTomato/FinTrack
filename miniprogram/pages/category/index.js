const app = getApp();
const { request } = require('../../utils/request');

Page({
  data: {
    currentType: 2, // 默认支出
    categories: [],
    
    // 弹窗
    showModal: false,
    newCategoryName: '',
    newCategoryIcon: ''
  },

  onLoad() {
    this.fetchCategories();
  },

  switchType(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    if (type !== this.data.currentType) {
      this.setData({ currentType: type }, () => {
        this.fetchCategories();
      });
    }
  },

  async fetchCategories() {
    try {
      const res = await request('/api/category/tree', 'GET', { type: this.data.currentType });
      if (res.code === 0) {
        this.setData({ categories: res.data || [] });
      }
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 跳转详情页 (子分类管理)
  goToDetail(e) {
    const item = e.currentTarget.dataset.item;
    const jsonStr = JSON.stringify(item);
    wx.navigateTo({
      url: `/pages/category-detail/index?data=${encodeURIComponent(jsonStr)}`
    });
  },

  // 删除分类
  deleteCategory(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，且会影响历史账单显示，确认删除？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const delRes = await request('/api/category/delete', 'POST', { id });
            if (delRes.code === 0) {
              wx.showToast({ title: '已删除' });
              this.fetchCategories();
            } else {
              wx.showToast({ title: delRes.msg || '删除失败', icon: 'none' });
            }
          } catch (err) {
            wx.showToast({ title: '网络异常', icon: 'none' });
          }
        }
      }
    });
  },

  // 弹窗逻辑
  showAddModal() {
    this.setData({ showModal: true, editingId: null, newCategoryName: '', newCategoryIcon: '' });
  },

  startEdit(e) {
    const { item } = e.currentTarget.dataset;
    if (item.is_default) {
      return wx.showToast({ title: '系统默认分类不可修改', icon: 'none' });
    }
    this.setData({
      showModal: true,
      editingId: item.id,
      newCategoryName: item.name,
      newCategoryIcon: item.icon
    });
  },

  hideAddModal() {
    this.setData({ showModal: false, editingId: null });
  },

  onInputName(e) { this.setData({ newCategoryName: e.detail.value }) },
  onInputIcon(e) { this.setData({ newCategoryIcon: e.detail.value }) },

  async handleConfirm() {
    if (this.data.editingId) {
      this.confirmEdit();
    } else {
      this.confirmAdd();
    }
  },

  async confirmEdit() {
    const { editingId, newCategoryName, newCategoryIcon } = this.data;
    if (!newCategoryName.trim()) {
      return wx.showToast({ title: '请输入名称', icon: 'none' });
    }

    try {
      wx.showLoading({ title: '保存中' });
      const res = await request('/api/category/update', 'POST', {
        id: editingId,
        name: newCategoryName,
        icon: newCategoryIcon
      });

      if (res.code === 0) {
        wx.showToast({ title: '已保存' });
        this.hideAddModal();
        this.fetchCategories();
      } else {
        wx.showToast({ title: res.msg || '保存失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async confirmAdd() {
    const { newCategoryName, newCategoryIcon, currentType } = this.data;
    if (!newCategoryName.trim()) {
      return wx.showToast({ title: '请输入名称', icon: 'none' });
    }

    try {
      wx.showLoading({ title: '添加中' });
      // TODO: 目前仅支持添加一级分类 parentId=0
      const res = await request('/api/category/create', 'POST', {
        name: newCategoryName,
        type: currentType, // 当前 Tab 的类型
        icon: newCategoryIcon || (currentType === 1 ? '💰' : '🏷️'),
        parentId: 0
      });

      if (res.code === 0) {
        wx.showToast({ title: '添加成功' });
        this.hideAddModal();
        this.fetchCategories();
      } else {
        wx.showToast({ title: res.msg || '添加失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});