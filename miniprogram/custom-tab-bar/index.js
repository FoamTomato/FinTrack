/**
 * 自定义 tabBar（app.json "custom": true）
 *
 * 三 tab：首页(0) / 记一笔(1) / 配置(2)。普通点击 → switchTab。
 * 「记一笔」tab 额外承载手势：
 *   - 长按 → 震动 + 弧形弹出 手动/语音/图片 3 圆浮层
 *   - 上滑悬停 → 高亮命中的圆（用 touch 坐标比对各圆屏幕中心）
 *   - 松手 → 命中则切到该模式（存 addMode）并触发动作；未命中则取消
 *   - 轻点「记一笔」→ 进上次模式并触发动作
 * 「记一笔」图标随 addMode 显示 ✏️/🎤/📷（文案不变）。
 *
 * 与 add 页通信：从 getCurrentPages() 找到 add 页实例调 triggerAddMode(mode)；
 * 若当前不在 add 页，先 switchTab 过去，再经 globalData.pendingAddMode 让 add 页 onShow 执行。
 */

const MODES = ['manual', 'voice', 'scan'];
const MODE_ICON = { manual: '✏️', voice: '🎤', scan: '📷' };
const MODE_NAME = { manual: '手动', voice: '语音', scan: '图片' };

const app = getApp();

