const API = require('../../utils/api');
const Loading = require('../../utils/loading');
const { resolveIconUrl } = require('../../utils/request');

const PRESET_ICONS = [
  { name: '餐饮', file: 'canyin.svg' },
  { name: '咖啡', file: 'kafei.svg' },
  { name: '水果', file: 'shuiguo.svg' },
  { name: '零食', file: 'lingshi.svg' },
  { name: '早餐', file: 'zaocai.svg' },
  { name: '火锅', file: 'huoguo.svg' },
  { name: '交通', file: 'jiaotong.svg' },
  { name: '地铁', file: 'ditie.svg' },
  { name: '打车', file: 'dache.svg' },
  { name: '加油', file: 'jiayou.svg' },
  { name: '单车', file: 'danche.svg' },
  { name: '购物', file: 'gouwu.svg' },
  { name: '衣服', file: 'yifu.svg' },
  { name: '数码', file: 'shuma.svg' },
  { name: '护肤', file: 'hufu.svg' },
  { name: '居住', file: 'juzhu.svg' },
  { name: '房租', file: 'fangzu.svg' },
  { name: '电费', file: 'dianfei.svg' },
  { name: '水费', file: 'shuifei.svg' },
  { name: '娱乐', file: 'xiuxian.svg' },
  { name: '电影', file: 'dianying.svg' },
  { name: '游戏', file: 'youxi.svg' },
  { name: '旅游', file: 'lvyou.svg' },
  { name: '健身', file: 'jianshen.svg' },
  { name: '医疗', file: 'yiliao.svg' },
  { name: '医药', file: 'yiyao.svg' },
  { name: '教育', file: 'jiaoyu.svg' },
  { name: '书籍', file: 'shu.svg' },
  { name: '人情', file: 'renqing.svg' },
  { name: '红包', file: 'hongbao.svg' },
  { name: '宠物', file: 'chongwu.svg' },
  { name: '工资', file: 'gongzi.svg' },
  { name: '职业', file: 'zhiye_shouru.svg' },
  { name: '其他', file: 'qita_shouru.svg' },
  { name: '投资', file: 'touzi.svg' },
  { name: '奖励', file: 'jiangli.svg' },
  { name: '钱包', file: 'qianbao.svg' },
  { name: '信用卡', file: 'xinyongka.svg' },
  { name: '礼物', file: 'liwu.svg' },
  { name: '默认', file: 'default.svg' }
].map(item => ({
  ...item,
  path: `/static/icons/category/${item.file}`,
  url: resolveIconUrl(`/static/icons/category/${item.file}`)
}));

Page({
  data: {
    category: {},
    subCategories: [],
    loading: true,
    showModal: false,
    newSubName: '',
    newSubIcon: '',
    newSubIconUrl: '',
    presetIcons: PRESET_ICONS,
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
        console.error('onLoad parse failed:', e);
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
      console.error('fetchSubCategories failed:', err);
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
      console.error('fetchUserIcons failed:', err);
    }
  },

  onSelectPresetIcon(e) {
    const { path, url } = e.currentTarget.dataset;
    this.setData({ newSubIcon: path, newSubIconUrl: url });
  },

  onSelectUserIcon(e) {
    const url = e.currentTarget.dataset.url;
    this.setData({ newSubIcon: url, newSubIconUrl: url });
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
