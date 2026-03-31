const API = require('../../utils/api');
const Loading = require('../../utils/loading');

Page({
  /**
   * 页面数据
   */
  data: {
    category: {},
    subCategories: [],
    loading: true,
    newSubName: ''
  },

  /**
   * 生命周期 —— 只做调度
   */
  onLoad(options) {
    if (options.data) {
      try {
        const category = JSON.parse(decodeURIComponent(options.data));
        this.setData({ category });
        this.fetchSubCategories(category.id);
      } catch (e) {
        console.error('onLoad parse failed:', e);
      }
    }
  },

  /**
   * 数据获取 —— 子分类列表
   */
  async fetchSubCategories(parentId) {
    this.setData({ loading: true });
    try {
      const res = await API.getCategoryList(parentId);
      if (res.code === 0) {
        this.setData({ subCategories: res.data || [] });
      }
    } catch (err) {
      console.error('fetchSubCategories failed:', err);
      Loading.error('加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 事件处理 —— 输入子分类名称
   */
  onInputSubName(e) {
    this.setData({ newSubName: e.detail.value });
  },

  /**
   * 事件处理 —— 添加子分类（防重复）
   */
  async onAddSubCategory() {
    if (this._submitting) return;

    const { newSubName, category } = this.data;
    if (!newSubName.trim()) {
      return Loading.toast('请输入名称');
    }

    this._submitting = true;
    Loading.show('添加中...');
    try {
      const res = await API.createCategory({
        name: newSubName,
        type: category.type,
        parentId: category.id,
        icon: ''
      });

      if (res.code === 0) {
        Loading.success('已添加');
        this.setData({ newSubName: '' });
        this.fetchSubCategories(category.id);
      } else {
        Loading.error(res.msg || '添加失败');
      }
    } catch (err) {
      Loading.error('网络异常');
    } finally {
      Loading.hide();
      this._submitting = false;
    }
  },

  /**
   * 事件处理 —— 删除子分类
   */
  onDeleteSubCategory(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确认删除？',
      success: async (res) => {
        if (!res.confirm) return;

        Loading.show('删除中...');
        try {
          const delRes = await API.deleteCategory(id);
          if (delRes.code === 0) {
            Loading.success('已删除');
            this.fetchSubCategories(this.data.category.id);
          } else {
            Loading.error(delRes.msg || '删除失败');
          }
        } catch (err) {
          Loading.error('网络异常');
        } finally {
          Loading.hide();
        }
      }
    });
  }
});
