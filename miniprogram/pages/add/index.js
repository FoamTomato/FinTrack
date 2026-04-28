const API = require('../../utils/api');
const Loading = require('../../utils/loading');
const Logger = require('../../utils/logger');
const log = Logger.module('add');

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
    this.loadCategories();
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

      // 步骤2：构建第一列
      const firstColumn = tree.map(c => c.name);

      // 步骤3：尝试保留已选中的分类，否则回退到默认 [0, 0]
      const prevId = this.data.selectedCategoryId;
      let pIdx = 0;
      let cIdx = 0;
      if (prevId) {
        for (let i = 0; i < tree.length; i++) {
          const children = tree[i].children || [];
          const found = children.findIndex(c => c.id === prevId);
          if (found >= 0) { pIdx = i; cIdx = found; break; }
        }
      }

      const children = tree[pIdx].children || [];
      const secondColumn = children.length > 0
        ? children.map(c => c.name)
        : ['无子分类'];
      const selectedChild = children[cIdx];

      // 步骤4：更新视图
      this.setData({
        categoryTree: tree,
        multiArray: [firstColumn, secondColumn],
        multiIndex: [pIdx, cIdx],
        selectedCategoryName: selectedChild ? selectedChild.name : '',
        selectedCategoryId: selectedChild ? selectedChild.id : null
      });
    } catch (err) {
      log.error('loadCategories failed:', err);
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
   * 事件处理 —— 金额输入实时校验
   * 数据库 DECIMAL(10,2) 上限 99999999.99
   */
  onAmountInput(e) {
    let value = e.detail.value;
    const match = value.match(/^(\d{0,8})(\.\d{0,2})?/);
    const truncated = match ? (match[1] + (match[2] || '')) : '';
    if (truncated !== value) {
      this.setData({ amount: truncated });
      Loading.toast('金额最多 8 位整数 2 位小数');
      return truncated;
    }
    this.setData({ amount: value });
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
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return Loading.toast('请输入有效金额');
    }
    if (amountNum > 99999999.99) {
      return Loading.toast('金额不能超过 99999999.99');
    }
    if (!selectedCategoryName) {
      return Loading.toast('请选择分类');
    }

    this._submitting = true;
    Loading.show('保存中...');

    try {
      const res = await API.createTransaction({
        type: transactionType || 2,
        amount: parseFloat(amount) || 0,
        category: selectedCategoryName || '未分类',
        category_id: selectedCategoryId || 0,
        date: date || new Date().toISOString().split('T')[0],
        note: note || ''
      });

      Loading.hide();

      if (res.code === 0) {
        this.setData({ amount: '', note: '' });
        Loading.success('记账成功');
      } else {
        Loading.error(res.message || '保存失败');
      }
    } catch (err) {
      Loading.hide();
      log.error('onSubmit failed:', err);
      Loading.error(err.message || '网络异常');
    } finally {
      this._submitting = false;
    }
  }
});
