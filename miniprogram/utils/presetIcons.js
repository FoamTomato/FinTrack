/**
 * 预设图标库（Phosphor 风格，扁平线条）
 * 通过 iconify CDN 加载 SVG，按主题分组
 *
 * 使用方式：
 *   const { PRESET_ICON_GROUPS } = require('../../utils/presetIcons');
 *   每个图标对象：{ name, icon, url }
 */

// Iconify Phosphor URL 生成器（颜色按分组主色）
const ph = (name, color = '64748b') =>
  `https://api.iconify.design/ph/${name}.svg?color=%23${color}`;

// 分组主色（与 server defaultCategories 保持一致）
const C = {
  food: 'f97316', transport: '0ea5e9', travel: '06b6d4', daily: '64748b',
  clothing: 'a855f7', beauty: 'ec4899', home: '84cc16', fun: 'ef4444',
  sports: '22c55e', hobby: 'f59e0b', digital: '3b82f6', cloud: '6366f1',
  edu: '14b8a6', health: 'dc2626', salon: 'd946ef', pet: 'eab308',
  social: 'f43f5e', work: '475569', baby: 'fb7185', finance: '0f766e',
  charity: 'be123c', growth: '7c3aed', occasion: 'db2777', other: '94a3b8',
  income: '16a34a'
};

// 构建一个图标对象
const make = (name, icon, color) => ({
  name,
  icon: ph(icon, color),
  url: ph(icon, color)
});

