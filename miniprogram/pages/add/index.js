const app = getApp();
const API = require('../../utils/api');
const Loading = require('../../utils/loading');
const Logger = require('../../utils/logger');
const log = Logger.module('add');
const { buildTimeline } = require('../../utils/timeline');
const { loadBatchMap } = require('../../utils/scanPicker');
const scanPicker = require('../../utils/scanPicker');

// 端上录音（语音 sheet 用）
const recorder = wx.getRecorderManager();

Page({
  data: {
    groups: [],            // 时间线分组 [{label,ymd,items}]
    loading: true,
    empty: false,

    // 三种 sheet 互斥：'' | 'manual' | 'voice' | 'scan'，保证同时只有一个出来
    activeSheet: '',

    // 语音 sheet 内部状态
    recording: false,
    transcribing: false,
    recordDenied: false,
    voiceText: '',
    voiceSubmitting: false
  },

  onLoad() {
    this._initRecorder();
  },

  onShow() {
    // 同步自定义 tabBar 选中态 + 图标
    const tb = this.getTabBar && this.getTabBar();
    if (tb && tb.setSelected) tb.setSelected(1);

    this.fetchTimeline();

    // 消费来自 tabBar 的待执行动作（轻点/长按选模式都走这里，保证切换后立即弹）
    if (app.globalData && app.globalData.pendingAddMode) {
      const mode = app.globalData.pendingAddMode;
      app.globalData.pendingAddMode = null;
      this.triggerAddMode(mode);
    }
  },

  onHide() { this._stopPolling(); },
  onUnload() { this._stopPolling(); },
  onPullDownRefresh() { this.fetchTimeline().then(() => wx.stopPullDownRefresh()); },

  // ============ 数据：拉取并构建时间线 ============
  async fetchTimeline() {
    if (!app.globalData || app.globalData.isAuthorized !== true) {
      this.setData({ loading: false, empty: true });
      return;
    }
    this.setData({ loading: true });

    // 当月范围（与 home 一致，手动交易当月足够；task 历史接口本身返回近 50 条）
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth() + 1;
    const startDate = `${y}-${('0' + m).slice(-2)}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${('0' + m).slice(-2)}-${('0' + lastDay).slice(-2)}`;

    try {
      const [dashRes, voiceRes, scanRes] = await Promise.all([
        API.getDashboard({ startDate, endDate, type: 0, scope: 0, groupId: null }),
        API.getVoiceHistory(),
        API.getScanHistory()
      ]);

      const transactions = (dashRes && dashRes.code === 0 && dashRes.data && dashRes.data.list) || [];
      const voiceTasks = (voiceRes && voiceRes.code === 0 && voiceRes.data) || [];
      const scanTasks = (scanRes && scanRes.code === 0 && scanRes.data) || [];

      const groups = buildTimeline({
        transactions, voiceTasks, scanTasks,
        scanBatchMap: loadBatchMap()
      });

      this.setData({ groups, empty: groups.length === 0 });

      // 有进行中的 task 则轮询刷新
      const hasPending =
        voiceTasks.some(t => t.status === 'pending' || t.status === 'processing') ||
        scanTasks.some(t => t.status === 'pending' || t.status === 'processing');
      if (hasPending) this._startPolling(); else this._stopPolling();
    } catch (err) {
      log.error('fetchTimeline failed:', err);
      Loading.error('加载失败');
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  },

  _startPolling() {
    if (this._pollTimer) return;
    this._pollTimer = setInterval(() => this.fetchTimeline(), 3000);
  },
  _stopPolling() {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
  },

  // ============ 由 tabBar 手势/轻点触发（三 sheet 互斥）============
  triggerAddMode(mode) {
    if (mode === 'manual') this.openManualSheet();
    else if (mode === 'voice') this.openVoiceSheet();
    else if (mode === 'scan') this.openScanSheet();
  },

  // 关闭所有 sheet（切换前先清空，保证只有一个出来）
  closeSheet() {
    if (this.data.recording) recorder.stop();
    this.setData({ activeSheet: '' });
  },
  noop() {},

  // ============ 手动 sheet ============
  openManualSheet() {
    this.setData({ activeSheet: 'manual' }, () => {
      const form = this.selectComponent('#manualForm');
      if (form) form.loadCategories();
    });
  },

  async onManualSave(e) {
    if (this._submitting) return;
    const { type, amount, category, category_id, date, note } = e.detail.item;
    this._submitting = true;
    Loading.show('保存中...');
    try {
      const res = await API.createTransaction({
        type: type || 2,
        amount: parseFloat(amount) || 0,
        category: category || '未分类',
        category_id: category_id || 0,
        date: date || new Date().toISOString().split('T')[0],
        note: note || ''
      });
      Loading.hide();
      if (res.code === 0) {
        Loading.success('记账成功');
        this.setData({ activeSheet: '' });
        this.fetchTimeline();
      } else {
        Loading.error(res.message || '保存失败');
      }
    } catch (err) {
      Loading.hide();
      log.error('onManualSave failed:', err);
      Loading.error(err.message || '网络异常');
    } finally {
      this._submitting = false;
    }
  },

  // ============ 语音 sheet ============
  openVoiceSheet() {
    this._refreshRecordAuth();
    this.setData({ activeSheet: 'voice', voiceText: '' });
  },

  _initRecorder() {
    recorder.onStart(() => this.setData({ recording: true }));
    recorder.onStop((res) => {
      this.setData({ recording: false });
      if (!res || !res.tempFilePath) return;
      if (res.duration && res.duration < 500) { Loading.toast('说话时间太短'); return; }
      this._transcribe(res.tempFilePath);
    });
    recorder.onError((err) => {
      this.setData({ recording: false });
      log.error('recorder error:', err);
      this._refreshRecordAuth();
      Loading.toast('录音失败，请检查麦克风权限');
    });
  },
  _refreshRecordAuth() {
    wx.getSetting({ success: (res) => this.setData({ recordDenied: res.authSetting['scope.record'] === false }) });
  },
  onStartRecord() {
    if (this.data.recording || this.data.transcribing) return;
    if (this.data.recordDenied) { this._promptOpenSetting(); return; }
    recorder.start({ duration: 60000, sampleRate: 16000, numberOfChannels: 1, encodeBitRate: 48000, format: 'mp3' });
  },
  onStopRecord() {
    if (!this.data.recording) return;
    recorder.stop();
  },
  async _transcribe(filePath) {
    this.setData({ transcribing: true });
    Loading.show('识别中...');
    try {
      const res = await API.transcribeVoice(filePath);
      Loading.hide();
      if (res.code === 0 && res.data && res.data.text) {
        const merged = (this.data.voiceText ? this.data.voiceText + '，' : '') + res.data.text;
        this.setData({ voiceText: merged });
      } else {
        Loading.toast(res.message || '没识别到内容，请重说');
      }
    } catch (err) {
      Loading.hide();
      log.error('transcribe failed:', err);
      Loading.error(err.message || '识别失败');
    } finally {
      this.setData({ transcribing: false });
    }
  },
  _promptOpenSetting() {
    wx.showModal({
      title: '需要麦克风权限',
      content: '语音记账需要使用麦克风，请在设置中开启后再试',
      confirmText: '去设置',
      success: (r) => {
        if (!r.confirm) return;
        wx.openSetting({
          success: (s) => {
            if (s.authSetting && s.authSetting['scope.record']) {
              this.setData({ recordDenied: false });
              Loading.toast('已开启，可以按住说话了');
            }
          }
        });
      }
    });
  },
  onVoiceTextInput(e) { this.setData({ voiceText: e.detail.value }); },
  onVoiceClear() { this.setData({ voiceText: '' }); },

  async onVoiceParse() {
    const text = (this.data.voiceText || '').trim();
    if (!text) { Loading.toast('请先说话或输入文字'); return; }
    if (this.data.voiceSubmitting) return;
    this.setData({ voiceSubmitting: true });
    Loading.show('提交中...');
    try {
      const res = await API.parseVoice(text);
      Loading.hide();
      if (res.code === 0) {
        this.setData({ activeSheet: '' });
        // 时间线会出现"识别中"语音卡并轮询；直接刷新一次
        this.fetchTimeline();
      } else {
        Loading.error(res.message || '提交失败');
      }
    } catch (err) {
      Loading.hide();
      log.error('parseVoice failed:', err);
      Loading.error(err.message || '网络异常');
    } finally {
      this.setData({ voiceSubmitting: false });
    }
  },

  // ============ 图片 sheet（点击按钮再调系统选图器）============
  openScanSheet() { this.setData({ activeSheet: 'scan' }); },

  async startScan() {
    if (this._scanPicking) return;
    this._scanPicking = true;
    const result = await scanPicker.pickAndUpload({
      onProgress: (cur, total) => Loading.show(`上传中 ${cur}/${total}`)
    });
    Loading.hide();
    this._scanPicking = false;
    // 取消选择则保持 sheet 打开；成功上传则关 sheet 并刷新时间线
    if (result && result.uploaded > 0) {
      this.setData({ activeSheet: '' });
      Loading.toast(`已提交 ${result.uploaded} 张，后台识别中...`);
      this.fetchTimeline();
    }
  },

  // ============ 卡片点击 → 详情页 ============
  onCardTap(e) {
    const { type, id, taskid, batchid } = e.currentTarget.dataset;
    if (type === 'manual') {
      // 复用编辑页：从当前时间线找到该笔，写 globalData
      const card = this._findManualCard(id);
      if (!card) return;
      app.globalData.editingTransaction = {
        id: card.id, type: card.type, amount: card.amount,
        date: card.ymd, note: card.note, category: card.category,
        category_id: card.category_id || 0
      };
      wx.navigateTo({ url: `/pages/edit/index?id=${id}` });
    } else if (type === 'voice') {
      wx.navigateTo({ url: `/pages/voice-result/index?taskId=${taskid}` });
    } else if (type === 'scan') {
      wx.navigateTo({ url: `/pages/scan-batch/index?batchId=${batchid}` });
    }
  },

  // scan 卡片内点单图直接进 scan-result
  onScanPhotoTap(e) {
    const taskId = e.currentTarget.dataset.taskid;
    if (taskId) wx.navigateTo({ url: `/pages/scan-result/index?taskId=${taskId}` });
  },

  _findManualCard(id) {
    for (const g of this.data.groups) {
      for (const c of g.items) {
        if (c.cardType === 'manual' && String(c.id) === String(id)) return c;
      }
    }
    return null;
  }
});
