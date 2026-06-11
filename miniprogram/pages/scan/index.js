const API = require('../../utils/api');
const Loading = require('../../utils/loading');
const Logger = require('../../utils/logger');
const { resolveIconUrl } = require('../../utils/request');
const scanPicker = require('../../utils/scanPicker');
const log = Logger.module('scan');

Page({
  data: {
    uploading: false,
    uploadProgress: '',
    tasks: [],
    loadingHistory: false
  },

  onLoad() {
    this.loadHistory();
  },

  onShow() {
    this.loadHistory();
  },

  onHide() {
    this._stopAutoRefresh();
  },

  onUnload() {
    this._stopAutoRefresh();
  },

  async onChooseImage() {
    if (this.data.uploading) return;
    this.setData({ uploading: true, uploadProgress: '' });
    // 复用共享选图器：同批生成 batchId 并写 storage，供时间线九宫格聚合
    const result = await scanPicker.pickAndUpload({
      onProgress: (cur, total) => this.setData({ uploadProgress: `${cur} / ${total}` })
    });
    this.setData({ uploading: false, uploadProgress: '' });
    if (result && result.uploaded > 0) {
      Loading.toast(`已提交 ${result.uploaded} 张，后台识别中...`);
    }
    this.loadHistory();
  },

  async loadHistory() {
    if (this.data.loadingHistory) return;
    this.setData({ loadingHistory: true });
    try {
      const res = await API.getScanHistory();
      if (res.code === 0) {
        const tasks = (res.data || []).map(t => ({
          ...t,
          createdAtText: this._formatTime(t.createdAt),
          imageFullUrl: t.imageUrl ? resolveIconUrl('/' + t.imageUrl) : ''
        }));
        this.setData({ tasks });
        // 有进行中任务则轻量轮询自动刷新，全部完成即停（增强"后台在跑"的感知）
        const hasPending = tasks.some(t => t.status === 'pending' || t.status === 'processing');
        if (hasPending) this._startAutoRefresh();
        else this._stopAutoRefresh();
      }
    } catch (err) {
      log.error('loadHistory failed:', err);
    } finally {
      this.setData({ loadingHistory: false });
    }
  },

  _startAutoRefresh() {
    if (this._refreshTimer) return;
    this._refreshTimer = setInterval(() => this.loadHistory(), 3000);
  },

  _stopAutoRefresh() {
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    }
  },

  onRefresh() {
    this.loadHistory();
  },

  onGoToResult(e) {
    const taskId = e.currentTarget.dataset.taskid;
    wx.navigateTo({ url: `/pages/scan-result/index?taskId=${taskId}` });
  },

  onPreviewImage(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    wx.previewImage({ urls: [url], current: url });
  },

  _formatTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const pad = n => String(n).padStart(2, '0');
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hour = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${month}/${day} ${hour}:${min}`;
  }
});
