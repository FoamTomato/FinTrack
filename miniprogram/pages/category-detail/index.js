const API = require('../../utils/api');
const Loading = require('../../utils/loading');
const { resolveIconUrl } = require('../../utils/request');
const { PRESET_ICON_GROUPS } = require('../../utils/presetIcons');
const Logger = require('../../utils/logger');
const log = Logger.module('category-detail');

Page({
  data: {
    category: {},
    subCategories: [],
    loading: true,
    showModal: false,
    newSubName: '',
    newSubIcon: '',
    newSubIconUrl: '',
    iconGroups: PRESET_ICON_GROUPS,
    iconGroupKey: PRESET_ICON_GROUPS[0].key,
    currentGroupIcons: PRESET_ICON_GROUPS[0].icons,
    userIcons: [],
    iconTab: 'preset'
  },

  onLoad(options) {
    if (options.data) {
      try {
        const category = JSON.parse(decodeURIComponent(options.data));
        category.iconUrl = resolveIconUrl(category.icon);
        this.setData({ category });
        this.fetchSubCategories(category.id);
      } catch (e) {
        log.error('onLoad parse failed:', e);
      }
    }
  },

  async fetchSubCategories(parentId) {
    this.setData({ loading: true });
    try {
      const res = await API.getCategoryList(parentId);
      if (res.code === 0) {
        const list = (res.data || []).map(item => ({
          ...item,
          iconUrl: resolveIconUrl(item.icon)
        }));
        this.setData({ subCategories: list });
      }
    } catch (err) {
      log.error('fetchSubCategories failed:', err);
      Loading.error('加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  // ======== 弹窗控制 ========

  onShowAddModal() {
    this.setData({
      showModal: true,
      newSubName: '', newSubIcon: '', newSubIconUrl: '',
      iconTab: 'preset'
    });
  },

  onHideModal() {
    this.setData({ showModal: false });
  },

  onInputSubName(e) {
    this.setData({ newSubName: e.detail.value });
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
    this.setData({ newSubIcon: url, newSubIconUrl: url });
  },

  onSelectUserIcon(e) {
    const url = e.currentTarget.dataset.url;
    this.setData({ newSubIcon: url, newSubIconUrl: url });
  },

  onSwitchIconGroup(e) {
    const key = e.currentTarget.dataset.key;
    const group = PRESET_ICON_GROUPS.find(g => g.key === key);
    if (!group) return;
    this.setData({ iconGroupKey: key, currentGroupIcons: group.icons });
  },

  onUploadIcon() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
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
      this.setData({ newSubIcon: url, newSubIconUrl: url });
      this.fetchUserIcons();
      Loading.success('已上传');
    } catch (err) {
      Loading.error('上传失败');
    } finally {
      Loading.hide();
    }
  },

  // ======== 添加 / 删除 ========

  async onAddSubCategory() {
    if (this._submitting) return;
    const { newSubName, newSubIcon, category } = this.data;
    if (!newSubName.trim()) return Loading.toast('请输入名称');

    this._submitting = true;
    Loading.show('添加中...');
    try {
      const res = await API.createCategory({
        name: newSubName,
        type: category.type,
        parentId: category.id,
        icon: newSubIcon || category.icon || ''
      });
      if (res.code === 0) {
        Loading.success('已添加');
        this.setData({ showModal: false, newSubName: '', newSubIcon: '', newSubIconUrl: '' });
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
