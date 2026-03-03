// pages/add/index.js
const app = getApp();
const { request } = require('../../utils/request');

Page({
  data: {
    transactionType: 2, // 1: 收入, 2: 支出 (默认支出)
    amount: '',
    date: '',
    note: '',
    
    // 分类相关 (二级联动)
    multiArray: [[], []],
    multiIndex: [0, 0],
    categoryTree: [],
    selectedCategoryName: '',
    selectedCategoryId: null
  },

  onLoad(options) {
    const today = new Date().toISOString().split('T')[0];
    this.setData({
      date: today
    });
    this.loadCategories();
  },

  onShow() {
    if (app.globalData.isAuthorized === false) {
      wx.reLaunch({ url: '/pages/login/index' });
    }
  },

  // 加载分类数据
  async loadCategories() {
    try {
      const type = this.data.transactionType;
      const res = await request('/api/category/tree', 'GET', { type });
      if (res.code === 0) {
        const tree = res.data || [];
        if (tree.length === 0) {
          this.setData({
            categoryTree: [],
            multiArray: [[], []],
            selectedCategoryName: '',
            selectedCategoryId: null
          });
          return;
        }

        // 构建两列数据
        const firstColumn = tree.map(c => c.name);
        const secondColumn = (tree[0].children && tree[0].children.length > 0) 
          ? tree[0].children.map(c => c.name)
          : ['无子分类'];

        this.setData({
          categoryTree: tree,
          multiArray: [firstColumn, secondColumn],
          multiIndex: [0, 0],
          // 默认选中第一个子分类
          selectedCategoryName: tree[0].children && tree[0].children.length > 0 ? tree[0].children[0].name : '',
          selectedCategoryId: tree[0].children && tree[0].children.length > 0 ? tree[0].children[0].id : null
        });
      }
    } catch (err) {
      console.error('加载分类失败', err);
    }
  },

  // 切换类型 (新逻辑)
  changeTransactionType(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    if (type === this.data.transactionType) return;

    this.setData({
      transactionType: type
    }, () => {
      // 切换类型后重新加载分类
      this.loadCategories();
    });
  },

  // 兼容旧逻辑
  onTypeChange(e) {
    this.changeTransactionType({ currentTarget: { dataset: { type: e.detail.value } } });
  },

  // 分类列变动
  onCategoryColumnChange(e) {
    const { column, value } = e.detail;
    const tree = this.data.categoryTree;
    const multiIndex = this.data.multiIndex;

    multiIndex[column] = value;

    if (column === 0) {
      // 第一列变动，联动第二列
      multiIndex[1] = 0;
      const children = tree[value].children || [];
      const secondColumn = children.length > 0 
        ? children.map(c => c.name)
        : ['无子分类'];
      
      this.setData({
        'multiArray[1]': secondColumn,
        'multiIndex': multiIndex
      });
    } else {
      this.setData({
        'multiIndex': multiIndex
      });
    }
  },

  // 分类确定选择
  onCategoryChange(e) {
    const [pIdx, cIdx] = e.detail.value;
    const tree = this.data.categoryTree;
    const parent = tree[pIdx];
    const child = parent.children && parent.children[cIdx];

    if (!child) {
      return wx.showToast({ title: '请选择二级分类', icon: 'none' });
    }

    this.setData({
      multiIndex: [pIdx, cIdx],
      selectedCategoryName: child.name,
      selectedCategoryId: child.id
    });
  },

  // 日期选择
  onDateChange(e) {
    this.setData({
      date: e.detail.value
    });
  },

  // 提交
  async onSubmit(e) {
    const { amount, note } = e.detail.value;
    const { transactionType, selectedCategoryName, selectedCategoryId, date } = this.data;

    if (!amount) {
      return wx.showToast({ title: '请输入金额', icon: 'none' });
    }
    if (!selectedCategoryName) {
      return wx.showToast({ title: '请选择分类', icon: 'none' });
    }

    wx.showLoading({ title: '保存中...' });

    try {
      const res = await request('/api/transaction/create', 'POST', {
        type: transactionType || 2,
        amount: parseFloat(amount) || 0,
        category: selectedCategoryName || '未分类',
        category_id: selectedCategoryId || 0,
        date: date || new Date().toISOString().split('T')[0],
        note: note || ''
      });

      if (res.code === 0) {
        wx.showToast({ title: '记账成功' });
        this.setData({
          amount: '',
          note: ''
        });
      } else {
        wx.showToast({ title: '保存失败: ' + (res.message || '未知错误'), icon: 'none' });
      }

    } catch (err) {
      console.error('请求失败', err);
      const errMsg = (err && err.message) ? err.message : '网络异常';
      wx.showToast({ title: errMsg, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});
