const app = getApp();
const API = require('../../utils/api');
const Loading = require('../../utils/loading');

// 静态分类图标映射
const CATEGORY_ICON_MAP = {
  '餐饮': '🍔', '购物': '🛍️', '交通': '🚗', '娱乐': '🎮',
  '医疗': '🏥', '教育': '📚', '居住': '🏠', '人情': '🧧',
  '转账': '💸', '工资': '💰', '理财': '📈', '其他': '📦'
};

Page({
  /**
   * 页面数据
   */
  data: {
    transactions: [],
    heatmapData: [],
    loading: true,
    maxY: 100,
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
    groupedTransactions: [],
    chartTitle: '近30日收支变动',
    chartColor: '#1890ff',
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    showDetailPopup: false,
    detailDate: '',
  },

  /**
   * 生命周期 —— 只做调度
   */
  onLoad() {
    app.onLoginReady((authorized) => {
      if (!authorized) {
        wx.reLaunch({ url: '/pages/login/index' });
      } else {
        this.fetchMyGroups();
      }
    });
  },

  onShow() {
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
      console.error('fetchMyGroups failed:', err);
    }
  },

  /**
   * 数据获取 —— 主数据（Dashboard + 趋势）
   */
  async fetchData() {
    if (!app.globalData.isAuthorized) {
      console.log('用户未授权，停止加载数据');
      return;
    }

    this.setData({ loading: true });

    const { currentYear: y, currentMonth: m, typeFilter: filter, billType, currentGroupId } = this.data;

    // 步骤1：计算日期范围
    const startDate = `${y}-${('0' + m).slice(-2)}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${('0' + m).slice(-2)}-${('0' + lastDay).slice(-2)}`;

    try {
      // 步骤2：并行请求 Dashboard 和趋势数据
      const now = new Date();
      const isThisMonth = y === now.getFullYear() && m === (now.getMonth() + 1);
      const trendDate = isThisMonth ? null : `${y}-${('0' + m).slice(-2)}-01`;

      const [dashboardRes, trendRes] = await Promise.all([
        API.getDashboard({ startDate, endDate, type: filter, scope: billType, groupId: currentGroupId }),
        API.getTrend({ type: filter, date: trendDate, scope: billType, groupId: currentGroupId })
      ]);

      // 步骤3：更新图表标题
      const titleBase = filter === 1 ? '收入趋势' : (filter === 2 ? '支出趋势' : '收支变动');
      const titlePrefix = isThisMonth ? '近30日' : `${m}月`;
      this.setData({ chartTitle: `${titlePrefix}${titleBase}` });

      // 步骤4：处理 Dashboard 数据
      if (dashboardRes.code === 0) {
        const { list, summary: rawSummary, stats } = dashboardRes.data || {};

        const summary = this.formatSummary(rawSummary);
        const processedList = this.formatTransactionList(list);
        const groups = this.groupTransactionsByDate(processedList);

        this.setData({ summary, groupedTransactions: groups, transactions: processedList });

        // 步骤5：处理收支日历
        this.processCalendar(stats || [], y, m - 1, filter);
      }

      // 步骤6：处理趋势曲线
      if (trendRes.code === 0) {
        const { current, last, dailyAverage, lastAverage, dateRange } = trendRes.data || {};
        this.processTrend(current, last, dailyAverage, lastAverage, dateRange);
      }

    } catch (err) {
      console.error('fetchData failed:', err);
      Loading.error('加载失败');
    } finally {
      this.setData({ loading: false }, () => {
        if (this.chartParams) {
          const { data, maxY, cycleDays, lastAverage } = this.chartParams;
          setTimeout(() => {
            this.drawTrendChart(data, maxY, cycleDays, lastAverage, -1, true);
          }, 50);
        }
      });
      wx.stopPullDownRefresh();
    }
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
      const createdAt = new Date(item.created_at);
      const formattedTime = [
        ('0' + createdAt.getHours()).slice(-2),
        ('0' + createdAt.getMinutes()).slice(-2),
        ('0' + createdAt.getSeconds()).slice(-2)
      ].join(':');

      return {
        ...item,
        date,
        formattedTime,
        icon: item.icon || CATEGORY_ICON_MAP[item.category] || CATEGORY_ICON_MAP['其他'],
        amount: parseFloat(item.amount).toFixed(2)
      };
    });
  },

  /**
   * 数据转换 —— 按日期分组
   */
  groupTransactionsByDate(list) {
    const groups = [];
    list.forEach(item => {
      let group = groups.find(g => g.date === item.date);
      if (!group) {
        group = { date: item.date, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    });
    return groups;
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
   * 数据转换 —— 趋势图数据
   */
  processTrend(currentStats, lastStats, dailyAvgCurve, lastAverage, dateRange) {
    const currentMap = {};
    const lastDataMap = {};
    const avgMap = {};
    let maxY = 10;

    // 映射本期数据
    (currentStats || []).forEach(s => {
      currentMap[s.date] = parseFloat(s.total_amount || 0);
      if (currentMap[s.date] > maxY) maxY = currentMap[s.date];
    });

    // 映射上期数据
    (lastStats || []).forEach(s => {
      lastDataMap[s.date] = parseFloat(s.total_amount || 0);
      if (lastDataMap[s.date] > maxY) maxY = lastDataMap[s.date];
    });

    // 映射历史日均数据
    (dailyAvgCurve || []).forEach(s => {
      avgMap[s.day] = parseFloat(s.avg_amount || 0);
      if (avgMap[s.day] > maxY) maxY = avgMap[s.day];
    });

    if (lastAverage > maxY) maxY = lastAverage;

    // 生成图表数据点
    const start = new Date(dateRange.current.start);
    const lastStart = new Date(dateRange.last.start);
    const cycleDays = currentStats.length;
    const chartData = [];

    for (let i = 0; i < cycleDays; i++) {
      const curDateObj = new Date(start);
      curDateObj.setDate(start.getDate() + i);
      const curDateStr = curDateObj.toISOString().split('T')[0];

      const lastDateObj = new Date(lastStart);
      lastDateObj.setDate(lastStart.getDate() + i);
      const lastDateStr = lastDateObj.toISOString().split('T')[0];

      chartData.push({
        day: curDateObj.getDate(),
        current: currentMap[curDateStr] || 0,
        last: lastDataMap[lastDateStr] || 0,
        avg: avgMap[curDateObj.getDate()] || 0
      });
    }

    this.chartParams = { data: chartData, maxY, lastAverage, cycleDays };
    this.drawTrendChart(chartData, maxY, cycleDays, lastAverage);
  },

  /**
   * 事件处理 —— 筛选类型切换
   */
  onTypeChange(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    if (type === this.data.typeFilter) return;

    this.setData({
      typeFilter: type,
      chartColor: type === 1 ? '#ff4d4f' : '#1890ff'
    }, () => this.fetchData());
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
      console.error('onDeleteTransaction failed:', err);
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
    const groups = this.data.groupedTransactions.map(g => ({
      ...g,
      items: g.items.map(i => ({ ...i, x: 0 }))
    }));
    this.setData({ groupedTransactions: groups });
  },

  onSwipeStart() {},

  onSwipeChange(e) {
    this._currentX = e.detail.x;
  },

  onSwipeEnd(e) {
    const { index, groupIndex } = e.currentTarget.dataset;
    const windowInfo = wx.getWindowInfo();
    const btnWidthPx = -(windowInfo.windowWidth / 750 * 150);
    const threshold = btnWidthPx / 2;

    let finalX = 0;
    if (this._currentX < threshold) {
      finalX = btnWidthPx;
    }

    const key = `groupedTransactions[${groupIndex}].items[${index}].x`;
    this.setData({ [key]: finalX });
    this._currentX = 0;
  },

  /**
   * 图表绘制 —— 趋势折线图（Canvas 2D）
   */
  handleChartTouch(e) {
    if (!this.chartParams) return;
    const touch = e.touches[0];
    const { data: chartData, maxY, lastAverage } = this.chartParams;

    const query = wx.createSelectorQuery();
    query.select('#lineChart').boundingClientRect(res => {
      if (!res) return;
      const touchX = touch.clientX - res.left;
      const paddingLeft = 40;
      const paddingRight = 15;
      const plotWidth = res.width - paddingLeft - paddingRight;

      let idx = Math.round(((touchX - paddingLeft) / plotWidth) * (chartData.length - 1));
      idx = Math.max(0, Math.min(chartData.length - 1, idx));

      if (this.currentTouchIdx !== idx) {
        this.currentTouchIdx = idx;
        const { cycleDays } = this.chartParams;
        this.drawTrendChart(chartData, maxY, cycleDays, lastAverage, idx);
      }
    }).exec();
  },

  handleChartEnd() {
    if (!this.chartParams) return;
    const { data: chartData, maxY, lastAverage, cycleDays } = this.chartParams;
    this.currentTouchIdx = -1;
    this.drawTrendChart(chartData, maxY, cycleDays, lastAverage);
  },

  drawTrendChart(data, maxY, totalDays, lastAverage, selectedIndex = -1, animate = false) {
    const query = wx.createSelectorQuery();
    query.select('#lineChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getWindowInfo().pixelRatio;

        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);

        const width = res[0].width;
        const height = res[0].height;
        const paddingLeft = 45;
        const paddingBottom = 30;
        const paddingRight = 20;
        const paddingTop = 75;
        const plotWidth = width - paddingLeft - paddingRight;
        const plotHeight = height - paddingTop - paddingBottom;

        const scale = this.getProfessionalScale(maxY);
        const niceMaxY = scale.max;
        const xStep = plotWidth / (totalDays - 1);

        let progress = animate ? 0 : 1;
        const startTime = Date.now();
        const duration = 1000;

        const renderFrame = () => {
          if (animate) {
            const now = Date.now();
            progress = Math.min(1, (now - startTime) / duration);
            progress = 1 - Math.pow(1 - progress, 3);
          }

          ctx.clearRect(0, 0, width, height);

          const formatVal = (v) => {
            if (v === 0) return '0';
            if (v >= 1000) return (v / 1000).toFixed(1) + 'k';
            return Math.floor(v).toString();
          };

          // 绘制顶部图例
          this.drawChartLegend(ctx, data, width, paddingLeft, selectedIndex);

          // 绘制网格与 Y 轴
          ctx.beginPath();
          ctx.strokeStyle = '#f0f0f0';
          ctx.lineWidth = 1;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#999';
          ctx.font = '9px sans-serif';

          for (let i = 0; i <= 4; i++) {
            const val = scale.step * i;
            const y = (height - paddingBottom) - (val / niceMaxY) * plotHeight;
            ctx.moveTo(paddingLeft, y);
            ctx.lineTo(width - paddingRight, y);
            ctx.fillText(formatVal(val), paddingLeft - 8, y);
          }
          ctx.stroke();

          // 绘制 X 轴标签
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          const labelIndices = [0, Math.floor(totalDays / 2), totalDays - 1];
          labelIndices.forEach(idx => {
            if (data[idx]) {
              const x = paddingLeft + idx * xStep;
              ctx.fillText(`${data[idx].day}日`, x, height - paddingBottom + 8);
            }
          });

          // 开启裁剪区域
          ctx.save();
          ctx.beginPath();
          ctx.rect(paddingLeft - 5, paddingTop - 10, plotWidth + 10, plotHeight + 15);
          ctx.clip();

          // 绘制指示虚线
          if (selectedIndex >= 0) {
            const x = paddingLeft + selectedIndex * xStep;
            ctx.beginPath();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = '#eee';
            ctx.moveTo(x, paddingTop);
            ctx.lineTo(x, height - paddingBottom);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // 绘制曲线
          const getPoints = (seriesKey) => data.map((item, index) => {
            const val = seriesKey === 'avg' ? item.avg : (seriesKey === 'last' ? item.last : item.current);
            return {
              x: paddingLeft + index * xStep,
              y: (height - paddingBottom) - (Math.max(0, val) / niceMaxY) * plotHeight
            };
          });

          this.drawCurve(ctx, getPoints('avg'), '#FFA500', true, 1, progress, paddingLeft, plotWidth);
          this.drawCurve(ctx, getPoints('last'), '#b3d8ff', true, 1.5, progress, paddingLeft, plotWidth);
          this.drawCurve(ctx, getPoints('current'), this.data.chartColor, false, 2.5, progress, paddingLeft, plotWidth);

          // 绘制焦点圆点
          if (progress >= 0.95) {
            const currentPoints = getPoints('current');
            const targetIdx = selectedIndex >= 0 ? selectedIndex : currentPoints.length - 1;
            const p = currentPoints[targetIdx];
            if (p) {
              ctx.beginPath();
              ctx.fillStyle = this.data.chartColor;
              ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }

          ctx.restore();

          if (animate && progress < 1) {
            canvas.requestAnimationFrame(renderFrame);
          }
        };

        renderFrame();
      });
  },

  /**
   * 图表辅助 —— Y 轴刻度计算
   */
  getProfessionalScale(max) {
    if (max <= 0) return { max: 100, step: 25 };
    const targetMax = max * 1.1;
    const idealStep = targetMax / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(idealStep)));
    const normalizedStep = idealStep / magnitude;
    let step;
    if (normalizedStep < 1.5) step = 1;
    else if (normalizedStep < 3) step = 2;
    else if (normalizedStep < 7) step = 5;
    else step = 10;
    const actualStep = step * magnitude;
    return { max: actualStep * 4 >= targetMax ? actualStep * 4 : actualStep * 5, step: actualStep };
  },

  /**
   * 图表辅助 —— 图例绘制
   */
  drawChartLegend(ctx, data, width, paddingLeft, selectedIndex) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const displayIdx = selectedIndex >= 0 ? selectedIndex : data.length - 1;
    const d = data[displayIdx];
    if (!d) return;

    const items = [
      { label: selectedIndex >= 0 ? `${d.day}日数据` : '今日', val: d.current, color: this.data.chartColor },
      { label: '上月今日', val: d.last, color: '#b3d8ff' },
      { label: '历史今日', val: d.avg, color: '#FFA500' }
    ];
    const itemWidth = (width - 60) / 3;

    items.forEach((item, i) => {
      const x = paddingLeft + i * itemWidth + 10;

      ctx.beginPath();
      ctx.fillStyle = item.color;
      ctx.arc(x, 15, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#999';
      ctx.fillText(item.label, x + 8, 16);

      ctx.font = 'bold 16px "DIN Alternate"';
      ctx.fillStyle = '#333';
      ctx.fillText(parseFloat(item.val || 0).toFixed(1), x, 36);
    });
  },

  /**
   * 图表辅助 —— 贝塞尔曲线绘制
   */
  drawCurve(ctx, points, color, isDashed, lineWidth, curProgress, paddingLeft, plotWidth) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    if (isDashed) ctx.setLineDash([4, 4]); else ctx.setLineDash([]);

    const maxX = paddingLeft + (plotWidth * curProgress);
    if (points[0].x > maxX) return;

    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      if (p1.x >= maxX) break;

      if (p2.x <= maxX) {
        const cp1x = p1.x + (p2.x - p1.x) / 2;
        const cp2x = p1.x + (p2.x - p1.x) / 2;
        ctx.bezierCurveTo(cp1x, p1.y, cp2x, p2.y, p2.x, p2.y);
      } else {
        const t = (maxX - p1.x) / (p2.x - p1.x);
        const midX = p1.x + (p2.x - p1.x) * t;
        const midY = p1.y + (p2.y - p1.y) * t;
        const cp1x = p1.x + (midX - p1.x) / 2;
        ctx.quadraticCurveTo(cp1x, p1.y, midX, midY);
        break;
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
});
