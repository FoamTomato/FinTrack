const API = require('../../utils/api');
const Loading = require('../../utils/loading');

Page({
  /**
   * 页面数据
   */
  data: {
    currentType: 2,
    categories: [],
    showModal: false,
    editingId: null,
    newCategoryName: '',
    newCategoryIcon: ''
  },

  /**
   * 生命周期 —— 只做调度
   */
  onLoad() {
    this.fetchCategories();
  },

  /**
   * 事件处理 —— 切换收支类型
   */
  onSwitchType(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    if (type !== this.data.currentType) {
      this.setData({ currentType: type }, () => {
        this.fetchCategories();
      });
    }
  },

  /**
   * 数据获取 —— 分类树
   */
  async fetchCategories() {
    try {
      const res = await API.getCategoryTree(this.data.currentType);
      if (res.code === 0) {
        this.setData({ categories: res.data || [] });
      }
    } catch (err) {
      console.error('fetchCategories failed:', err);
      Loading.error('加载失败');
    }
  },

  /**
   * 事件处理 —— 跳转子分类详情
   */
  onGoToDetail(e) {
    const item = e.currentTarget.dataset.item;
    const jsonStr = JSON.stringify(item);
    wx.navigateTo({
      url: `/pages/category-detail/index?data=${encodeURIComponent(jsonStr)}`
    });
  },

  /**
   * 事件处理 —— 删除分类
   */
  onDeleteCategory(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，且会影响历史账单显示，确认删除？',
      success: async (res) => {
        if (!res.confirm) return;

        Loading.show('删除中...');
        try {
          const delRes = await API.deleteCategory(id);
          if (delRes.code === 0) {
            Loading.success('已删除');
            this.fetchCategories();
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
  },

  /**
   * 事件处理 —— 弹窗控制
   */
  onShowAddModal() {
    this.setData({ showModal: true, editingId: null, newCategoryName: '', newCategoryIcon: '' });
  },

  onStartEdit(e) {
    const { item } = e.currentTarget.dataset;
    if (item.is_default) {
      return Loading.toast('系统默认分类不可修改');
    }
    this.setData({
      showModal: true,
      editingId: item.id,
      newCategoryName: item.name,
      newCategoryIcon: item.icon
    });
  },

  onHideModal() {
    this.setData({ showModal: false, editingId: null });
  },

  onInputName(e) { this.setData({ newCategoryName: e.detail.value }); },
  onInputIcon(e) { this.setData({ newCategoryIcon: e.detail.value }); },

  /**
   * 事件处理 —— 确认新增/编辑（防重复）
   */
  async handleConfirm() {
    if (this._submitting) return;
    this._submitting = true;

    try {
      if (this.data.editingId) {
        await this.confirmEdit();
      } else {
        await this.confirmAdd();
      }
    } finally {
      this._submitting = false;
    }
  },

  async confirmEdit() {
    const { editingId, newCategoryName, newCategoryIcon } = this.data;
    if (!newCategoryName.trim()) {
      return Loading.toast('请输入名称');
    }

    Loading.show('保存中...');
    try {
      const res = await API.updateCategory({
        id: editingId,
        name: newCategoryName,
        icon: newCategoryIcon
      });

      if (res.code === 0) {
        Loading.success('已保存');
        this.onHideModal();
        this.fetchCategories();
      } else {
        Loading.error(res.msg || '保存失败');
      }
    } catch (err) {
      Loading.error('网络异常');
    } finally {
      Loading.hide();
    }
  },

  async confirmAdd() {
    const { newCategoryName, newCategoryIcon, currentType } = this.data;
    if (!newCategoryName.trim()) {
      return Loading.toast('请输入名称');
    }

    Loading.show('添加中...');
    try {
      const res = await API.createCategory({
        name: newCategoryName,
        type: currentType,
        icon: newCategoryIcon || (currentType === 1 ? '💰' : '🏷️'),
        parentId: 0
      });

      if (res.code === 0) {
        Loading.success('添加成功');
        this.onHideModal();
        this.fetchCategories();
      } else {
        Loading.error(res.msg || '添加失败');
      }
    } catch (err) {
      Loading.error('网络异常');
    } finally {
      Loading.hide();
    }
  }
});
