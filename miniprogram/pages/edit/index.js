const app = getApp();
const API = require('../../utils/api');
const Loading = require('../../utils/loading');
const Logger = require('../../utils/logger');
const log = Logger.module('edit');

Page({
  data: {
    id: null,
    item: null   // 传给 bill-edit-form 的待编辑条目
  },

  onLoad(options) {
    const editing = app.globalData.editingTransaction;
    if (!editing || !options.id || String(editing.id) !== String(options.id)) {
      Loading.toast('数据丢失，请重试');
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }

    // 复用 bill-edit-form 组件，仅把已有记录字段喂给它（类型锁定，不可改）
    this.setData({
      id: editing.id,
      item: {
        type: editing.type,
        amount: editing.amount,
        category: editing.category || '',
        category_id: editing.category_id || 0,
        date: editing.date,
        note: editing.note || ''
      }
    });

    app.globalData.editingTransaction = null;
  },

  // 组件校验通过后 emit save；类型可改，一并提交 type
  async onSave(e) {
    if (this._submitting) return;
    const { type, amount, note, category, category_id, date } = e.detail.item;

    this._submitting = true;
    Loading.show('保存中...');
    try {
      const res = await API.updateTransaction({
        id: this.data.id,
        type,
        amount: parseFloat(amount),
        date,
        note: note || '',
        category: category || '未分类',
        category_id: category_id || 0
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
      log.error('onSave failed:', err);
      Loading.error(err.message || '网络异常');
    } finally {
      this._submitting = false;
    }
  }
});