Component({
  data: {
    selected: 0,
    addMode: 'manual',
    addIcon: '✏️',
    // 浮层
    summonShow: false,
    hoverIndex: -1,          // 当前高亮的圆下标（-1 = 无）
    // 弧形 3 圆配置（与 wxss 落位对应）：left / mid / right
    options: [
      { mode: 'manual', icon: '✏️', name: '手动', cls: 'left' },
      { mode: 'voice', icon: '🎤', name: '语音', cls: 'mid' },
      { mode: 'scan', icon: '📷', name: '图片', cls: 'right' }
    ]
  },

  lifetimes: {
    attached() {
      const mode = this._readMode();
      this.setData({ addMode: mode, addIcon: MODE_ICON[mode] });
      // 屏幕高度仅用于「滑回 tab 区取消」的下边界判定
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      this._winH = info.windowHeight;
    }
  },

  methods: {
    _readMode() {
      let mode = 'manual';
      try { mode = wx.getStorageSync('addMode') || 'manual'; } catch (_) {}
      return MODES.includes(mode) ? mode : 'manual';
    },

    // 供 tab 页 onShow 调用，同步选中态
    setSelected(idx) {
      if (this.data.selected !== idx) this.setData({ selected: idx });
      // 进 add 页时刷新图标（可能在别处改过 addMode）
      const mode = this._readMode();
      if (mode !== this.data.addMode) this.setData({ addMode: mode, addIcon: MODE_ICON[mode] });
    },

    // ===== 普通 tab 点击 =====
    onTapHome() { this._switchTo(0, '/pages/home/index'); },
    onTapSettings() { this._switchTo(2, '/pages/settings/index'); },

    _switchTo(idx, url) {
      this.setData({ selected: idx });
      wx.switchTab({ url });
    },

    // ===== 「记一笔」轻点 =====
    // 第一次点击（当前不在记一笔 tab）→ 仅切到记一笔页，不弹 sheet；
    // 已在记一笔 tab 再次点击 → 展开当前模式 sheet。
    onTapAdd() {
      // 若刚才发生过长按手势，忽略本次 tap（end 已处理）
      if (this._gestureHandled) { this._gestureHandled = false; return; }
      if (this.data.selected !== 1) {
        // 仅切换 tab：不设 pendingAddMode，add 页 onShow 不会自动弹 sheet
        this.setData({ selected: 1 });
        wx.switchTab({ url: '/pages/add/index' });
        return;
      }
      this._enterMode(this.data.addMode);
    },

    // ===== 「记一笔」长按 → 唤起浮层 =====
    onLongPressAdd() {
      this._inGesture = true;
      this._gestureHandled = false;
      this._centers = null;
      this._measuring = false;
      wx.vibrateShort && wx.vibrateShort({ type: 'medium' });
      // 默认无高亮(-1)：松手必须真的悬停到某个圆才会进入对应模式，
      // 否则视为取消——避免"没移动/没量到坐标"时误判成上次模式（如总是语音）
      this.setData({ summonShow: true, hoverIndex: -1 });
      // 展开后实测一次；touchmove 里若还没量到会再补量
      this._measureOptionCenters(280);
    },

    // 用 boundingClientRect 量出 3 圆中心（屏幕 px），命中半径取实测圆半径
    _measureOptionCenters(delay) {
      if (this._measuring) return;
      this._measuring = true;
      const run = () => {
        this.createSelectorQuery()
          .selectAll('.opt')
          .boundingClientRect()
          .exec((res) => {
            this._measuring = false;
            const rects = (res && res[0]) || [];
            if (!rects.length) return;
            // 与 data.options 顺序一致：manual(left) / voice(mid) / scan(right)
            this._centers = rects.map(r => ({
              cx: r.left + r.width / 2,
              cy: r.top + r.height / 2,
              r: Math.max(r.width, r.height) / 2
            }));
          });
      };
      if (delay) setTimeout(run, delay); else run();
    },

    onTouchMoveAdd(e) {
      if (!this._inGesture) return;
      // 坐标还没量到（松手太快/动画未完）→ 立即补量一次，本帧先不判定
      if (!this._centers) { this._measureOptionCenters(0); return; }
      const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
      if (!t) return;
      const px = t.clientX, py = t.clientY;
      let hit = -1, best = Infinity;
      for (let i = 0; i < this._centers.length; i++) {
        const c = this._centers[i];
        const d = Math.hypot(px - c.cx, py - c.cy);
        // 命中半径 = 实测圆半径 + 24px 容差，便于悬停
        if (d < c.r + 24 && d < best) { best = d; hit = i; }
      }
      // 滑回 tab 区（接近底部）则取消高亮
      if (py > this._winH - 70) hit = -1;
      if (hit !== this.data.hoverIndex) this.setData({ hoverIndex: hit });
    },

    onTouchEndAdd() {
      // 始终收起浮层（即使非手势态意外触发，也保证不会卡住）
      const wasGesture = this._inGesture;
      const idx = this.data.hoverIndex;
      this._inGesture = false;
      this._centers = null;
      if (this.data.summonShow) this.setData({ summonShow: false, hoverIndex: -1 });
      if (wasGesture) {
        this._gestureHandled = true;     // 阻止随后的 tap 重复触发
        if (idx >= 0) this._enterMode(MODES[idx]);
        // 未命中：仅收起浮层（取消）
      }
    },

    // 占位：仅用于 catchtouchmove 吞掉触摸移动，阻止浮层显示时底层页面滚动
    noop() {},

    // 点遮罩取消
    onScrimTap() {
      this._inGesture = false;
      this._gestureHandled = true;
      this.setData({ summonShow: false, hoverIndex: -1 });
    },

    // ===== 进入某模式：记住 + 触发动作 + 更新图标 =====
    _enterMode(mode) {
      if (!MODES.includes(mode)) mode = 'manual';
      // 未授权时只切到记一笔页（展示空态/登录引导），不触发记账动作，避免 createTransaction 失败
      const authorized = app && app.globalData && app.globalData.isAuthorized === true;

      try { wx.setStorageSync('addMode', mode); } catch (_) {}
      this.setData({ selected: 1, addMode: mode, addIcon: MODE_ICON[mode] });

      if (!authorized) {
        wx.switchTab({ url: '/pages/add/index' });
        return;
      }

      const pages = getCurrentPages();
      const cur = pages[pages.length - 1];
      const addPage = pages.find(p => p && p.route === 'pages/add/index');
      if (cur && cur.route === 'pages/add/index' && addPage && typeof addPage.triggerAddMode === 'function') {
        // 已经在 add 页（前台）：直接触发，立即弹 sheet
        addPage.triggerAddMode(mode);
      } else {
        // 不在 add 页 / add 页不在前台：标记待执行，switchTab 后由 onShow 消费
        if (app && app.globalData) app.globalData.pendingAddMode = mode;
        wx.switchTab({ url: '/pages/add/index' });
      }
    }
  }
});
