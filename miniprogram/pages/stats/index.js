const API = require('../../utils/api');
const Loading = require('../../utils/loading');
const Logger = require('../../utils/logger');
const log = Logger.module('stats');

const { resolveIconUrl } = require('../../utils/request');

Page({
  /**
   * 页面数据
   */
  data: {
    scope: 0,
    groups: [],
    currentGroupIndex: 0,
    groupId: null,
    dateMode: 'month',
    currentMonth: '',
    startDate: '',
    endDate: '',
    displayDate: '',
    showFilterModal: false,
    tempStartDate: '',
    tempEndDate: '',
    quickKey: 'month',
    type: 2,
    total: 0,
    list: [],
    loading: false,
    chartColors: ['#07C160', '#FFC107', '#1989FA', '#FF9800', '#9C27B0', '#E91E63', '#009688', '#E0E0E0'],
    incomeColors: ['#FF9800', '#FF5722', '#FFC107', '#FFEB3B', '#795548', '#607D8B'],
    barChartData: []
  },

  /**
   * 生命周期 —— 只做调度
   */
  onLoad() {
    // 初始化日期为当月
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const currentMonth = `${yyyy}-${mm}`;

    this.setData({
      currentMonth,
      startDate: `${currentMonth}-01`,
      endDate: this.getLastDayOfMonth(yyyy, today.getMonth() + 1),
      displayDate: `${yyyy}年${mm}月`,
      quickKey: 'month'
    });

    this.fetchData();
  },

  /**
   * 数据转换 —— 日期工具
   */
  getLastDayOfMonth(year, month) {
    const d = new Date(year, month, 0);
    return `${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  formatDate(d) {
    return d.toISOString().split('T')[0];
  },

  /**
   * 事件处理 —— 个人/小组切换
   */
  onScopeChange(e) {
    const scope = parseInt(e.currentTarget.dataset.scope);
    if (scope === this.data.scope) return;

    this.setData({ scope, list: [], total: 0 });

    if (scope === 1) {
      if (this.data.groups.length === 0) {
        this.fetchMyGroups();
      } else {
        const firstGroup = this.data.groups[0];
        this.setData({
          groupId: firstGroup.id,
          currentGroupIndex: 0
        }, () => this.fetchData());
      }
    } else {
      this.setData({ groupId: null }, () => this.fetchData());
    }
  },

  /**
   * 数据获取 —— 小组列表
   */
  async fetchMyGroups() {
    try {
      const res = await API.getGroups();
      if (res.code === 0 && res.data && res.data.length > 0) {
        this.setData({
          groups: res.data,
          groupId: res.data[0].id,
          currentGroupIndex: 0
        }, () => this.fetchData());
      } else {
        Loading.toast('暂无小组');
      }
    } catch (err) {
      log.error('fetchMyGroups failed:', err);
    }
  },

  /**
   * 事件处理 —— 小组切换
   */
  onGroupChange(e) {
    const idx = parseInt(e.currentTarget.dataset.index);
    const group = this.data.groups[idx];
    if (group && group.id !== this.data.groupId) {
      this.setData({
        currentGroupIndex: idx,
        groupId: group.id
      }, () => this.fetchData());
    }
  },

  /**
   * 事件处理 —— 月份选择器
   */
  onMonthPickerChange(e) {
    const val = e.detail.value;
    const [y, m] = val.split('-');
    const year = parseInt(y);
    const month = parseInt(m);

    this.setData({
      currentMonth: val,
      startDate: `${val}-01`,
      endDate: this.getLastDayOfMonth(year, month),
      displayDate: `${y}年${m}月`,
      quickKey: 'month',
      dateMode: 'month'
    }, () => this.fetchData());
  },

  /**
   * 事件处理 —— 筛选弹窗
   */
  onShowFilter() {
    this.setData({
      showFilterModal: true,
      tempStartDate: this.data.startDate,
      tempEndDate: this.data.endDate,
      tempYear: this.data.quickKey === 'year' ? this.data.startDate.split('-')[0] : ''
    });
  },

  onHideFilter() {
    this.setData({ showFilterModal: false });
  },

  onQuickFilter(e) {
    const key = e.currentTarget.dataset.key;
    let start, end;
    const today = new Date();

    if (key === 'month') {
      const y = today.getFullYear();
      const m = today.getMonth() + 1;
      start = `${y}-${String(m).padStart(2, '0')}-01`;
      end = this.getLastDayOfMonth(y, m);
    } else if (key === 'year') {
      const y = today.getFullYear();
      start = `${y}-01-01`;
      end = this.formatDate(today);
    } else {
      end = this.formatDate(today);
      const s = new Date();
      if (key === '1m') s.setMonth(s.getMonth() - 1);
      else if (key === '3m') s.setMonth(s.getMonth() - 3);
      else if (key === '1y') s.setFullYear(s.getFullYear() - 1);
      start = this.formatDate(s);
    }

    this.setData({
      tempStartDate: start,
      tempEndDate: end,
      quickKey: key,
      tempYear: ''
    });
  },

  onYearPickerChange(e) {
    const year = e.detail.value;
    this.setData({
      tempYear: year,
      tempStartDate: `${year}-01-01`,
      tempEndDate: `${year}-12-31`,
      quickKey: 'year'
    });
  },

  onTempDateChange(e) {
    const type = e.currentTarget.dataset.type;
    const val = e.detail.value;

    this.setData({
      [`temp${type === 'start' ? 'Start' : 'End'}Date`]: val,
      quickKey: 'custom',
      tempYear: ''
    });
  },

  /**
   * 事件处理 —— 确认筛选
   */
  onConfirmFilter() {
    const { tempStartDate, tempEndDate, quickKey } = this.data;
    if (!tempStartDate || !tempEndDate) {
      return Loading.toast('请选择完整日期');
    }
    if (tempStartDate > tempEndDate) {
      return Loading.toast('开始日期不能晚于结束日期');
    }

    const displayDate = this.formatDisplayDate(tempStartDate, tempEndDate, quickKey);

    this.setData({
      startDate: tempStartDate,
      endDate: tempEndDate,
      displayDate,
      quickKey,
      showFilterModal: false,
      dateMode: (quickKey === 'month' || quickKey === 'year') ? quickKey : 'range'
    }, () => this.fetchData());
  },

  /**
   * 数据转换 —— 格式化展示日期
   */
  formatDisplayDate(startDate, endDate, quickKey) {
    const [startYear, startMonth] = startDate.split('-');
    const [endYear, endMonth, endDay] = endDate.split('-');
    const currentYear = new Date().getFullYear().toString();

    if (quickKey === 'month') return `${startYear}年${startMonth}月`;
    if (quickKey === 'year') return `${startYear}年`;

    const startDay = startDate.split('-')[2];
    const startStr = startYear === currentYear ? `${startMonth}.${startDay}` : `${startYear.substring(2)}.${startMonth}.${startDay}`;
    const endStr = endYear === currentYear ? `${endMonth}.${endDay}` : `${endYear.substring(2)}.${endMonth}.${endDay}`;
    return `${startStr} - ${endStr}`;
  },

  // 阻止冒泡
  noop() {},

  /**
   * 事件处理 —— 展开/折叠子分类
   */
  onToggleSub(e) {
    const idx = e.currentTarget.dataset.index;
    const list = this.data.list;
    list.forEach((item, i) => {
      if (i === idx) item.expanded = !item.expanded;
      else item.expanded = false;
    });
    this.setData({ list });
  },

  /**
   * 事件处理 —— 导航
   */
  onNavToAdd() {
    wx.switchTab({ url: '/pages/add/index' });
  },

  /**
   * 事件处理 —— 收支类型切换
   */
  onTypeChange(e) {
    if (e.target.dataset.type) {
      const type = parseInt(e.target.dataset.type);
      if (type !== this.data.type) {
        this.setData({ type, list: [], total: 0 }, () => this.fetchData());
      }
    }
  },

  /**
   * 数据获取 —— 分类分析
   */
  async fetchData() {
    this.setData({ loading: true });

    try {
      // 调用分析接口
      const res = await API.getAnalysis({
        startDate: this.data.startDate,
        endDate: this.data.endDate,
        scope: this.data.scope,
        groupId: this.data.groupId,
        type: this.data.type
      });

      if (res.code === 0) {
        const { total, list } = res.data;

        // 格式化列表数据
        const processedList = list.map(item => ({ ...item, expanded: false, iconUrl: resolveIconUrl(item.icon) }));
        this.setData({ total, list: processedList });

        // 构建柱状图
        this.buildBarChartData(processedList);
      }
    } catch (err) {
      log.error('fetchData failed:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 数据转换 —— 柱状图数据（纯 WXML 驱动）
   */
  buildBarChartData(list) {
    if (!list || list.length === 0) {
      this.setData({ barChartData: [] });
      return;
    }

    const drawList = list.slice(0, 6);
    const maxVal = Math.max(...drawList.map(item => parseFloat(item.amount))) || 1;
    const colors = this.data.type === 1 ? this.data.incomeColors : this.data.chartColors;

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
  }
});
