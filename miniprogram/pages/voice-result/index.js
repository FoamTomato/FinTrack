const API = require('../../utils/api');
const { createBillReviewPage } = require('../../utils/billReviewPage');

Page(createBillReviewPage({
  getStatus: (id) => API.getVoiceStatus(id),
  getResult: (id) => API.getVoiceResult(id),
  editingKey: 'voiceEditingItem',
  editUrl: '/pages/voice-edit/index',
  taskType: 'voice',
  logName: 'voice-result'
}));
