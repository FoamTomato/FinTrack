const app = getApp();
const { request } = require('../../utils/request');

Page({
  data: {
    scope: 0, // 0: 个人; 1: 小组
    groups: [], // 我的小组列表
    currentGroupIndex: 0, // 当前选中的小组索引
    groupId: null,

    // 日期相关
    dateMode: 'month', // 'month' | 'range'
    currentMonth: '', // YYYY-MM
    startDate: '', // YYYY-MM-DD
    endDate: '',   // YYYY-MM-DD
    displayDate: '',
    
    // 筛选弹窗
    showFilterModal: false,
    tempStartDate: '',
    tempEndDate: '',
    quickKey: 'month', // month, 1m, 3m, 6m, 1y, custom
    type: 2, // 1: 收入, 2: 支出

    total: 0,
    list: [],
    loading: false,
    chartColors: ['#07C160', '#FFC107', '#1989FA', '#FF9800', '#9C27B0', '#E91E63', '#009688', '#E0E0E0'],
    incomeColors: ['#FF9800', '#FF5722', '#FFC107', '#FFEB3B', '#795548', '#607D8B'],
    barChartData: [] // 纯 WXML 柱状图数据
  },

  onLoad(options) {
    // ... load logic unchanged
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

  // 获取某月最后一天
  getLastDayOfMonth(year, month) {
      const d = new Date(year, month, 0);
      return `${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  formatDate(d) {
      return d.toISOString().split('T')[0];
  },

  // ---------------- Scope & Group ----------------

  onScopeChange(e) {
      const scope = parseInt(e.currentTarget.dataset.scope);
      if (scope === this.data.scope) return;

      this.setData({ scope, list: [], total: 0 });

      if (scope === 1) {
          // 切换到小组 -> 加载小组列表
          if (this.data.groups.length === 0) {
              this.fetchMyGroups();
          } else {
              // 默认选第一个
              const firstGroup = this.data.groups[0];
              this.setData({ 
                  groupId: firstGroup.id,
                  currentGroupIndex: 0
              }, () => this.fetchData());
          }
      } else {
          // 切换回个人
          this.setData({ groupId: null }, () => this.fetchData());
      }
  },

  async fetchMyGroups() {
      try {
          const res = await request('/api/group/list', 'GET');
          if (res.code === 0 && res.data && res.data.length > 0) {
              this.setData({
                  groups: res.data,
                  groupId: res.data[0].id,
                  currentGroupIndex: 0
              }, () => {
                  this.fetchData();
              });
          } else {
              wx.showToast({ title: '暂无小组', icon: 'none' });
          }
      } catch (err) {
          console.error("Fetch groups failed", err);
      }
  },

  onGroupChange(e) {
      const idx = parseInt(e.currentTarget.dataset.index);
      const group = this.data.groups[idx];
      if (group && group.id !== this.data.groupId) {
          this.setData({
              currentGroupIndex: idx,
              groupId: group.id
          }, () => {
              this.fetchData();
          });
      }
  },

  // ---------------- Date Filter ----------------

  // 顶部日期 Picker (Month)
  onMonthPickerChange(e) {
      const val = e.detail.value; // YYYY-MM
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

  showFilter() {
      this.setData({
          showFilterModal: true,
          tempStartDate: this.data.startDate,
          tempEndDate: this.data.endDate,
          tempYear: this.data.quickKey === 'year' ? this.data.startDate.split('-')[0] : ''
      });
  },

  hideFilter() {
      this.setData({ showFilterModal: false });
  },

  onQuickFilter(e) {
      const key = e.currentTarget.dataset.key;
      let start, end;
      const today = new Date();
      
      if (key === 'month') {
          // 本月
          const y = today.getFullYear();
          const m = today.getMonth() + 1;
          start = `${y}-${String(m).padStart(2, '0')}-01`;
          end = this.getLastDayOfMonth(y, m);
      } else if (key === 'year') {
          // 本年
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
          tempYear: '' // 切换快捷筛选时清空选中年份
      });
  },

  // 新增：年选择器变更处理
  onYearPickerChange(e) {
    const year = e.detail.value;
    this.setData({
        tempYear: year,
        tempStartDate: `${year}-01-01`,
        tempEndDate: `${year}-12-31`,
        quickKey: 'year' // 统一使用 year 类型的标识
    });
  },

  onTempDateChange(e) {
      const type = e.currentTarget.dataset.type; // start or end
      const val = e.detail.value;
      
      this.setData({
          [`temp${type === 'start' ? 'Start' : 'End'}Date`]: val,
          quickKey: 'custom',
          tempYear: '' // 切换自定义日期时清空年份
      });
  },

  confirmFilter() {
      const { tempStartDate, tempEndDate, quickKey } = this.data;
      if (!tempStartDate || !tempEndDate) {
          return wx.showToast({ title: '请选择完整日期', icon: 'none' });
      }
      if (tempStartDate > tempEndDate) {
          return wx.showToast({ title: '开始日期不能晚于结束日期', icon: 'none' });
      }

      let displayDate = '';
      const [startYear, startMonth, startDay] = tempStartDate.split('-');
      const [endYear, endMonth, endDay] = tempEndDate.split('-');
      const today = new Date();
      const currentYear = today.getFullYear().toString();

      if (quickKey === 'month') {
           displayDate = `${startYear}年${startMonth}月`;
      } else if (quickKey === 'year') {
           displayDate = `${startYear}年`;
      } else {
           // 精确日期范围美化
           const startStr = startYear === currentYear ? `${startMonth}.${startDay}` : `${startYear.substring(2)}.${startMonth}.${startDay}`;
           const endStr = endYear === currentYear ? `${endMonth}.${endDay}` : `${endYear.substring(2)}.${endMonth}.${endDay}`;
           displayDate = `${startStr} - ${endStr}`;
      }

      this.setData({
          startDate: tempStartDate,
          endDate: tempEndDate,
          displayDate,
          quickKey,
          showFilterModal: false,
          dateMode: (quickKey === 'month' || quickKey === 'year') ? quickKey : 'range'
      }, () => {
          this.fetchData();
      });
  },

  noop() {},

  toggleSub(e) {
    const idx = e.currentTarget.dataset.index;
    const list = this.data.list;
    list.forEach((item, i) => {
        if(i === idx) item.expanded = !item.expanded;
        else item.expanded = false; // Accordion effect
    });
    this.setData({ list });
  },

  navToAdd() {
    wx.switchTab({ url: '/pages/add/index' });
  },


  onTypeChange(e) {
      if (e.target.dataset.type) { // click on text
         const type = parseInt(e.target.dataset.type);
         if (type !== this.data.type) {
             this.setData({ type, list: [], total: 0 }, () => {
                 this.fetchData();
             });
         }
      }
  },

  // ... other methods ...

  async fetchData() {
    this.setData({ loading: true });
    
    try {
        const res = await request('/api/transaction/analysis', 'GET', {
            startDate: this.data.startDate,
            endDate: this.data.endDate,
            scope: this.data.scope,
            groupId: this.data.groupId,
            type: this.data.type // Use dynamic type
        });

        if (res.code === 0) {
            const { total, list } = res.data;
            const processedList = list.map(item => ({ ...item, expanded: false }));
            this.setData({ total, list: processedList });
            
            this.drawBarChart(processedList);
        }
    } catch (err) {
        console.error('Fetch analysis failed', err);
    } finally {
        this.setData({ loading: false });
    }
  },

  /** 构建柱状图数据（纯 WXML 驱动，避免 canvas 原生组件层级问题） */
  drawBarChart(list) {
      if (!list || list.length === 0) {
          this.setData({ barChartData: [] });
          return;
      }

      const drawList = list.slice(0, 6);
      const maxVal = Math.max(...drawList.map(item => parseFloat(item.amount))) || 1;
      const colors = this.data.type === 1 ? this.data.incomeColors : this.data.chartColors;

      const barChartData = drawList.map((item, index) => {
          const amount = parseFloat(item.amount);
          const heightPercent = Math.max((amount / maxVal) * 100, 2); // 最低 2% 保证可见
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