const PRESET_ICON_GROUPS = [
  {
    key: 'food', label: '餐饮',
    icons: [
      make('餐饮', 'fork-knife', C.food),
      make('早餐', 'bread', C.food),
      make('午餐', 'bowl-food', C.food),
      make('晚餐', 'fork-knife', C.food),
      make('夜宵', 'moon-stars', C.food),
      make('下午茶', 'cake', C.food),
      make('奶茶', 'coffee', C.food),
      make('咖啡', 'coffee-bean', C.food),
      make('果汁', 'martini', C.food),
      make('水', 'drop', C.food),
      make('啤酒', 'beer-bottle', C.food),
      make('零食', 'popcorn', C.food),
      make('坚果', 'seal', C.food),
      make('巧克力', 'cookie', C.food),
      make('水果', 'orange', C.food),
      make('蛋糕', 'cake', C.food),
      make('面包', 'bread', C.food),
      make('冰淇淋', 'ice-cream', C.food),
      make('外卖', 'moped', C.food),
      make('聚餐', 'users-three', C.food),
      make('生鲜', 'shopping-bag-open', C.food),
      make('粮油', 'grains', C.food),
      make('调味', 'flask', C.food),
      make('火锅', 'cooking-pot', C.food),
      make('日料', 'fish', C.food),
      make('快餐', 'hamburger', C.food),
      make('面条', 'bowl-steam', C.food),
      make('刀叉', 'knife', C.food)
    ]
  },
  {
    key: 'transport', label: '交通',
    icons: [
      make('汽车', 'car', C.transport),
      make('公交', 'bus', C.transport),
      make('地铁', 'train', C.transport),
      make('电车', 'tram', C.transport),
      make('出租车', 'taxi', C.transport),
      make('网约车', 'car-profile', C.transport),
      make('代驾', 'steering-wheel', C.transport),
      make('单车', 'bicycle', C.transport),
      make('电动车', 'scooter', C.transport),
      make('充电', 'plug-charging', C.transport),
      make('加油', 'gas-pump', C.transport),
      make('保养', 'wrench', C.transport),
      make('维修', 'toolbox', C.transport),
      make('洗车', 'drop-half', C.transport),
      make('停车', 'car', C.transport),
      make('过路', 'road-horizon', C.transport),
      make('ETC', 'credit-card', C.transport),
      make('罚款', 'warning', C.transport),
      make('车险', 'shield-check', C.transport),
      make('车贷', 'bank', C.transport)
    ]
  },
  {
    key: 'travel', label: '旅游',
    icons: [
      make('飞机', 'airplane', C.travel),
      make('飞行', 'airplane-tilt', C.travel),
      make('高铁', 'train-simple', C.travel),
      make('火车', 'train', C.travel),
      make('长途', 'bus', C.travel),
      make('轮船', 'boat', C.travel),
      make('帆船', 'sailboat', C.travel),
      make('酒店', 'buildings', C.travel),
      make('民宿', 'house-line', C.travel),
      make('床铺', 'bed', C.travel),
      make('门票', 'ticket', C.travel),
      make('乐园', 'confetti', C.travel),
      make('地图', 'map-trifold', C.travel),
      make('护照', 'identification-badge', C.travel),
      make('签证', 'identification-card', C.travel),
      make('行李箱', 'suitcase-rolling', C.travel),
      make('露营', 'tent', C.travel),
      make('温泉', 'waves', C.travel),
      make('滑雪', 'snowflake', C.travel),
      make('潜水', 'mask-sad', C.travel),
      make('跳伞', 'parachute', C.travel),
      make('山', 'mountains', C.travel),
      make('指南针', 'compass', C.travel),
      make('地球', 'globe', C.travel)
    ]
  },
  {
    key: 'shopping', label: '购物',
    icons: [
      make('购物车', 'shopping-cart', C.daily),
      make('购物袋', 'shopping-bag', C.daily),
      make('包裹', 'package', C.daily),
      make('礼物', 'gift', C.daily),
      make('店铺', 'storefront', C.daily),
      make('便利店', 'basket', C.daily),
      make('日用', 'shopping-bag', C.daily),
      make('纸巾', 'toilet-paper', C.daily),
      make('清洁', 'broom', C.daily),
      make('雨具', 'umbrella', C.daily),
      make('工具', 'hammer', C.daily),
      make('电池', 'battery-charging', C.daily),
      make('灯泡', 'lightbulb', C.daily),
      make('植物', 'plant', C.daily)
    ]
  },
  {
    key: 'clothing', label: '服饰',
    icons: [
      make('上衣', 't-shirt', C.clothing),
      make('裤子', 'pants', C.clothing),
      make('外套', 'coat-hanger', C.clothing),
      make('叠衣', 'shirt-folded', C.clothing),
      make('裙子', 'dress', C.clothing),
      make('鞋子', 'sneaker', C.clothing),
      make('运动鞋', 'sneaker-move', C.clothing),
      make('靴子', 'boot', C.clothing),
      make('帽子', 'baseball-cap', C.clothing),
      make('领带', 'user', C.clothing),
      make('钻石', 'diamond', C.clothing),
      make('手表', 'watch', C.clothing),
      make('眼镜', 'sunglasses', C.clothing),
      make('眼镜2', 'eyeglasses', C.clothing),
      make('针线', 'needle', C.clothing),
      make('洗衣机', 'washing-machine', C.clothing),
      make('手提包', 'handbag', C.clothing),
      make('双肩包', 'backpack', C.clothing),
      make('钱包', 'wallet', C.clothing)
    ]
  },
  {
    key: 'beauty', label: '美容',
    icons: [
      make('口红', 'pen-nib', C.beauty),
      make('面膜', 'mask-happy', C.beauty),
      make('护肤', 'drop-half', C.beauty),
      make('香水', 'flower', C.beauty),
      make('洗发', 'shower', C.beauty),
      make('沐浴', 'bathtub', C.beauty),
      make('剃须', 'knife', C.beauty),
      make('剪刀', 'scissors', C.salon),
      make('美甲', 'hand-pointing', C.salon),
      make('SPA', 'hand-heart', C.salon),
      make('足疗', 'sneaker', C.salon),
      make('闪亮', 'sparkle', C.salon),
      make('美瞳', 'eye', C.salon)
    ]
  },
  {
    key: 'home', label: '居家',
    icons: [
      make('房子', 'house', C.home),
      make('房子线', 'house-line', C.home),
      make('简房', 'house-simple', C.home),
      make('大楼', 'buildings', C.home),
      make('银行', 'bank', C.home),
      make('硬币', 'coins', C.home),
      make('水', 'drop', C.home),
      make('电', 'lightning', C.home),
      make('火', 'flame', C.home),
      make('温度', 'thermometer-hot', C.home),
      make('网络', 'wifi-high', C.home),
      make('电视', 'television', C.home),
      make('垃圾桶', 'trash', C.home),
      make('扫帚', 'broom', C.home),
      make('扳手', 'wrench', C.home),
      make('卡车', 'truck', C.home),
      make('锤子', 'hammer', C.home),
      make('沙发', 'armchair', C.home),
      make('插座', 'plug', C.home),
      make('床', 'bed', C.home),
      make('锅', 'cooking-pot', C.home),
      make('画框', 'frame-corners', C.home)
    ]
  },
  {
    key: 'fun', label: '娱乐',
    icons: [
      make('电影', 'film-strip', C.fun),
      make('麦克风', 'microphone', C.fun),
      make('麦克风台', 'microphone-stage', C.fun),
      make('音符', 'music-notes', C.fun),
      make('单音符', 'music-note', C.fun),
      make('吉他', 'guitar', C.fun),
      make('画展', 'image-square', C.fun),
      make('调色板', 'palette', C.fun),
      make('调酒', 'martini', C.fun),
      make('迪斯科', 'disco-ball', C.fun),
      make('游戏机', 'game-controller', C.fun),
      make('Steam', 'steam-logo', C.fun),
      make('星星', 'star', C.fun),
      make('电视小', 'television-simple', C.fun),
      make('放大镜', 'magnifying-glass', C.fun),
      make('门', 'door', C.fun),
      make('骰子', 'dice-six', C.fun),
      make('拼图', 'puzzle-piece', C.fun),
      make('游戏杆', 'joystick', C.fun),
      make('彩花', 'confetti', C.fun),
      make('帐篷', 'tent', C.fun),
      make('烟火', 'sparkle', C.occasion)
    ]
  },
  {
    key: 'sports', label: '运动',
    icons: [
      make('哑铃', 'barbell', C.sports),
      make('行走', 'person-simple-walk', C.sports),
      make('阴阳', 'yin-yang', C.sports),
      make('站立', 'person-simple', C.sports),
      make('伸展', 'person-arms-spread', C.sports),
      make('跑步', 'person-simple-run', C.sports),
      make('自行车', 'bicycle', C.sports),
      make('泳池', 'swimming-pool', C.sports),
      make('雪花', 'snowflake', C.sports),
      make('滑板', 'person-simple', C.sports),
      make('登山', 'mountains', C.sports),
      make('靴子', 'boot', C.sports),
      make('钓鱼', 'fish-simple', C.sports),
      make('波浪', 'wave-sine', C.sports),
      make('马', 'horse', C.sports),
      make('高尔夫', 'golf', C.sports),
      make('篮球', 'basketball', C.sports),
      make('足球', 'soccer-ball', C.sports),
      make('羽毛球', 'racquet', C.sports),
      make('乒乓球', 'ping-pong', C.sports),
      make('网球', 'tennis-ball', C.sports),
      make('排球', 'volleyball', C.sports),
      make('橄榄球', 'football', C.sports),
      make('棒球', 'baseball', C.sports),
      make('拳套', 'boxing-glove', C.sports)
    ]
  },
  {
    key: 'hobby', label: '爱好',
    icons: [
      make('相机', 'camera', C.hobby),
      make('光圈', 'aperture', C.hobby),
      make('画笔', 'paint-brush', C.hobby),
      make('钢笔', 'pen-nib', C.hobby),
      make('钢琴', 'piano-keys', C.hobby),
      make('鼓', 'music-note', C.hobby),
      make('黑胶', 'vinyl-record', C.hobby),
      make('光碟', 'disc', C.hobby),
      make('泰迪', 'smiley-meh', C.hobby),
      make('玩具', 'tennis-ball', C.hobby),
      make('立方', 'cube', C.hobby),
      make('机器人', 'robot', C.hobby),
      make('方块', 'squares-four', C.hobby),
      make('国际象棋', 'horse', C.hobby),
      make('卡牌', 'cards', C.hobby),
      make('卡牌3', 'cards-three', C.hobby),
      make('档案', 'archive', C.hobby),
      make('信封', 'envelope-simple', C.hobby),
      make('硬币', 'coin', C.hobby),
      make('针', 'needle', C.hobby),
      make('茶包', 'tea-bag', C.hobby),
      make('水晶球', 'star-four', C.hobby),
      make('铅笔', 'pencil-line', C.hobby),
      make('爪印', 'paw-print', C.hobby),
      make('面具开心', 'mask-happy', C.hobby),
      make('烟花', 'sparkle', C.hobby)
    ]
  },
  {
    key: 'digital', label: '数码',
    icons: [
      make('桌面', 'desktop', C.digital),
      make('笔记本', 'laptop', C.digital),
      make('主机', 'desktop-tower', C.digital),
      make('显示器', 'monitor', C.digital),
      make('键盘', 'keyboard', C.digital),
      make('显卡', 'graphics-card', C.digital),
      make('硬盘', 'hard-drive', C.digital),
      make('手机', 'device-mobile', C.digital),
      make('平板', 'device-tablet', C.digital),
      make('耳机', 'headphones', C.digital),
      make('音箱', 'speaker-high', C.digital),
      make('手表', 'watch', C.digital),
      make('相机', 'camera', C.digital),
      make('无人机', 'drone', C.digital),
      make('投影', 'projector-screen', C.digital),
      make('电池', 'battery-charging-vertical', C.digital),
      make('USB', 'usb', C.digital),
      make('插头连接', 'plugs-connected', C.digital),
      make('插头', 'plugs', C.digital)
    ]
  },
  {
    key: 'cloud', label: '云服务',
    icons: [
      make('云', 'cloud', C.cloud),
      make('云上传', 'cloud-arrow-up', C.cloud),
      make('硬盘组', 'hard-drives', C.cloud),
      make('地球', 'globe', C.cloud),
      make('锁', 'lock-key', C.cloud),
      make('火箭', 'rocket-launch', C.cloud),
      make('数据库', 'database', C.cloud),
      make('信封', 'envelope', C.cloud),
      make('齿轮', 'gear', C.cloud),
      make('机器人', 'robot', C.cloud),
      make('对话', 'chat-circle-text', C.cloud),
      make('闪光', 'sparkle', C.cloud),
      make('钥匙', 'key', C.cloud),
      make('GitHub', 'github-logo', C.cloud),
      make('Figma', 'figma-logo', C.cloud),
      make('代码', 'code', C.cloud),
      make('字体', 'text-aa', C.cloud),
      make('图集', 'images', C.cloud),
      make('分支', 'git-branch', C.cloud)
    ]
  },
  {
    key: 'edu', label: '学习',
    icons: [
      make('书堆', 'books', C.edu),
      make('书', 'book', C.edu),
      make('打开书', 'book-open', C.edu),
      make('书签', 'book-bookmark', C.edu),
      make('阅读', 'book-open-text', C.edu),
      make('报纸', 'newspaper', C.edu),
      make('屏幕播放', 'monitor-play', C.edu),
      make('黑板老师', 'chalkboard-teacher', C.edu),
      make('黑板', 'chalkboard', C.edu),
      make('考试', 'exam', C.edu),
      make('证书', 'certificate', C.edu),
      make('学士帽', 'graduation-cap', C.edu),
      make('翻译', 'translate', C.edu),
      make('字母', 'text-aa', C.edu),
      make('书包', 'backpack', C.edu),
      make('公文包', 'briefcase', C.edu),
      make('铅笔', 'pencil', C.edu),
      make('指南针', 'compass', C.edu)
    ]
  },
  {
    key: 'health', label: '医疗',
    icons: [
      make('医院', 'hospital', C.health),
      make('救护车', 'ambulance', C.health),
      make('床', 'bed', C.health),
      make('药丸', 'pill', C.health),
      make('注射器', 'syringe', C.health),
      make('试管', 'test-tube', C.health),
      make('叶子', 'leaf', C.health),
      make('烧瓶', 'flask', C.health),
      make('听诊器', 'stethoscope', C.health),
      make('剪贴板', 'clipboard-text', C.health),
      make('牙齿', 'tooth', C.health),
      make('眼睛', 'eye', C.health),
      make('眼睛闭', 'eye-closed', C.health),
      make('大脑', 'brain', C.health),
      make('植物', 'plant', C.health),
      make('手', 'hand', C.health),
      make('针', 'needle', C.health),
      make('创可贴', 'bandaids', C.health),
      make('轮椅', 'wheelchair', C.health),
      make('婴儿', 'baby', C.health),
      make('医疗箱', 'first-aid-kit', C.health),
      make('十字', 'first-aid', C.health)
    ]
  },
  {
    key: 'social', label: '人情',
    icons: [
      make('心', 'heart', C.social),
      make('婚礼', 'diamonds-four', C.social),
      make('蛋糕', 'cake', C.social),
      make('婴儿', 'baby', C.social),
      make('彩花', 'confetti', C.social),
      make('莲花', 'flower-lotus', C.social),
      make('用户', 'user', C.social),
      make('家庭', 'users-three', C.social),
      make('礼物', 'gift', C.social),
      make('圣诞树', 'tree-evergreen', C.social),
      make('花', 'flower', C.social),
      make('信封', 'envelope', C.social),
      make('钻石', 'diamond', C.social),
      make('握手', 'handshake', C.social)
    ]
  },
  {
    key: 'pet', label: '宠物',
    icons: [
      make('爪印', 'paw-print', C.pet),
      make('狗', 'dog', C.pet),
      make('猫', 'cat', C.pet),
      make('骨头', 'bone', C.pet),
      make('鸟', 'bird', C.pet),
      make('鱼', 'fish', C.pet),
      make('马', 'horse', C.pet)
    ]
  },
  {
    key: 'work', label: '工作',
    icons: [
      make('公文包', 'briefcase', C.work),
      make('电话', 'phone', C.work),
      make('信号', 'cell-signal-high', C.work),
      make('回形针', 'paperclip', C.work),
      make('打印机', 'printer', C.work),
      make('显示器', 'monitor', C.work),
      make('飞机起飞', 'airplane-takeoff', C.work),
      make('啤酒杯', 'beer-stein', C.work),
      make('握手', 'handshake', C.work),
      make('演讲', 'presentation', C.work),
      make('扩音器', 'megaphone', C.work)
    ]
  },
  {
    key: 'finance', label: '金融',
    icons: [
      make('银行', 'bank', C.finance),
      make('盾牌', 'shield-check', C.finance),
      make('盾牌星', 'shield-star', C.finance),
      make('信用卡', 'credit-card', C.finance),
      make('硬币', 'coins', C.finance),
      make('硬币单', 'coin', C.finance),
      make('钱', 'money', C.finance),
      make('图表', 'chart-line', C.finance),
      make('图表上升', 'chart-line-up', C.finance),
      make('柱状图', 'chart-bar', C.finance),
      make('饼图', 'chart-pie', C.finance),
      make('双向箭头', 'arrows-left-right', C.finance),
      make('收据', 'receipt', C.finance),
      make('美元', 'currency-dollar', C.finance),
      make('比特币', 'currency-btc', C.finance),
      make('美元圆', 'currency-circle-dollar', C.finance),
      make('趋势上升', 'trend-up', C.finance)
    ]
  },
  {
    key: 'income', label: '收入',
    icons: [
      make('钱', 'money', C.income),
      make('硬币', 'coins', C.income),
      make('美元', 'currency-dollar', C.income),
      make('美元圆', 'currency-circle-dollar', C.income),
      make('图表上升', 'chart-line-up', C.income),
      make('柱状图', 'chart-bar', C.income),
      make('饼图', 'chart-pie', C.income),
      make('趋势', 'trend-up', C.income),
      make('奖杯', 'trophy', C.income),
      make('星星', 'star', C.income),
      make('钻石', 'diamond', C.income),
      make('礼物', 'gift', C.income),
      make('红包', 'envelope', C.income),
      make('彩票', 'ticket', C.income),
      make('靶心', 'target', C.income),
      make('返还', 'arrow-counter-clockwise', C.income),
      make('版权', 'copyright', C.income),
      make('回收', 'recycle', C.income)
    ]
  },
  {
    key: 'other', label: '其他',
    icons: [
      make('问号', 'question', C.other),
      make('感叹', 'warning', C.other),
      make('警告八角', 'warning-octagon', C.other),
      make('信息', 'info', C.other),
      make('标签', 'tag', C.other),
      make('书签', 'bookmark', C.other),
      make('星星', 'star', C.other),
      make('心', 'heart', C.other),
      make('打勾', 'check-circle', C.other),
      make('叉', 'x-circle', C.other),
      make('点点', 'dots-three-circle', C.other),
      make('剪贴板', 'clipboard', C.other),
      make('日历', 'calendar', C.other),
      make('时钟', 'clock', C.other),
      make('铃', 'bell', C.other),
      make('眼睛', 'eye', C.other),
      make('搜索', 'magnifying-glass', C.other),
      make('齿轮', 'gear', C.other),
      make('锁', 'lock', C.other),
      make('开锁', 'lock-open', C.other),
      make('家', 'house-simple', C.other),
      make('文件', 'file', C.other),
      make('文件夹', 'folder', C.other),
      make('链接', 'link', C.other)
    ]
  }
];

module.exports = { PRESET_ICON_GROUPS };
