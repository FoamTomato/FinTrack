const app = getApp();
const API = require('../../utils/api');
const Loading = require('../../utils/loading');
const Logger = require('../../utils/logger');
const log = Logger.module('edit');

Page({
  data: {
    id: null,
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

  onLoad(options) {
    const editing = app.globalData.editingTransaction;
    if (!editing || !options.id || String(editing.id) !== String(options.id)) {
      Loading.toast('数据丢失，请重试');
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }

    this.setData({
      id: editing.id,
      transactionType: editing.type,
      amount: String(editing.amount),
      date: editing.date,
      note: editing.note || '',
      selectedCategoryName: editing.category || '',
      selectedCategoryId: editing.category_id || null
    });

    app.globalData.editingTransaction = null;
    this.loadCategories();
  },

  /**
   * 数据获取 —— 按当前 type 加载分类树并定位到现有分类
   */
  async loadCategories() {
    try {
      const res = await API.getCategoryTree(this.data.transactionType, true);
      if (res.code !== 0) return;

      const tree = res.data || [];
      if (tree.length === 0) {
        this.setData({
          categoryTree: [],
          multiArray: [[], []]
        });
        return;
      }

      const firstColumn = tree.map(c => c.name);

      // 优先按 category_id 定位，找不到再按名称回退
      const targetId = this.data.selectedCategoryId;
      const targetName = this.data.selectedCategoryName;
      let pIdx = 0;
      let cIdx = 0;
      let matched = false;
      for (let i = 0; i < tree.length; i++) {
        const children = tree[i].children || [];
        let found = -1;
        if (targetId) {
          found = children.findIndex(c => c.id === targetId);
        }
        if (found < 0 && targetName) {
          found = children.findIndex(c => c.name === targetName);
        }
        if (found >= 0) { pIdx = i; cIdx = found; matched = true; break; }
      }

      const children = tree[pIdx].children || [];
      const secondColumn = children.length > 0
        ? children.map(c => c.name)
        : ['无子分类'];
      const selectedChild = children[cIdx];

      this.setData({
        categoryTree: tree,
        multiArray: [firstColumn, secondColumn],
        multiIndex: [pIdx, cIdx],
        selectedCategoryName: selectedChild ? selectedChild.name : (matched ? targetName : ''),
        selectedCategoryId: selectedChild ? selectedChild.id : (matched ? targetId : null)
      });
    } catch (err) {
      log.error('loadCategories failed:', err);
    }
  },

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
      this.setData({ 'multiArray[1]': secondColumn, multiIndex });
    } else {
      this.setData({ multiIndex });
    }
  },

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

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  async onSubmit(e) {
    if (this._submitting) return;

    const { amount, note } = e.detail.value;
    const { id, date, selectedCategoryName, selectedCategoryId } = this.data;

    if (!amount) return Loading.toast('请输入金额');
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return Loading.toast('请输入有效金额');
    if (amountNum > 99999999.99) return Loading.toast('金额不能超过 99999999.99');
    if (!selectedCategoryName) return Loading.toast('请选择分类');

    this._submitting = true;
    Loading.show('保存中...');

    try {
      const res = await API.updateTransaction({
        id,
        amount: amountNum,
        date,
        note: note || '',
        category: selectedCategoryName,
        category_id: selectedCategoryId || 0
      });

      Loading.hide();

      if (res.code === 0) {
        Loading.success('修改成功');
        setTimeout(() => wx.navigateBack(), 600);
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
