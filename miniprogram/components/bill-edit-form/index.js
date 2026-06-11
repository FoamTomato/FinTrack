const API = require('../../utils/api');
const Loading = require('../../utils/loading');
const Logger = require('../../utils/logger');
const log = Logger.module('bill-edit-form');

Component({
  options: { addGlobalClass: true },

  properties: {
    // 待编辑条目：{ _idx, type, amount, category, category_id, date, note }
    item: { type: Object, value: null, observer: '_onItem' },
    // 提交按钮文案：编辑场景默认"确认修改"，手动记账可传"保存记录"
    submitText: { type: String, value: '确认修改' },
    // 表单底部提示文案，传空串则不显示
    hint: { type: String, value: '修改后点确认返回列表，不会立即记账' },
    // 是否在类型切换栏旁显示「📷 拍照导入」入口（手动记账页使用）
    showScanEntry: { type: Boolean, value: false },
    // 是否在类型切换栏旁显示「🎤 语音记账」入口（手动记账页使用）
    showVoiceEntry: { type: Boolean, value: false },
    // 是否显示时间选择器（识图/语音复核编辑场景开启，手动记账不显示）
    showTime: { type: Boolean, value: false }
  },

  data: {
    _idx: null,
    transactionType: 2,
    amount: '',
    date: '',
    time: '',
    note: '',
    multiArray: [[], []],
    multiIndex: [0, 0],
    categoryTree: [],
    selectedCategoryName: '',
    selectedCategoryId: null
  },

  lifetimes: {
    attached() {
      // 无 item（手动记账场景）：初始化空表单默认值并加载分类
      if (!this.properties.item) {
        this.setData({ date: new Date().toISOString().split('T')[0] });
        this.loadCategories();
      }
    }
  },

  methods: {
    _onItem(item) {
      if (!item) return;
      this.setData({
        _idx: item._idx,
        transactionType: item.type || 2,
        amount: String(item.amount || ''),
        date: item.date || new Date().toISOString().split('T')[0],
        time: item.time || '',
        note: item.note || '',
        selectedCategoryName: item.category || '',
        selectedCategoryId: item.category_id || null
      });
      this.loadCategories();
    },

    async loadCategories() {
      try {
        const res = await API.getCategoryTree(this.data.transactionType, true);
        if (res.code !== 0) return;

        const tree = res.data || [];
        if (tree.length === 0) {
          this.setData({ categoryTree: [], multiArray: [[], []] });
          return;
        }

        const firstColumn = tree.map(c => c.name);
        const targetId = this.data.selectedCategoryId;
        const targetName = this.data.selectedCategoryName;
        let pIdx = 0, cIdx = 0;

        for (let i = 0; i < tree.length; i++) {
          const children = tree[i].children || [];
          let found = targetId ? children.findIndex(c => c.id === targetId) : -1;
          if (found < 0 && targetName) found = children.findIndex(c => c.name === targetName);
          if (found >= 0) { pIdx = i; cIdx = found; break; }
        }

        const children = tree[pIdx].children || [];
        const secondColumn = children.length > 0 ? children.map(c => c.name) : ['无子分类'];
        const selectedChild = children[cIdx];

        this.setData({
          categoryTree: tree,
          multiArray: [firstColumn, secondColumn],
          multiIndex: [pIdx, cIdx],
          selectedCategoryName: selectedChild ? selectedChild.name : (targetName || ''),
          selectedCategoryId: selectedChild ? selectedChild.id : (targetId || null)
        });
      } catch (err) {
        log.error('loadCategories failed:', err);
      }
    },

    onChangeTransactionType(e) {
      const type = parseInt(e.currentTarget.dataset.type);
      if (type === this.data.transactionType) return;
      this.setData({ transactionType: type }, () => this.loadCategories());
    },

    onCategoryColumnChange(e) {
      const { column, value } = e.detail;
      const tree = this.data.categoryTree;
      const multiIndex = this.data.multiIndex;
      multiIndex[column] = value;
      if (column === 0) {
        multiIndex[1] = 0;
        const children = tree[value].children || [];
        const secondColumn = children.length > 0 ? children.map(c => c.name) : ['无子分类'];
        this.setData({ 'multiArray[1]': secondColumn, multiIndex });
      } else {
        this.setData({ multiIndex });
      }
    },

    onCategoryChange(e) {
      const [pIdx, cIdx] = e.detail.value;
      const tree = this.data.categoryTree;
      const child = tree[pIdx] && tree[pIdx].children && tree[pIdx].children[cIdx];
      if (!child) return Loading.toast('请选择二级分类');
      this.setData({ multiIndex: [pIdx, cIdx], selectedCategoryName: child.name, selectedCategoryId: child.id });
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

    onTimeChange(e) {
      this.setData({ time: e.detail.value });
    },

    onSubmit(e) {
      const { amount, note } = e.detail.value;
      const { _idx, transactionType, selectedCategoryName, selectedCategoryId, date, time } = this.data;

      if (!amount) return Loading.toast('请输入金额');
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) return Loading.toast('请输入有效金额');
      if (amountNum > 99999999.99) return Loading.toast('金额不能超过 99999999.99');
      if (!selectedCategoryName) return Loading.toast('请选择分类');

      this.triggerEvent('save', {
        item: {
          _idx,
          type: transactionType,
          amount: amountNum.toFixed(2),
          category: selectedCategoryName,
          category_id: selectedCategoryId || 0,
          date,
          time: time || '',
          note: note || ''
        }
      });
    },

    // 仅在 showScanEntry 时显示，点击 📷 由父页处理跳转
    onScanEntry() {
      this.triggerEvent('scan');
    },

    // 仅在 showVoiceEntry 时显示，点击 🎤 由父页处理跳转
    onVoiceEntry() {
      this.triggerEvent('voice');
    },

    // 公共方法：手动记账保存成功后清空金额/备注（保留类型/分类/日期）
    reset() {
      this.setData({ amount: '', note: '' });
    }
  }
});
