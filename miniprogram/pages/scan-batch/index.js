const API = require('../../utils/api');
const Loading = require('../../utils/loading');
const Logger = require('../../utils/logger');
const { resolveIconUrl } = require('../../utils/request');
const { loadBatchMap } = require('../../utils/scanPicker');
const log = Logger.module('scan-batch');

Page({
  data: {
    batchId: '',
    photos: [],          // [{taskId, thumb, itemCount, status, imported, statusText}]
    loading: true
  },

  onLoad(options) {
    this.setData({ batchId: options.batchId || '' });
  },

  onShow() {
    this.loadBatch();
  },

  onHide() { this._stopPolling(); },
  onUnload() { this._stopPolling(); },

  async loadBatch() {
    try {
      const res = await API.getScanHistory();
      if (res.code !== 0) { this.setData({ loading: false }); return; }

      const map = loadBatchMap();
      const batchId = this.data.batchId;
      // 该批次包含的 taskId 集合（single-<id> 形式表示无聚合的单图）
      const tasks = (res.data || []).filter(t => {
        const bid = map[t.id] || ('single-' + t.id);
        return bid === batchId;
      });

      const photos = tasks.map(t => ({
        taskId: t.id,
        thumb: t.imageUrl ? resolveIconUrl('/' + t.imageUrl) : '',
        itemCount: t.status === 'completed' ? t.itemCount : null,
        status: t.status,
        imported: !!t.imported,
        statusText: this._statusText(t)
      }));

      this.setData({ photos, loading: false });

      const hasPending = tasks.some(t => t.status === 'pending' || t.status === 'processing');
      if (hasPending) this._startPolling(); else this._stopPolling();
    } catch (err) {
      log.error('loadBatch failed:', err);
      this.setData({ loading: false });
    }
  },

  _statusText(t) {
    if (t.status === 'failed') return '识别失败';
    if (t.status === 'pending' || t.status === 'processing') return '识别中…';
    if (t.imported) return `已记账 ${t.itemCount != null ? t.itemCount + ' 笔' : ''}`.trim();
    return `${t.itemCount != null ? t.itemCount + ' 笔 · ' : ''}待核对`;
  },

  _startPolling() {
    if (this._timer) return;
    this._timer = setInterval(() => this.loadBatch(), 3000);
  },
  _stopPolling() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  },

  onTapPhoto(e) {
    const taskId = e.currentTarget.dataset.taskid;
    if (taskId) wx.navigateTo({ url: `/pages/scan-result/index?taskId=${taskId}` });
  },

  onPreview(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    const urls = this.data.photos.map(p => p.thumb).filter(Boolean);
    wx.previewImage({ urls, current: url });
  }
});
