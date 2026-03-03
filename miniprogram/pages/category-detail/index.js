const app = getApp();
const { request } = require('../../utils/request');

Page({
  data: {
    category: {},
    subCategories: [],
    loading: true,
    newSubName: ''
  },

  onLoad(options) {
    if (options.data) {
      try {
        const category = JSON.parse(decodeURIComponent(options.data));
        this.setData({ category });
        this.fetchSubCategories(category.id);
      } catch (e) {
        console.error(e);
      }
    }
  },

  // 获取子分类
  async fetchSubCategories(parentId) {
    try {
      this.setData({ loading: true });
      // 复用 category/tree 接口，type 传当前分类的 type
      // 但其实我们需要一个新的接口或者让 tree 支持 parentId 过滤
      // 暂时我们先获取全量树，然后前端筛选 (简单方案)
      // 或者：后端 update getTree to check parentId?
      // 更好的方案：新增 /api/category/list?parentId=xxx
      
      const res = await request('/api/category/list', 'GET', { parentId });
      if (res.code === 0) {
        this.setData({ subCategories: res.data || [] });
      }
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onInputSubName(e) {
    this.setData({ newSubName: e.detail.value });
  },

  // 添加子分类
  async addSubCategory() {
    const { newSubName, category } = this.data;
    if (!newSubName.trim()) {
      return wx.showToast({ title: '请输入名称', icon: 'none' });
    }

    try {
      wx.showLoading({ title: '添加中' });
      const res = await request('/api/category/create', 'POST', {
        name: newSubName,
        type: category.type,
        parentId: category.id,
        icon: '' // 子分类不再强制使用图标，UI已针对纯文本优化
      });

      if (res.code === 0) {
        wx.showToast({ title: '已添加' });
        this.setData({ newSubName: '' });
        this.fetchSubCategories(category.id);
      } else {
        wx.showToast({ title: res.msg || '添加失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 删除子分类
  async deleteSubCategory(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确认删除？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const delRes = await request('/api/category/delete', 'POST', { id });
            if (delRes.code === 0) {
              wx.showToast({ title: '已删除' });
              this.fetchSubCategories(this.data.category.id);
            } else {
              wx.showToast({ title: delRes.msg || '删除失败', icon: 'none' });
            }
          } catch (err) {
            wx.showToast({ title: '网络异常', icon: 'none' });
          }
        }
      }
    });
  }
});
