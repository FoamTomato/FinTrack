const app = getApp();
const API = require('../../utils/api');
const Loading = require('../../utils/loading');
const Logger = require('../../utils/logger');
const log = Logger.module('home');

const { resolveIconUrl } = require('../../utils/request');

Page({
  /**
   * 页面数据
   */
  data: {
    transactions: [],
    heatmapData: [],
    loading: true,
    typeFilter: 0,
    billType: 0,
    myGroups: [],
    currentGroupId: null,
    showBillTypeModal: false,
    summary: {
      totalIncome: '0.00',
      totalExpense: '0.00',
      balance: '0.00'
    },
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    showDetailPopup: false,
    detailDate: '',
    // 统计分析（饼图 + 柱状图 + 大类占比 + 小类下钻）
    analysisTotal: 0,
    analysisList: [],
    barChartData: [],
    pieStyle: '',
    pieLegend: [],
    chartColors: ['#07C160', '#FFC107', '#1989FA', '#FF9800', '#9C27B0', '#E91E63', '#009688', '#E0E0E0'],
    incomeColors: ['#FF9800', '#FF5722', '#FFC107', '#FFEB3B', '#795548', '#607D8B']
  },

  /**
   * 生命周期 —— 只做调度
   */
  onLoad() {
    app.onLoginReady((authorized) => {
      if (authorized) this.fetchMyGroups();
    });
  },

  onShow() {
    const tb = this.getTabBar && this.getTabBar();
    if (tb && tb.setSelected) tb.setSelected(0);
    if (app.globalData.isAuthorized === true) {
      this.fetchData();
      this.fetchMyGroups();
    }
  },

  onPullDownRefresh() {
    this.fetchData().then(() => wx.stopPullDownRefresh());
  },

  /**
   * 数据获取 —— 小组列表
   */
  async fetchMyGroups() {
    try {
      const res = await API.getGroups();
      if (res.code === 0 && res.data) {
        this.setData({ myGroups: res.data || [] });
      }
    } catch (err) {
      log.error('fetchMyGroups failed:', err);
    }
  },

  /**
   * 数据获取 —— 主数据（Dashboard + 分类分析）
   */
  async fetchData() {
    if (!app.globalData.isAuthorized) {
      log.info('用户未授权，停止加载数据');
      return;
    }

    this.setData({ loading: true });

    const { currentYear: y, currentMonth: m, typeFilter: filter, billType, currentGroupId } = this.data;

    // 步骤1：计算日期范围
    const startDate = `${y}-${('0' + m).slice(-2)}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${('0' + m).slice(-2)}-${('0' + lastDay).slice(-2)}`;

    // 分类饼图混收支无意义：全部/支出都看支出构成，收入看收入构成
    const analysisType = filter === 1 ? 1 : 2;

    try {
      // 步骤2：并行请求 Dashboard 和分类分析数据
      const [dashboardRes, analysisRes] = await Promise.all([
        API.getDashboard({ startDate, endDate, type: filter, scope: billType, groupId: currentGroupId }),
        API.getAnalysis({ startDate, endDate, type: analysisType, scope: billType, groupId: currentGroupId })
      ]);

      // 步骤3：处理 Dashboard 数据
      if (dashboardRes.code === 0) {
        const { list, summary: rawSummary, stats } = dashboardRes.data || {};

        const summary = this.formatSummary(rawSummary);
        const processedList = this.formatTransactionList(list);

        this.setData({ summary, transactions: processedList });

        // 步骤4：处理收支日历
        this.processCalendar(stats || [], y, m - 1, filter);
      }

      // 步骤5：处理分类分析（饼图 + 柱状图 + 大类占比）
      if (analysisRes.code === 0) {
        this.buildAnalysis(analysisRes.data || {}, analysisType);
      }

    } catch (err) {
      log.error('fetchData failed:', err);
      Loading.error('加载失败');
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  },

  /**
   * 数据转换 —— 分类分析（饼图/柱状图/大类占比）
   */
  buildAnalysis(data, analysisType) {
    const { total = 0, list = [] } = data;
    const colors = analysisType === 1 ? this.data.incomeColors : this.data.chartColors;

    const analysisList = (list || []).map((item, i) => ({
      ...item,
      expanded: false,
      iconUrl: resolveIconUrl(item.icon),
      color: colors[i % colors.length]
    }));

    this.setData({
      analysisTotal: total,
      analysisList,
      pieStyle: this.buildPieStyle(list, colors),
      pieLegend: (list || []).slice(0, 4).map((item, i) => ({
        ...item,
        color: colors[i % colors.length]
      }))
    });

    this.buildBarChartData(analysisList, analysisType);
  },

  /**
   * 数据转换 —— 环形饼图 conic-gradient
   */
  buildPieStyle(list, colors) {
    if (!list || list.length === 0) return '#F2F2F2';

    let acc = 0;
    const segs = list.map((item, i) => {
      const start = acc;
      acc += Number(item.percent) || 0;
      // 最后一段补到 100%，避免浮点累加留下缝隙
      const end = i === list.length - 1 ? 100 : acc;
      return `${colors[i % colors.length]} ${start}% ${end}%`;
    });
    return `conic-gradient(${segs.join(',')})`;
  },

  /**
   * 数据转换 —— 柱状图数据（纯 WXML 驱动，取前 6 大类）
   */
  buildBarChartData(list, analysisType) {
    if (!list || list.length === 0) {
      this.setData({ barChartData: [] });
      return;
    }

    const drawList = list.slice(0, 6);
    const maxVal = Math.max(...drawList.map(item => parseFloat(item.amount))) || 1;
    const colors = analysisType === 1 ? this.data.incomeColors : this.data.chartColors;

    const barChartData = drawList.map((item, index) => {
      const amount = parseFloat(item.amount);
      const heightPercent = Math.max((amount / maxVal) * 100, 2);
      const displayName = item.name.length > 4 ? item.name.substring(0, 3) + '..' : item.name;

      return {
        name: item.name,
        displayName,
        displayAmount: amount.toFixed(0),
        heightPercent: heightPercent.toFixed(1),
        color: colors[index % colors.length]
      };
    });

    this.setData({ barChartData });
  },

  /**
   * 事件处理 —— 展开/折叠子分类
   */
  onToggleSub(e) {
    const idx = e.currentTarget.dataset.index;
    const list = this.data.analysisList;
    list.forEach((item, i) => {
      if (i === idx) item.expanded = !item.expanded;
      else item.expanded = false;
    });
    this.setData({ analysisList: list });
  },

  /**
   * 数据转换 —— 汇总格式化
   */
  formatSummary(rawSummary) {
    const income = parseFloat(rawSummary.totalIncome || 0);
    const expense = parseFloat(rawSummary.totalExpense || 0);
    return {
      totalIncome: income.toFixed(2),
      totalExpense: expense.toFixed(2),
      balance: (income - expense).toFixed(2)
    };
  },

  /**
   * 数据转换 —— 明细列表格式化
   */
  formatTransactionList(list) {
    return (list || []).map(item => {
      const date = item.date ? item.date.split('T')[0] : '';
      // trade_time = 购买时间的时分('HH:mm')；为空表示未给时间(如识图导入)，只显示年月日
      const tradeTime = item.trade_time || '';
      const displayDateTime = tradeTime ? `${date} ${tradeTime}` : date;

      return {
        ...item,
        date,
        x: 0,                       // 滑动删除偏移
        trade_time: tradeTime,
        displayDateTime,            // 列表卡片：年月日时分 / 年月日
        dayTime: tradeTime,         // 全天明细弹窗：仅时分(识图为空)
        iconUrl: resolveIconUrl(item.icon),
        amount: parseFloat(item.amount).toFixed(2)
      };
    });
  },

  /**
   * 时间格式化 —— 固定输出上海时区时间
   */
  formatShanghaiTime(value, mode) {
    if (!value) return '';

    if (typeof value === 'string') {
      const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
      const plainMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);

      // 后端若直接返回本地数据库时间字符串，则按原始时分秒展示，避免再次按时区偏移。
      if (plainMatch && !hasTimezone) {
        const month = parseInt(plainMatch[2], 10);
        const day = parseInt(plainMatch[3], 10);
        const hh = plainMatch[4];
        const mm = plainMatch[5];
        const ss = plainMatch[6] || '00';
        if (mode === 'HH:MM') return `${hh}:${mm}`;
        if (mode === 'HH:MM:SS') return `${hh}:${mm}:${ss}`;
        return `${month}月${day}日 ${hh}:${mm}:${ss}`;
      }
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';

    // 统一按 UTC+8 计算，避免设备本地时区影响展示结果。
    const shanghaiDate = new Date(parsed.getTime() + 8 * 60 * 60 * 1000);

    const month = shanghaiDate.getUTCMonth() + 1;
    const day = shanghaiDate.getUTCDate();
    const hh = ('0' + shanghaiDate.getUTCHours()).slice(-2);
    const mm = ('0' + shanghaiDate.getUTCMinutes()).slice(-2);
    const ss = ('0' + shanghaiDate.getUTCSeconds()).slice(-2);
    if (mode === 'HH:MM') return `${hh}:${mm}`;
    if (mode === 'HH:MM:SS') return `${hh}:${mm}:${ss}`;
    return `${month}月${day}日 ${hh}:${mm}:${ss}`;
  },

  /**
   * 数据转换 —— 收支日历
   */
  processCalendar(stats, year, month, filterType) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarData = [];

    // 补齐空格
    for (let i = 0; i < firstDay; i++) {
      calendarData.push({ empty: true });
    }

    // 映射统计数据
    const statsMap = {};
    (stats || []).forEach(s => {
      statsMap[s.date] = {
        income: parseFloat(s.income || 0),
        expense: parseFloat(s.expense || 0)
      };
    });

    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
    const today = now.getDate();
    const formatDate = (y, m, d) => `${y}-${('0' + (m + 1)).slice(-2)}-${('0' + d).slice(-2)}`;

    // 生成每日单元格
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = formatDate(year, month, i);
      const data = statsMap[dateStr] || { income: 0, expense: 0 };
      const cellData = this.formatCalendarCell(data, filterType, i, dateStr, isCurrentMonth && today === i);
      calendarData.push(cellData);
    }

    this.setData({ calendarData });
  },

  /**
   * 数据转换 —— 单个日历格子
   */
  formatCalendarCell(data, filterType, day, dateStr, isToday) {
    const { income, expense } = data;
    let amountStr = '';
    let type = 'none';
    let hasData = false;

    if (filterType === 1) {
      if (income > 0) { amountStr = `+${income.toFixed(2)}`; type = 'income'; hasData = true; }
    } else if (filterType === 2) {
      if (expense > 0) { amountStr = `-${expense.toFixed(2)}`; type = 'expense'; hasData = true; }
    } else {
      const net = income - expense;
      if (net > 0) { amountStr = `+${net.toFixed(2)}`; type = 'income'; hasData = true; }
      else if (net < 0) { amountStr = `-${Math.abs(net).toFixed(2)}`; type = 'expense'; hasData = true; }
      else if (income > 0 || expense > 0) { amountStr = '0.00'; type = 'mixed'; hasData = true; }
    }

    return { date: dateStr, day, amountStr, income, expense, type, hasData, isToday };
  },

  /**
   * 事件处理 —— 筛选类型切换
   */
  onTypeChange(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    if (type === this.data.typeFilter) return;

    this.setData({ typeFilter: type }, () => this.fetchData());
  },

  /**
   * 事件处理 —— 月份切换
   */
  changeMonth(e) {
    const delta = parseInt(e.currentTarget.dataset.delta);
    let { currentYear, currentMonth } = this.data;
    currentMonth += delta;

    if (currentMonth > 12) { currentMonth = 1; currentYear++; }
    else if (currentMonth < 1) { currentMonth = 12; currentYear--; }

    this.setData({ currentYear, currentMonth }, () => this.fetchData());
  },

  /**
   * 事件处理 —— 回到今天
   */
  goToday() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1
    }, () => this.fetchData());
  },

  /**
   * 事件处理 —— 账本类型切换
   */
  showBillTypeSwitch() {
    this.setData({ showBillTypeModal: true });
  },

  closeBillTypeModal() {
    this.setData({ showBillTypeModal: false });
  },

  onSwitchBillType(e) {
    const { type, groupid } = e.currentTarget.dataset;
    const targetType = parseInt(type);
    const targetGroupId = groupid ? parseInt(groupid) : null;

    if (this.data.billType === targetType && this.data.currentGroupId === targetGroupId) {
      this.closeBillTypeModal();
      return;
    }

    this.setData({
      billType: targetType,
      currentGroupId: targetGroupId,
      showBillTypeModal: false
    });
    this.fetchData();
  },

  /**
   * 事件处理 —— 日历详情弹窗
   */
  showCalendarDetail(e) {
    const { item } = e.currentTarget.dataset;
    if (!item || item.empty) return;

    const filter = this.data.typeFilter;
    const dayTransactions = (this.data.transactions || []).filter(t => {
      const matchDate = t.date === item.date;
      if (filter === 0) return matchDate;
      return matchDate && t.type === filter;
    });

    this.setData({
      showDetailPopup: true,
      detailDate: item.date,
      selectedDateTransactions: dayTransactions
    });
  },

  closeDetailPopup() {
    this.setData({ showDetailPopup: false });
  },

  /**
   * 事件处理 —— 点击明细跳转编辑
   */
  onEditTransaction(e) {
    if (this._didSwipe) {
      this._didSwipe = false;
      return;
    }

    const { id, index } = e.currentTarget.dataset;
    const item = this.data.transactions[index];
    if (!item) return;

    if (item.x && item.x !== 0) {
      this.resetSwipeStates();
      return;
    }

    app.globalData.editingTransaction = {
      id: item.id,
      type: item.type,
      amount: item.amount,
      date: item.date,
      note: item.note,
      category: item.category,
      category_id: item.category_id
    };
    wx.navigateTo({ url: `/pages/edit/index?id=${id}` });
  },

  /**
   * 事件处理 —— 删除交易
   */
  async onDeleteTransaction(e) {
    const { id } = e.currentTarget.dataset;
    const res = await new Promise(resolve => {
      wx.showModal({
        title: '确认删除',
        content: '删除后无法恢复，确定要删除这条记录吗？',
        confirmColor: '#ff4d4f',
        success: resolve
      });
    });

    if (!res.confirm) {
      this.resetSwipeStates();
      return;
    }

    Loading.show('删除中...');
    try {
      await API.deleteTransaction(id);
      Loading.success('已删除');
      this.fetchData();
    } catch (err) {
      log.error('onDeleteTransaction failed:', err);
      Loading.error(err.message || '删除失败');
    } finally {
      Loading.hide();
      this.resetSwipeStates();
    }
  },

  /**
   * 事件处理 —— 导航
   */
  navToSettings() {
    wx.switchTab({ url: '/pages/settings/index' });
  },

  navTo(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({ url });
    } else {
      this.navToSettings();
    }
  },

  // 阻止事件冒泡
  noop() {},

  /**
   * 事件处理 —— 滑动删除
   */
  resetSwipeStates() {
    const list = this.data.transactions.map(i => ({ ...i, x: 0 }));
    this.setData({ transactions: list });
  },

  onSwipeStart() {
    this._didSwipe = false;
    this._touchStartX = null;
  },

  onSwipeChange(e) {
    this._currentX = e.detail.x;
    // source 为 'touch' 表示用户实际拖动；setData 引起的回调 source 为 ''
    if (e.detail.source === 'touch') {
      this._didSwipe = true;
    }
  },

  onSwipeEnd(e) {
    const { index } = e.currentTarget.dataset;
    const windowInfo = wx.getWindowInfo();
    const btnWidthPx = -(windowInfo.windowWidth / 750 * 150);
    const threshold = btnWidthPx / 2;

    let finalX = 0;
    if (this._currentX < threshold) {
      finalX = btnWidthPx;
    }

    const key = `transactions[${index}].x`;
    this.setData({ [key]: finalX });
    this._currentX = 0;
  },
});
