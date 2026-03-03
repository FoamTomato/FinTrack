const app = getApp();
const { request } = require('../../utils/request');

// 静态分类图标映射
const CATEGORY_ICON_MAP = {
  '餐饮': '🍔',
  '购物': '🛍️',
  '交通': '🚗',
  '娱乐': '🎮',
  '医疗': '🏥',
  '教育': '📚',
  '居住': '🏠',
  '人情': '🧧',
  '转账': '💸',
  '工资': '💰',
  '理财': '📈',
  '其他': '📦'
};

Page({
  data: {
    transactions: [],
    heatmapData: [],
    loading: true,
    maxY: 100,
    typeFilter: 0,
    billType: 0, // 0: 个人账本, 1: 小组账本
    myGroups: [],  // 分组列表
    currentGroupId: null, // 当前选中的小组ID
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

  onLoad() {
    app.onLoginReady((authorized) => {
      if (!authorized) {
        wx.reLaunch({ url: '/pages/login/index' });
      } else {
        this.fetchMyGroups();
      }
    });
  },

  async fetchMyGroups() {
    try {
      const res = await request('/api/group/list', 'GET');
      if (res.code === 0 && res.data) {
        this.setData({ myGroups: res.data || [] });
      }
    } catch (err) {
      console.error('Fetch groups failed', err);
    }
  },

  onShow() {
    if (app.globalData.isAuthorized === true) {
      this.fetchData();
      this.fetchMyGroups();
    }
  },

  // 用于阻止事件冒泡的空函数
  noop() {},


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

    // 如果选的是当前已经选中的，直接关闭
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

  async fetchData() {
    if (!app.globalData.isAuthorized) {
       console.log('用户未授权，停止加载数据');
       return;
    }

    this.setData({ loading: true });
    
    const { currentYear: y, currentMonth: m, typeFilter: filter, billType, currentGroupId } = this.data;
    
    // 生成当月 1 号和最后一天
    const startDate = `${y}-${('0' + m).slice(-2)}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${('0' + m).slice(-2)}-${('0' + lastDay).slice(-2)}`;

    try {
      // 这里的 typeFilter 为 0 代表全部，对应后端 type=0
      // 增加 billType 和 groupId
      const dashboardPromise = request('/api/transaction/dashboard', 'GET', { 
        startDate, 
        endDate, 
        type: filter, 
        scope: billType,
        groupId: currentGroupId 
      });
      
      // 趋势图根据是否为当前月决定请求参数
      const now = new Date();
      const isThisMonth = y === now.getFullYear() && m === (now.getMonth() + 1);
      const trendDate = isThisMonth ? null : `${y}-${('0' + m).slice(-2)}-01`;
      const trendPromise = request('/api/transaction/trend', 'GET', { 
        type: filter, 
        date: trendDate, 
        scope: billType,
        groupId: currentGroupId 
      });

      const [dashboardRes, trendRes] = await Promise.all([dashboardPromise, trendPromise]);

      // 动态更新图表标题前缀
      let titleBase = filter === 1 ? '收入趋势' : (filter === 2 ? '支出趋势' : '收支变动');
      let titlePrefix = isThisMonth ? '近30日' : `${m}月`;
      this.setData({ chartTitle: `${titlePrefix}${titleBase}` });

      // 1. 处理明细列表和概览 (受 typeFilter 影响)
      if (dashboardRes.code === 0) {
        const { list, summary: rawSummary } = dashboardRes.data || {};
        
        // 处理汇总数据
        const summary = {
          totalIncome: parseFloat(rawSummary.totalIncome || 0).toFixed(2),
          totalExpense: parseFloat(rawSummary.totalExpense || 0).toFixed(2),
          balance: (parseFloat(rawSummary.totalIncome || 0) - parseFloat(rawSummary.totalExpense || 0)).toFixed(2)
        };

        // 处理明细列表 - 增加图标并分组
        const processedList = (list || []).map(item => {
          const date = item.date ? item.date.split('T')[0] : '';
          // 格式化的具体时间 (时:分:秒)
          const createdAt = new Date(item.created_at);
          const formattedTime = [
            ('0' + createdAt.getHours()).slice(-2),
            ('0' + createdAt.getMinutes()).slice(-2),
            ('0' + createdAt.getSeconds()).slice(-2)
          ].join(':');

          return {
            ...item,
            date,
            formattedTime, // 时分秒
            icon: item.icon || CATEGORY_ICON_MAP[item.category] || CATEGORY_ICON_MAP['其他'],
            amount: parseFloat(item.amount).toFixed(2)
          };
        });

        // 按日期分组逻辑
        const groups = [];
        processedList.forEach(item => {
          let group = groups.find(g => g.date === item.date);
          if (!group) {
            group = { date: item.date, items: [] };
            groups.push(group);
          }
          group.items.push(item);
        });

        this.setData({ 
          summary,
          groupedTransactions: groups,
          transactions: processedList // 保留一份原始的，以防万一
        });
        
        // 2. 收支日历 (使用选择的月份数据)
        this.processCalendar(dashboardRes.data.stats || [], y, m - 1, filter);
      }

      // 2. 处理趋势曲线 (滚动30天)
      if (trendRes.code === 0) {
        const { current, last, dailyAverage, lastAverage, dateRange } = trendRes.data || {};
        this.processTrend(current, last, dailyAverage, lastAverage, dateRange);
      }

    } catch (err) {
      console.error(err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false }, () => {
        // 确保在数据加载完成后绘制图表
        if (this.chartParams) {
          const { data, maxY, cycleDays, lastAverage } = this.chartParams;
          // 这里的延迟是为了等待 setData 渲染完成，确保 Canvas 大小正确
          setTimeout(() => {
            this.drawTrendChart(data, maxY, cycleDays, lastAverage, -1, true); // 启用生长动画
          }, 50);
        }
      });
      wx.stopPullDownRefresh();
    }
  },

  // 处理收支日历 (动态展示：全部看盈亏，单选看明细)
  processCalendar(stats, year, month, filterType) {
    const firstDay = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarData = [];
    
    // 1. 补齐空格
    for (let i = 0; i < firstDay; i++) {
        calendarData.push({ empty: true });
    }

    // 2. 映射数据
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

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = formatDate(year, month, i);
      const data = statsMap[dateStr] || { income: 0, expense: 0 };
      
      const income = data.income;
      const expense = data.expense;
      
      let amountStr = '';
      let type = 'none';
      let hasData = false;

      // 根据 filterType 决定展示逻辑
      if (filterType === 1) { // 只看收入
          if (income > 0) {
              amountStr = `+${income.toFixed(2)}`;
              type = 'income'; 
              hasData = true;
          }
      } else if (filterType === 2) { // 只看支出
          if (expense > 0) {
              amountStr = `-${expense.toFixed(2)}`;
              type = 'expense'; 
              hasData = true;
          }
      } else { // 全部：看盈亏 (收入 - 支出)
          const net = income - expense;
          if (net > 0) {
              amountStr = `+${net.toFixed(2)}`;
              type = 'income';
              hasData = true;
          } else if (net < 0) {
              amountStr = `-${Math.abs(net).toFixed(2)}`;
              type = 'expense';
              hasData = true;
          } else if (income > 0 || expense > 0) {
               // 收支持平
               amountStr = '0.00';
               type = 'mixed';
               hasData = true;
          }
      }

      calendarData.push({
        date: dateStr,
        day: i,
        amountStr: amountStr, // 展示文案
        income, expense,      // 用于详情弹窗
        type: type,           // 决定颜色
        hasData: hasData,
        isToday: isCurrentMonth && today === i
      });
    }
    this.setData({ calendarData });
  },

  // 处理滚动30天趋势图
  processTrend(currentStats, lastStats, dailyAvgCurve, lastAverage, dateRange) {
    const chartData = [];
    const currentMap = {};
    const lastDataMap = {}; // 上期数据 (往前推30天)
    const avgMap = {};
    
    let maxY = 10;

    // 映射数据
    (currentStats || []).forEach(s => {
        currentMap[s.date] = parseFloat(s.total_amount || 0);
        if (currentMap[s.date] > maxY) maxY = currentMap[s.date];
    });
    (lastStats || []).forEach(s => {
        lastDataMap[s.date] = parseFloat(s.total_amount || 0);
        if (lastDataMap[s.date] > maxY) maxY = lastDataMap[s.date];
    });
    (dailyAvgCurve || []).forEach(s => {
        avgMap[s.day] = parseFloat(s.avg_amount || 0);
        if (avgMap[s.day] > maxY) maxY = avgMap[s.day];
    });
    if (lastAverage > maxY) maxY = lastAverage;

    const start = new Date(dateRange.current.start);
    const lastStart = new Date(dateRange.last.start);
    const cycleDays = currentStats.length; 
    for (let i = 0; i < cycleDays; i++) {
        // 本期日期
        const curDateObj = new Date(start);
        curDateObj.setDate(start.getDate() + i);
        const curDateStr = curDateObj.toISOString().split('T')[0];
        
        // 上期对应日期 (往前推30天，即 dateRange.last 的序列)
        const lastDateObj = new Date(lastStart);
        lastDateObj.setDate(lastStart.getDate() + i);
        const lastDateStr = lastDateObj.toISOString().split('T')[0];

        chartData.push({
            day: curDateObj.getDate(), // 显示日期数字
            current: currentMap[curDateStr] || 0,
            last: lastDataMap[lastDateStr] || 0,
            avg: avgMap[curDateObj.getDate()] || 0
        });
    }

    // 存储图表数据，用于后续交互重绘
    this.chartParams = { data: chartData, maxY, lastAverage, cycleDays };
    this.drawTrendChart(chartData, maxY, cycleDays, lastAverage);
  },

  handleChartTouch(e) {
    if (!this.chartParams) return;
    const touch = e.touches[0];
    const { data: chartData, maxY, lastAverage } = this.chartParams;
    
    // 获取组件在页面中的位置
    const query = wx.createSelectorQuery();
    query.select('#lineChart').boundingClientRect(res => {
      if (!res) return;
      const touchX = touch.clientX - res.left;
      
      const paddingLeft = 40;
      const paddingRight = 15;
      const plotWidth = res.width - paddingLeft - paddingRight;
      
      // 根据 X 坐标计算最接近的数据点索引
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
    // 恢复显示最新状态
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
        
        const getProfessionalScale = (max) => {
          if (max <= 0) return { max: 100, step: 25 };
          // 给 max 增加一点缓冲，防止顶格
          const targetMax = max * 1.1; 
          const idealStep = targetMax / 4;
          const magnitude = Math.pow(10, Math.floor(Math.log10(idealStep)));
          const normalizedStep = idealStep / magnitude;
          let step;
          if (normalizedStep < 1.5) step = 1; else if (normalizedStep < 3) step = 2; else if (normalizedStep < 7) step = 5; else step = 10;
          const actualStep = step * magnitude;
          // 确保 max 包含 targetMax
          return { max: actualStep * 4 >= targetMax ? actualStep * 4 : actualStep * 5, step: actualStep };
        };

        const scale = getProfessionalScale(maxY);
        const niceMaxY = scale.max;
        const xStep = plotWidth / (totalDays - 1);

        // 动画变量
        let progress = animate ? 0 : 1;
        const startTime = Date.now();
        const duration = 1000;

        const renderFrame = () => {
             if (animate) {
                 const now = Date.now();
                 progress = Math.min(1, (now - startTime) / duration);
                 progress = 1 - Math.pow(1 - progress, 3); // cubicOut
             }

            ctx.clearRect(0, 0, width, height);

            const formatVal = (v) => {
                if (v === 0) return '0';
                if (v >= 1000) return (v / 1000).toFixed(1) + 'k';
                return Math.floor(v).toString();
            };

            // --- 0. 绘制顶部图例 (Legend) ---
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle'; // 关键修复：重置对齐方式

            const displayIdx = selectedIndex >= 0 ? selectedIndex : data.length - 1;
            const d = data[displayIdx];
            if (d) {
                const items = [
                    { label: selectedIndex >= 0 ? `${d.day}日数据` : '今日', val: d.current, color: this.data.chartColor },
                    { label: '上月今日', val: d.last, color: '#b3d8ff' },
                    { label: '历史今日', val: d.avg, color: '#FFA500' }
                ];
                const itemWidth = (width - 60) / 3;
                items.forEach((item, i) => {
                    const x = paddingLeft + i * itemWidth + 10; // 稍微向右一点对齐 better center
                    
                    // 绘制圆点
                    ctx.beginPath();
                    ctx.fillStyle = item.color;
                    ctx.arc(x, 15, 3, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // 绘制标签 (灰色小字)
                    ctx.font = '10px sans-serif';
                    ctx.fillStyle = '#999';
                    ctx.fillText(item.label, x + 8, 16); // 稍微修正Y坐标
                    
                    // 绘制数值 (黑色大字)
                    ctx.font = 'bold 16px "DIN Alternate"'; // 加大字号更清晰
                    ctx.fillStyle = '#333';
                    ctx.fillText(parseFloat(item.val || 0).toFixed(1), x, 36);
                });
            }

        // --- 1. 绘制网格与 Y 轴 (不裁剪) ---
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

        // --- 2. 绘制 X 轴标签 ---
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const labelIndices = [0, Math.floor(totalDays/2), totalDays - 1]; // 均分三个点
        labelIndices.forEach(idx => {
            if (data[idx]) {
                const x = paddingLeft + idx * xStep;
                ctx.fillText(`${data[idx].day}日`, x, height - paddingBottom + 8);
            }
        });

        // --- 3. 开启裁剪区域 (防止曲线溢出) ---
        ctx.save();
        ctx.beginPath();
        ctx.rect(paddingLeft - 5, paddingTop - 10, plotWidth + 10, plotHeight + 15);
        ctx.clip(); // 锁定绘图区

        // 3.1 绘制指示虚线
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

        // 3.2 绘制曲线逻辑
        const getPoints = (seriesKey) => data.map((item, index) => {
            const val = seriesKey === 'avg' ? item.avg : (seriesKey === 'last' ? item.last : item.current);
            return {
                x: paddingLeft + index * xStep,
                y: (height - paddingBottom) - (Math.max(0, val) / niceMaxY) * plotHeight
            };
        });

        // 支持 progress 的曲线绘制
        const drawCurve = (points, color, isDashed, width, curProgress = 1) => {
            if (points.length < 2) return;
            ctx.beginPath();
            ctx.lineWidth = width;
            ctx.strokeStyle = color;
            if (isDashed) ctx.setLineDash([4, 4]); else ctx.setLineDash([]);
            
            // 计算当前动画应该画到的最右侧 X 坐标
            const maxX = paddingLeft + (plotWidth * curProgress);
            
            if (points[0].x > maxX) return; // 还没画到第一个点

            ctx.moveTo(points[0].x, points[0].y);
            
            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i+1];
                
                if (p1.x >= maxX) break;

                if (p2.x <= maxX) {
                    // 完整段：贝塞尔平滑
                    const cp1x = p1.x + (p2.x - p1.x) / 2;
                    const cp1y = p1.y;
                    const cp2x = p1.x + (p2.x - p1.x) / 2;
                    const cp2y = p2.y;
                    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
                } else {
                    // 截断段：简单二次插值
                    const t = (maxX - p1.x) / (p2.x - p1.x);
                    const midX = p1.x + (p2.x - p1.x) * t;
                    const midY = p1.y + (p2.y - p1.y) * t;
                    const cp1x = p1.x + (midX - p1.x) / 2;
                    const cp1y = p1.y;
                    ctx.quadraticCurveTo(cp1x, cp1y, midX, midY);
                    break;
                }
            }
            ctx.stroke();
            ctx.setLineDash([]); // Reset line dash
        };

        // 绘制顺序：平均 -> 上期 -> 本期
        // 辅助线也应用 progress 显得更整体
        drawCurve(getPoints('avg'), '#FFA500', true, 1, progress); 
        drawCurve(getPoints('last'), '#b3d8ff', true, 1.5, progress);
        drawCurve(getPoints('current'), this.data.chartColor, false, 2.5, progress);

        // 绘制焦点圆点 (动画完成后或非常接近完成时显示)
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

        ctx.restore(); // 释放裁剪区

        if (animate && progress < 1) {
            canvas.requestAnimationFrame(renderFrame);
        }
      }; // end renderFrame

      renderFrame();
    });
  },

  goToday() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1
    }, () => {
      this.fetchData();
    });
  },

  showCalendarDetail(e) {
    const { item } = e.currentTarget.dataset;
    if (!item || item.empty) return;
    
    // 从已加载的明细中筛选出当天的笔数，并尊重当前的筛选类型
    const filter = this.data.typeFilter;
    const dayTransactions = (this.data.transactions || []).filter(t => {
      const matchDate = t.date === item.date;
      if (filter === 0) return matchDate; // 全部
      return matchDate && t.type === filter; // 收入/支出
    });
    
    this.setData({
      showDetailPopup: true,
      detailDate: item.date,
      selectedDateTransactions: dayTransactions
    });
  },

  closeDetailPopup() {
    this.setData({
      showDetailPopup: false
    });
  },

  navToSettings() {
    wx.switchTab({
      url: '/pages/settings/index',
    });
  },

  navTo(e) {
      const url = e.currentTarget.dataset.url;
      if (url) {
        wx.navigateTo({ url });
      } else {
        // 如果没有 specific url，就去 tab
        this.navToSettings();
      }
  },

  onDeleteTransaction(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条记录吗？',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (!res.confirm) {
          this.resetSwipeStates();
          return;
        }

        try {
          wx.showLoading({ title: '删除中' });
          console.log('Sending delete request for id:', id);
          const deleteRes = await request('/api/transaction/delete', 'POST', { id });
          console.log('Delete response:', deleteRes);
          
          wx.showToast({ title: '已删除', icon: 'success' });
          this.fetchData(); // 重新加载数据以刷新列表和趋势图
        } catch (err) {
          console.error('Delete error details:', err);
          const msg = err.message || '删除失败';
          wx.showToast({ title: msg, icon: 'none' });
        } finally {
          wx.hideLoading();
          this.resetSwipeStates(); // 无论成功失败，都尝试归位滑动状态
        }
      }
    });
  },

  // 重置所有列表项的滑动位置
  resetSwipeStates() {
    const groups = this.data.groupedTransactions.map(g => ({
      ...g,
      items: g.items.map(i => ({ ...i, x: 0 })) // 重置 x 为 0
    }));
    this.setData({ groupedTransactions: groups });
  },

  // 这里的空函数是为了绑定 movable-view 的事件，防止console报错
  onSwipeStart(e) {
    // 准备滑动
  },

  onSwipeChange(e) {
    // 持续记录当前滑动位移
    this._currentX = e.detail.x;
  },

  onSwipeEnd(e) {
    const { index, groupIndex } = e.currentTarget.dataset;
    const items = this.data.groupedTransactions;
    
    // 将 150rpx 按钮宽度转换为 px
    const windowInfo = wx.getWindowInfo();
    const btnWidthPx = -(windowInfo.windowWidth / 750 * 150);
    const threshold = btnWidthPx / 2;
    
    // 确定最终位置
    let finalX = 0;
    if (this._currentX < threshold) {
      finalX = btnWidthPx;
    }

    // 触发生长式回弹 (果冻效果主要靠 damping 设置)
    const key = `groupedTransactions[${groupIndex}].items[${index}].x`;
    this.setData({
      [key]: finalX
    });
    
    // 重置临时记录
    this._currentX = 0;
  },
});
