const API = require('../../utils/api');
const { createBillReviewPage } = require('../../utils/billReviewPage');

Page(createBillReviewPage({
  getStatus: (id) => API.getScanStatus(id),
  getResult: (id) => API.getScanResult(id),
  editingKey: 'scanEditingItem',
  editUrl: '/pages/scan-edit/index',
  taskType: 'scan',
  logName: 'scan-result'
}));
