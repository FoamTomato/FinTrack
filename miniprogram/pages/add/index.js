const app = getApp();
const API = require('../../utils/api');
const Loading = require('../../utils/loading');

Page({
  /**
   * 页面数据
   */
  data: {
    transactionType: 2,
    amount: '',
    date: '',
    note: '',
    multiArray: [[], []],
    multiIndex: [0, 0],
    categoryTree: [],
    selectedCategoryName: '',
    selectedCategoryId: null
  },

  /**
   * 生命周期 —— 只做调度
   */
  onLoad() {
    const today = new Date().toISOString().split('T')[0];
    this.setData({ date: today });
    this.loadCategories();
  },

  onShow() {
    if (app.globalData.isAuthorized === false) {
      wx.reLaunch({ url: '/pages/login/index' });
    }
  },

  /**
   * 数据获取 —— 分类树
   */
  async loadCategories() {
    try {
      // 步骤1：请求分类树
      const res = await API.getCategoryTree(this.data.transactionType);
      if (res.code !== 0) return;

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

      // 步骤2：构建两列联动数据
      const firstColumn = tree.map(c => c.name);
      const firstChildren = tree[0].children || [];
      const secondColumn = firstChildren.length > 0
        ? firstChildren.map(c => c.name)
        : ['无子分类'];

      // 步骤3：更新视图
      this.setData({
        categoryTree: tree,
        multiArray: [firstColumn, secondColumn],
        multiIndex: [0, 0],
        selectedCategoryName: firstChildren.length > 0 ? firstChildren[0].name : '',
        selectedCategoryId: firstChildren.length > 0 ? firstChildren[0].id : null
      });
    } catch (err) {
      console.error('loadCategories failed:', err);
    }
  },

  /**
   * 事件处理 —— 切换收支类型
   */
  onChangeTransactionType(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    if (type === this.data.transactionType) return;

    this.setData({ transactionType: type }, () => {
      this.loadCategories();
    });
  },

  /**
   * 事件处理 —— 分类列联动
   */
  onCategoryColumnChange(e) {
    const { column, value } = e.detail;
    const tree = this.data.categoryTree;
    const multiIndex = this.data.multiIndex;

    multiIndex[column] = value;

    if (column === 0) {
      multiIndex[1] = 0;
      const children = tree[value].children || [];
      const secondColumn = children.length > 0
        ? children.map(c => c.name)
        : ['无子分类'];

      this.setData({
        'multiArray[1]': secondColumn,
        multiIndex
      });
    } else {
      this.setData({ multiIndex });
    }
  },

  /**
   * 事件处理 —— 分类确定选择
   */
  onCategoryChange(e) {
    const [pIdx, cIdx] = e.detail.value;
    const tree = this.data.categoryTree;
    const parent = tree[pIdx];
    const child = parent.children && parent.children[cIdx];

    if (!child) {
      return Loading.toast('请选择二级分类');
    }

    this.setData({
      multiIndex: [pIdx, cIdx],
      selectedCategoryName: child.name,
      selectedCategoryId: child.id
    });
  },

  /**
   * 事件处理 —— 日期选择
   */
  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  /**
   * 事件处理 —— 提交记账（防重复）
   */
  async onSubmit(e) {
    // 防重复提交
    if (this._submitting) return;

    const { amount, note } = e.detail.value;
    const { transactionType, selectedCategoryName, selectedCategoryId, date } = this.data;

    // 参数校验
    if (!amount) {
      return Loading.toast('请输入金额');
    }
    if (!selectedCategoryName) {
      return Loading.toast('请选择分类');
    }

    this._submitting = true;
    Loading.show('保存中...');

    try {
      // 调用 API 创建交易
      const res = await API.createTransaction({
        type: transactionType || 2,
        amount: parseFloat(amount) || 0,
        category: selectedCategoryName || '未分类',
        category_id: selectedCategoryId || 0,
        date: date || new Date().toISOString().split('T')[0],
        note: note || ''
      });

      if (res.code === 0) {
        Loading.success('记账成功');
        this.setData({ amount: '', note: '' });
      } else {
        Loading.error('保存失败');
      }
    } catch (err) {
      console.error('onSubmit failed:', err);
      Loading.error(err.message || '网络异常');
    } finally {
      Loading.hide();
      this._submitting = false;
    }
  }
});
