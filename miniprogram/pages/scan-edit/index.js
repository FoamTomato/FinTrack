const app = getApp();
const Loading = require('../../utils/loading');

Page({
  data: {
    item: null
  },

  onLoad() {
    const editing = app.globalData.scanEditingItem;
    if (!editing) {
      Loading.toast('数据丢失，请重试');
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    this.setData({ item: editing });
  },

  onSave(e) {
    // 写回 globalData，由 scan-result 的 onShow 读取
    app.globalData.scanEditingItem = e.detail.item;
    wx.navigateBack();
  }
});
