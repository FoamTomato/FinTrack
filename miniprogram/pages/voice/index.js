const API = require('../../utils/api');
const Loading = require('../../utils/loading');
const Logger = require('../../utils/logger');
const log = Logger.module('voice');

// 端上录音用核心 API wx.getRecorderManager（无需插件，只需录音权限）
const recorder = wx.getRecorderManager();

Page({
  data: {
    recording: false,
    recordDenied: false,
    transcribing: false,
    text: '',
    submitting: false,
    tasks: [],
    loadingHistory: false
  },

  onLoad() {
    this._initRecorder();
    this._refreshRecordAuth();
  },

  onShow() {
    this._refreshRecordAuth();
    this.loadHistory();
  },

  // 检查录音权限是否被明确拒绝（用于按住说话时引导去设置）
  _refreshRecordAuth() {
    wx.getSetting({
      success: (res) => {
        this.setData({ recordDenied: res.authSetting['scope.record'] === false });
      }
    });
  },

  _initRecorder() {
    recorder.onStart(() => {
      this.setData({ recording: true });
    });
    recorder.onStop((res) => {
      this.setData({ recording: false });
      if (!res || !res.tempFilePath) return;
      if (res.duration && res.duration < 500) {
        Loading.toast('说话时间太短');
        return;
      }
      this._transcribe(res.tempFilePath);
    });
    recorder.onError((err) => {
      this.setData({ recording: false });
      log.error('recorder error:', err);
      this._refreshRecordAuth();
      Loading.toast('录音失败，请检查麦克风权限');
    });
  },

  onStartRecord() {
    if (this.data.recording || this.data.transcribing) return;
    if (this.data.recordDenied) {
      this._promptOpenSetting();
      return;
    }
    recorder.start({
      duration: 60000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'mp3'
    });
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
        const merged = (this.data.text ? this.data.text + '，' : '') + res.data.text;
        this.setData({ text: merged });
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

  onTextInput(e) {
    this.setData({ text: e.detail.value });
  },

  onClear() {
    this.setData({ text: '' });
  },

  async onParse() {
    const text = (this.data.text || '').trim();
    if (!text) {
      Loading.toast('请先说话或输入文字');
      return;
    }
    if (this.data.submitting) return;
    this.setData({ submitting: true });
    Loading.show('提交中...');
    try {
      const res = await API.parseVoice(text);
      Loading.hide();
      if (res.code === 0) {
        wx.navigateTo({ url: `/pages/voice-result/index?taskId=${res.data.taskId}` });
      } else {
        Loading.error(res.message || '提交失败');
      }
    } catch (err) {
      Loading.hide();
      log.error('parseVoice failed:', err);
      Loading.error(err.message || '网络异常');
    } finally {
      this.setData({ submitting: false });
    }
  },

  // ===== 历史记录 =====
  async loadHistory() {
    if (this.data.loadingHistory) return;
    this.setData({ loadingHistory: true });
    try {
      const res = await API.getVoiceHistory();
      if (res.code === 0) {
        const tasks = (res.data || []).map(t => ({
          ...t,
          createdAtText: this._formatTime(t.createdAt)
        }));
        this.setData({ tasks });
      }
    } catch (err) {
      log.error('loadHistory failed:', err);
    } finally {
      this.setData({ loadingHistory: false });
    }
  },

  onRefresh() {
    this.loadHistory();
  },

  onGoToResult(e) {
    const taskId = e.currentTarget.dataset.taskid;
    wx.navigateTo({ url: `/pages/voice-result/index?taskId=${taskId}` });
  },

  _formatTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
});
