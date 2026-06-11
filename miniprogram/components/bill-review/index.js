const Loading = require('../../utils/loading');

Component({
  options: { addGlobalClass: true },

  properties: {
    // 任务状态：pending / processing / failed / completed
    status: { type: String, value: 'pending' },
    // 解析出的原始条目数组（无 checked/_idx，由组件内部加工）
    result: { type: Array, value: null, observer: '_onResult' },
    // 是否已入账（入账后按钮禁用并显示「已记账」）
    imported: { type: Boolean, value: false },
    // 文案（语音页可覆盖）
    loadingTitle: { type: String, value: '正在识别账单' },
    loadingTip: { type: String, value: 'AI 分析中，通常需要 10–30 秒' },
    failedTip: { type: String, value: '请返回重新上传' },
    emptyTip: { type: String, value: '未识别到账单条目' }
  },

  data: {
    items: [],
    allChecked: true,
    checkedCount: 0
  },

  methods: {
    _onResult(result) {
      if (!Array.isArray(result)) return;
      // 异常金额检测：①绝对值很大(≥1万)，或 ②明显偏离同批中位数(≥10倍且本身≥100)，
      // 后者用于揪出「200 识别成 2000」这类小数点/识别错误，供用户复核。
      const amounts = result.map(r => parseFloat(r.amount) || 0).filter(a => a > 0);
      const sorted = [...amounts].sort((a, b) => a - b);
      const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
      const isAbnormal = (a) => a >= 10000 || (median > 0 && a >= median * 10 && a >= 100);
      // 退款条目默认不勾选（仍展示，打「已退款」徽标），其余默认勾选
      const items = result.map((item, idx) => Object.assign({}, item, {
        _idx: idx,
        checked: !item.refunded,
        amount_warn: isAbnormal(parseFloat(item.amount) || 0)
      }));
      const checkedCount = items.filter(i => i.checked).length;
      this.setData({ items, allChecked: checkedCount === items.length, checkedCount });
    },

    _syncCheckedCount() {
      const checkedCount = this.data.items.filter(i => i.checked).length;
      const allChecked = this.data.items.length > 0 && checkedCount === this.data.items.length;
      this.setData({ checkedCount, allChecked });
    },

    onToggleItem(e) {
      const idx = e.currentTarget.dataset.idx;
      const items = this.data.items;
      items[idx] = Object.assign({}, items[idx], { checked: !items[idx].checked });
      this.setData({ items });
      this._syncCheckedCount();
    },

    onToggleAll() {
      const allChecked = !this.data.allChecked;
      const items = this.data.items.map(i => Object.assign({}, i, { checked: allChecked }));
      this.setData({ items, allChecked, checkedCount: allChecked ? items.length : 0 });
    },

    onEditItem(e) {
      const idx = e.currentTarget.dataset.idx;
      this.triggerEvent('edititem', { idx, item: this.data.items[idx] });
    },

    onBack() {
      this.triggerEvent('back');
    },

    // 点击裁剪小图：放大预览原裁图（阻止冒泡到整行编辑）
    onPreviewCrop(e) {
      const url = e.currentTarget.dataset.url;
      if (!url) return;
      wx.previewImage({ urls: [url], current: url });
    },

    onBatchCreate() {
      const checkedItems = this.data.items.filter(i => i.checked);
      if (checkedItems.length === 0) {
        Loading.toast('请至少勾选一条账单');
        return;
      }
      this.triggerEvent('submit', { items: checkedItems });
    },

    // 公共方法：编辑页返回后，由父页调用更新某条
    applyEdit(idx, patch) {
      if (idx === undefined || idx === null) return;
      const items = this.data.items;
      if (!items[idx]) return;
      items[idx] = Object.assign({}, items[idx], {
        type: patch.type,
        amount: patch.amount,
        category: patch.category,
        category_id: patch.category_id,
        date: patch.date,
        time: patch.time || '',
        note: patch.note
      });
      this.setData({ items });
      this._syncCheckedCount();
    }
  }
});
