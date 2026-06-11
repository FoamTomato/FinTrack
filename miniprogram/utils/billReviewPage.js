/**
 * 账单复核页工厂 —— scan-result / voice-result 共享的轮询 + 批量入账编排。
 *
 * 页面差异只有三处，通过 config 注入：
 *   - getStatus(taskId) / getResult(taskId)：对应 scan 或 voice 的 API
 *   - editingKey：globalData 上暂存编辑条目的键（scanEditingItem / voiceEditingItem）
 *   - editUrl：编辑页路径
 *
 * 用法：Page(createBillReviewPage({ getStatus, getResult, editingKey, editUrl, logName }))
 * 配套：页面 wxml 放一个 id="review" 的 <bill-review>，绑定
 *       bind:edititem="onEditItem" bind:submit="onBatchCreate" bind:back="onBack"
 */
const API = require('./api');
const Loading = require('./loading');
const Logger = require('./logger');
const { resolveIconUrl } = require('./request');

function createBillReviewPage(config) {
  const { getStatus, getResult, editingKey, editUrl, logName, taskType } = config;
  const log = Logger.module(logName || 'bill-review-page');

  return {
    data: {
      taskId: null,
      status: 'pending',
      result: [],
      imported: false
    },

    onLoad(options) {
      const taskId = parseInt(options.taskId);
      if (!taskId) {
        Loading.toast('参数错误');
        setTimeout(() => wx.navigateBack(), 600);
        return;
      }
      this.setData({ taskId });
      this._checkImportedStatus();
      this._startPolling();
      // 立即查一次：从时间线点进来的任务通常已解析完成，直接出结果，避免先闪 2s「AI 解析中」
      this._poll();
    },

    onShow() {
      // 从编辑页返回后，更新编辑过的条目
      const app = getApp();
      const edited = app.globalData[editingKey];
      if (edited && edited._idx !== undefined) {
        const review = this.selectComponent('#review');
        if (review) review.applyEdit(edited._idx, edited);
        app.globalData[editingKey] = null;
      }
    },

    onUnload() {
      this._stopPolling();
    },

    _startPolling() {
      this._pollErrorCount = 0;
      this._pollTimer = setInterval(() => this._poll(), 2000);
    },

    _stopPolling() {
      if (this._pollTimer) {
        clearInterval(this._pollTimer);
        this._pollTimer = null;
      }
    },

    async _poll() {
      try {
        const res = await getStatus(this.data.taskId);
        if (res.code !== 0) return;
        const { status } = res.data;
        if (this.data.status !== status) {
          this.setData({ status });
        }
        if (status === 'completed') {
          this._stopPolling();
          this._loadResult();
        } else if (status === 'failed') {
          this._stopPolling();
        }
      } catch (err) {
        this._pollErrorCount++;
        log.error('poll failed:', err);
        if (this._pollErrorCount >= 3) {
          this._stopPolling();
          Loading.toast('网络异常，请下拉刷新重试');
        }
      }
    },

    async _loadResult() {
      try {
        const res = await getResult(this.data.taskId);
        if (res.code !== 0) return;
        // 裁剪小图相对路径补全为完整 URL，供组件展示缩略图
        const items = (res.data.items || []).map(it => Object.assign({}, it, {
          cropFullUrl: it.crop_url ? resolveIconUrl('/' + it.crop_url) : ''
        }));
        this.setData({ result: items });
      } catch (err) {
        log.error('loadResult failed:', err);
      }
    },

    async _checkImportedStatus() {
      try {
        const res = await getStatus(this.data.taskId);
        if (res.code === 0 && res.data.imported) {
          this.setData({ imported: true });
        }
      } catch (_) {}
    },

    onEditItem(e) {
      const { idx, item } = e.detail;
      getApp().globalData[editingKey] = Object.assign({}, item, { _idx: idx });
      wx.navigateTo({ url: editUrl });
    },

    onBack() {
      wx.navigateBack();
    },

    async onBatchCreate(e) {
      if (this._submitting) return;
      const checkedItems = (e.detail && e.detail.items) || [];
      if (checkedItems.length === 0) {
        Loading.toast('请至少勾选一条账单');
        return;
      }

      // 收支合计 + 待核对统计，用于二次确认与入账清单
      const sum = (t) => checkedItems
        .filter(i => Number(i.type) === t)
        .reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
      const expense = sum(2);
      const income = sum(1);
      const parts = [];
      if (expense > 0) parts.push(`支出 ¥${expense.toFixed(2)}`);
      if (income > 0) parts.push(`收入 ¥${income.toFixed(2)}`);
      const sumText = parts.join('，');
      const lowCount = checkedItems.filter(i => i.low_confidence).length;

      // 二次确认：预览条数 + 合计 + 待核对提醒，避免误触不可撤销
      let confirmContent = `共 ${checkedItems.length} 条${sumText ? '，' + sumText : ''}`;
      if (lowCount > 0) confirmContent += `\n其中 ${lowCount} 条待核对，建议确认无误后再记账`;
      const confirmed = await new Promise(resolve => {
        wx.showModal({
          title: '确认记账',
          content: confirmContent,
          confirmText: '确认记账',
          cancelText: '再看看',
          success: r => resolve(r.confirm),
          fail: () => resolve(false)
        });
      });
      if (!confirmed) return;

      this._submitting = true;
      Loading.show('记账中...');

      try {
        const payload = checkedItems.map(({ _idx, type, amount, category, category_id, date, time, note, refunded, crop_url }) => ({
          _idx, type, amount, category, category_id, date, time: time || '', note, refunded: !!refunded, crop_url: crop_url || ''
        }));
        const res = await API.batchCreateTransaction(payload, this.data.taskId, taskType);
        Loading.hide();

        if (res.code === 0) {
          this.setData({ imported: true });
          // 入账清单：展示结果与合计，让用户自行决定去向，不再盲跳首页
          const skipped = res.data.skipped || 0;
          const refundedSkipped = res.data.refundedSkipped || 0;
          let content = `已记账 ${res.data.count} 条${sumText ? '，' + sumText : ''}`;
          if (skipped > 0) content += `\n${skipped} 条已存在，已自动跳过`;
          if (refundedSkipped > 0) content += `\n${refundedSkipped} 条已退款，已忽略`;
          wx.showModal({
            title: '记账成功 🎉',
            content,
            confirmText: '去首页看看',
            cancelText: '留在本页',
            success: r => { if (r.confirm) wx.switchTab({ url: '/pages/home/index' }); }
          });
        } else {
          Loading.error(res.message || '记账失败');
        }
      } catch (err) {
        Loading.hide();
        log.error('batchCreate failed:', err);
        Loading.error(err.message || '网络异常');
      } finally {
        this._submitting = false;
      }
    }
  };
}

module.exports = { createBillReviewPage };
