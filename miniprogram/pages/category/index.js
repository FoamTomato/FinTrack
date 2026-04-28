const API = require('../../utils/api');
const Loading = require('../../utils/loading');
const { resolveIconUrl } = require('../../utils/request');
const { PRESET_ICON_GROUPS } = require('../../utils/presetIcons');
const Logger = require('../../utils/logger');
const log = Logger.module('category');

Page({
  data: {
    currentType: 2,
    categories: [],
    showModal: false,
    editingId: null,
    newCategoryName: '',
    newCategoryIcon: '',
    newCategoryIconUrl: '',
    iconGroups: PRESET_ICON_GROUPS,
    iconGroupKey: PRESET_ICON_GROUPS[0].key,
    currentGroupIcons: PRESET_ICON_GROUPS[0].icons,
    userIcons: [],
    iconTab: 'preset'
  },

  onLoad() {
    this.fetchCategories();
  },

  onSwitchType(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    if (type !== this.data.currentType) {
      this.setData({ currentType: type }, () => this.fetchCategories());
    }
  },

  async fetchCategories() {
    try {
      const res = await API.getCategoryTree(this.data.currentType);
      if (res.code === 0) {
        const list = (res.data || []).map(item => ({
          ...item,
          iconUrl: resolveIconUrl(item.icon)
        }));
        this.setData({ categories: list });
      }
    } catch (err) {
      log.error('fetchCategories failed:', err);
      Loading.error('加载失败');
    }
  },

  onGoToDetail(e) {
    const item = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: `/pages/category-detail/index?data=${encodeURIComponent(JSON.stringify(item))}`
    });
  },

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

  // ======== 弹窗控制 ========

  onShowAddModal() {
    this.setData({
      showModal: true, editingId: null,
      newCategoryName: '', newCategoryIcon: '', newCategoryIconUrl: ''
    });
  },

  onStartEdit(e) {
    const { item } = e.currentTarget.dataset;
    if (item.is_default) return Loading.toast('系统默认分类不可修改');
    this.setData({
      showModal: true,
      editingId: item.id,
      newCategoryName: item.name,
      newCategoryIcon: item.icon,
      newCategoryIconUrl: resolveIconUrl(item.icon)
    });
  },

  onHideModal() {
    this.setData({ showModal: false, editingId: null });
  },

  onInputName(e) {
    this.setData({ newCategoryName: e.detail.value });
  },

  // ======== 图标选择 ========

  onSwitchIconTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ iconTab: tab });
    if (tab === 'mine' && this.data.userIcons.length === 0) {
      this.fetchUserIcons();
    }
  },

  async fetchUserIcons() {
    try {
      const res = await API.getUserIcons();
      if (res.code === 0) {
        this.setData({ userIcons: res.data || [] });
      }
    } catch (err) {
      log.error('fetchUserIcons failed:', err);
    }
  },

  onSelectPresetIcon(e) {
    const { url } = e.currentTarget.dataset;
    this.setData({ newCategoryIcon: url, newCategoryIconUrl: url });
  },

  onSwitchIconGroup(e) {
    const key = e.currentTarget.dataset.key;
    const group = PRESET_ICON_GROUPS.find(g => g.key === key);
    if (!group) return;
    this.setData({ iconGroupKey: key, currentGroupIcons: group.icons });
  },

  onSelectUserIcon(e) {
    const url = e.currentTarget.dataset.url;
    this.setData({ newCategoryIcon: url, newCategoryIconUrl: url });
  },

  onUploadIcon() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
        // 压缩图片
        wx.compressImage({
          src: tempPath,
          quality: 60,
          success: (compressed) => this._doUploadIcon(compressed.tempFilePath),
          fail: () => this._doUploadIcon(tempPath)
        });
      }
    });
  },

  async _doUploadIcon(filePath) {
    Loading.show('上传中...');
    try {
      const res = await API.uploadIcon(filePath);
      const url = res.data.url;
      this.setData({ newCategoryIcon: url, newCategoryIconUrl: url });
      this.fetchUserIcons();
      Loading.success('已上传');
    } catch (err) {
      Loading.error('上传失败');
    } finally {
      Loading.hide();
    }
  },

  // ======== 提交 ========

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

  _getIcon() {
    return this.data.newCategoryIcon || 'https://api.iconify.design/ph/question.svg?color=%2394a3b8';
  },

  async confirmEdit() {
    const { editingId, newCategoryName } = this.data;
    if (!newCategoryName.trim()) return Loading.toast('请输入名称');

    Loading.show('保存中...');
    try {
      const icon = this._getIcon();
      const res = await API.updateCategory({ id: editingId, name: newCategoryName, icon });
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
    const { newCategoryName, currentType } = this.data;
    if (!newCategoryName.trim()) return Loading.toast('请输入名称');

    Loading.show('添加中...');
    try {
      const icon = this._getIcon();
      const res = await API.createCategory({
        name: newCategoryName,
        type: currentType,
        icon,
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
