/**
 * 系统默认分类数据
 * type: 1=收入, 2=支出
 *
 * 图标使用 Iconify Phosphor 图标集（扁平线条风格，统一视觉）
 * URL 格式：https://api.iconify.design/ph/<icon-name>.svg?color=%23<hex>
 * 颜色按一级分类划定，同一类下子项共享色调（仅支出/收入主色略变化）
 */

// 图标 URL 生成器：不同分类用不同颜色（去掉 #）
const ph = (name, color = 'f97316') =>
  `https://api.iconify.design/ph/${name}.svg?color=%23${color}`

// 一级分类主色（HEX 不带 #）
const C = {
  food: 'f97316',       // 橙
  transport: '0ea5e9',  // 天蓝
  travel: '06b6d4',     // 青
  daily: '64748b',      // 石板
  clothing: 'a855f7',   // 紫
  bag: '8b5cf6',        // 紫罗兰
  beauty: 'ec4899',     // 粉
  home: '84cc16',       // 黄绿
  fun: 'ef4444',        // 红
  sports: '22c55e',     // 绿
  hobby: 'f59e0b',      // 琥珀
  digital: '3b82f6',    // 蓝
  cloud: '6366f1',      // 靛
  edu: '14b8a6',        // 蓝绿
  health: 'dc2626',     // 砖红
  salon: 'd946ef',      // 品红
  pet: 'eab308',        // 金
  social: 'f43f5e',     // 玫瑰
  work: '475569',       // 灰
  baby: 'fb7185',       // 浅玫瑰
  finance: '0f766e',    // 深青
  charity: 'be123c',    // 深玫红
  growth: '7c3aed',     // 深紫
  occasion: 'db2777',   // 桃红
  other: '94a3b8',      // 中灰
  // 收入色调
  salary: '16a34a',     // 深绿
  invest: '0891b2',     // 海蓝
  asset: '0d9488',      // 深蓝绿
  side: '0284c7',       // 海洋蓝
  business: '059669',   // 翡翠
  windfall: 'f59e0b',   // 琥珀
  family: 'f472b6',     // 粉红
  loan: '6b7280',       // 中灰
  govt: '1d4ed8',       // 海军蓝
  income: '10b981'      // 翠绿
}

module.exports = [
  // ========== 支出 ==========
  {
    name: '餐饮美食', type: 2, icon: ph('hamburger', C.food),
    children: [
      { name: '早餐', icon: ph('bread', C.food) },
      { name: '午餐', icon: ph('bowl-food', C.food) },
      { name: '晚餐', icon: ph('fork-knife', C.food) },
      { name: '夜宵', icon: ph('moon-stars', C.food) },
      { name: '下午茶', icon: ph('cake', C.food) },
      { name: '奶茶饮品', icon: ph('coffee', C.food) },
      { name: '咖啡', icon: ph('coffee-bean', C.food) },
      { name: '果汁', icon: ph('martini', C.food) },
      { name: '矿泉水', icon: ph('drop', C.food) },
      { name: '酒水啤酒', icon: ph('beer-bottle', C.food) },
      { name: '零食薯片', icon: ph('popcorn', C.food) },
      { name: '坚果炒货', icon: ph('seal', C.food) },
      { name: '糖果巧克力', icon: ph('cookie', C.food) },
      { name: '水果', icon: ph('orange', C.food) },
      { name: '蛋糕甜点', icon: ph('cake', C.food) },
      { name: '面包烘焙', icon: ph('bread', C.food) },
      { name: '冰淇淋', icon: ph('ice-cream', C.food) },
      { name: '外卖', icon: ph('moped', C.food) },
      { name: '聚餐请客', icon: ph('users-three', C.food) },
      { name: '食材生鲜', icon: ph('shopping-bag-open', C.food) },
      { name: '米面粮油', icon: ph('grains', C.food) },
      { name: '调味品', icon: ph('flask', C.food) },
      { name: '速食方便面', icon: ph('bowl-steam', C.food) },
      { name: '火锅烧烤', icon: ph('cooking-pot', C.food) },
      { name: '日料', icon: ph('fish', C.food) },
      { name: '西餐', icon: ph('knife', C.food) },
      { name: '快餐', icon: ph('hamburger', C.food) }
    ]
  },
  {
    name: '交通出行', type: 2, icon: ph('car', C.transport),
    children: [
      { name: '公交', icon: ph('bus', C.transport) },
      { name: '地铁', icon: ph('train', C.transport) },
      { name: '有轨电车', icon: ph('tram', C.transport) },
      { name: '出租车', icon: ph('taxi', C.transport) },
      { name: '网约车', icon: ph('car-profile', C.transport) },
      { name: '顺风车', icon: ph('car-simple', C.transport) },
      { name: '代驾', icon: ph('steering-wheel', C.transport) },
      { name: '共享单车', icon: ph('bicycle', C.transport) },
      { name: '共享电单车', icon: ph('scooter', C.transport) },
      { name: '电动车充电', icon: ph('plug-charging', C.transport) },
      { name: '电瓶车维修', icon: ph('wrench', C.transport) },
      { name: '汽车加油', icon: ph('gas-pump', C.transport) },
      { name: '汽车保养', icon: ph('wrench', C.transport) },
      { name: '汽车维修', icon: ph('toolbox', C.transport) },
      { name: '洗车', icon: ph('drop-half', C.transport) },
      { name: '汽车美容', icon: ph('sparkle', C.transport) },
      { name: '停车费', icon: ph('car', C.transport) },
      { name: '过路过桥', icon: ph('road-horizon', C.transport) },
      { name: 'ETC充值', icon: ph('credit-card', C.transport) },
      { name: '违章罚款', icon: ph('warning', C.transport) },
      { name: '车检年审', icon: ph('clipboard-text', C.transport) },
      { name: '汽车保险', icon: ph('shield-check', C.transport) },
      { name: '车贷', icon: ph('bank', C.transport) },
      { name: '汽车装饰', icon: ph('paint-brush', C.transport) },
      { name: '轮胎更换', icon: ph('circle-dashed', C.transport) }
    ]
  },
  {
    name: '旅游出行', type: 2, icon: ph('airplane-tilt', C.travel),
    children: [
      { name: '飞机票', icon: ph('airplane', C.travel) },
      { name: '高铁动车', icon: ph('train-simple', C.travel) },
      { name: '普通火车票', icon: ph('train', C.travel) },
      { name: '长途汽车', icon: ph('bus', C.travel) },
      { name: '轮船游轮', icon: ph('boat', C.travel) },
      { name: '邮轮', icon: ph('sailboat', C.travel) },
      { name: '酒店', icon: ph('buildings', C.travel) },
      { name: '民宿', icon: ph('house-line', C.travel) },
      { name: '青旅', icon: ph('bed', C.travel) },
      { name: '景点门票', icon: ph('ticket', C.travel) },
      { name: '主题乐园', icon: ph('confetti', C.travel) },
      { name: '旅行团', icon: ph('users-three', C.travel) },
      { name: '自由行', icon: ph('map-trifold', C.travel) },
      { name: '导游费', icon: ph('user-focus', C.travel) },
      { name: '签证', icon: ph('identification-card', C.travel) },
      { name: '护照证件', icon: ph('identification-badge', C.travel) },
      { name: '行李托运', icon: ph('suitcase-rolling', C.travel) },
      { name: '租车', icon: ph('car-profile', C.travel) },
      { name: '当地体验', icon: ph('mask-happy', C.travel) },
      { name: '温泉度假', icon: ph('waves', C.travel) },
      { name: '滑雪场', icon: ph('snowflake', C.travel) },
      { name: '潜水', icon: ph('mask-sad', C.travel) },
      { name: '跳伞', icon: ph('parachute', C.travel) },
      { name: '伴手礼', icon: ph('gift', C.travel) },
      { name: '旅行保险', icon: ph('shield-star', C.travel) }
    ]
  },
  {
    name: '日用购物', type: 2, icon: ph('shopping-cart', C.daily),
    children: [
      { name: '日用百货', icon: ph('shopping-bag', C.daily) },
      { name: '纸巾纸品', icon: ph('toilet-paper', C.daily) },
      { name: '清洁用品', icon: ph('broom', C.daily) },
      { name: '洗护用品', icon: ph('drop', C.daily) },
      { name: '收纳整理', icon: ph('package', C.daily) },
      { name: '雨具', icon: ph('umbrella', C.daily) },
      { name: '五金工具', icon: ph('hammer', C.daily) },
      { name: '电池', icon: ph('battery-charging', C.daily) },
      { name: '灯泡灯具', icon: ph('lightbulb', C.daily) },
      { name: '绿植花卉', icon: ph('plant', C.daily) },
      { name: '季节用品', icon: ph('sun', C.daily) }
    ]
  },
  {
    name: '服饰鞋帽', type: 2, icon: ph('t-shirt', C.clothing),
    children: [
      { name: '上衣T恤', icon: ph('t-shirt', C.clothing) },
      { name: '裤子', icon: ph('pants', C.clothing) },
      { name: '外套大衣', icon: ph('coat-hanger', C.clothing) },
      { name: '内衣袜子', icon: ph('shirt-folded', C.clothing) },
      { name: '运动服', icon: ph('basketball', C.clothing) },
      { name: '礼服', icon: ph('dress', C.clothing) },
      { name: '连衣裙', icon: ph('dress', C.clothing) },
      { name: '鞋子', icon: ph('sneaker', C.clothing) },
      { name: '运动鞋', icon: ph('sneaker-move', C.clothing) },
      { name: '靴子', icon: ph('boot', C.clothing) },
      { name: '帽子', icon: ph('baseball-cap', C.clothing) },
      { name: '围巾手套', icon: ph('hand', C.clothing) },
      { name: '皮带', icon: ph('belt', C.clothing) },
      { name: '领带', icon: ph('user', C.clothing) },
      { name: '首饰珠宝', icon: ph('diamond', C.clothing) },
      { name: '手表', icon: ph('watch', C.clothing) },
      { name: '墨镜眼镜', icon: ph('sunglasses', C.clothing) },
      { name: '定制改衣', icon: ph('needle', C.clothing) },
      { name: '洗衣干洗', icon: ph('washing-machine', C.clothing) }
    ]
  },
  {
    name: '箱包配饰', type: 2, icon: ph('handbag', C.bag),
    children: [
      { name: '手提包', icon: ph('handbag', C.bag) },
      { name: '双肩包', icon: ph('backpack', C.bag) },
      { name: '行李箱', icon: ph('suitcase', C.bag) },
      { name: '钱包', icon: ph('wallet', C.bag) },
      { name: '卡包', icon: ph('credit-card', C.bag) },
      { name: '配饰小物', icon: ph('gift', C.bag) }
    ]
  },
  {
    name: '美妆个护', type: 2, icon: ph('pen', C.beauty),
    children: [
      { name: '护肤品', icon: ph('drop-half', C.beauty) },
      { name: '面膜', icon: ph('mask-happy', C.beauty) },
      { name: '彩妆口红', icon: ph('pen-nib', C.beauty) },
      { name: '香水', icon: ph('flower', C.beauty) },
      { name: '洗发护发', icon: ph('shower', C.beauty) },
      { name: '沐浴身体护理', icon: ph('bathtub', C.beauty) },
      { name: '口腔护理', icon: ph('tooth', C.beauty) },
      { name: '剃须', icon: ph('knife', C.beauty) },
      { name: '卫生用品', icon: ph('first-aid', C.beauty) },
      { name: '隐形眼镜', icon: ph('eye', C.beauty) },
      { name: '美甲工具', icon: ph('hand-pointing', C.beauty) }
    ]
  },
  {
    name: '居家住房', type: 2, icon: ph('house', C.home),
    children: [
      { name: '房租', icon: ph('house-line', C.home) },
      { name: '房贷月供', icon: ph('bank', C.home) },
      { name: '首付', icon: ph('coins', C.home) },
      { name: '物业费', icon: ph('buildings', C.home) },
      { name: '水费', icon: ph('drop', C.home) },
      { name: '电费', icon: ph('lightning', C.home) },
      { name: '燃气费', icon: ph('flame', C.home) },
      { name: '暖气费', icon: ph('thermometer-hot', C.home) },
      { name: '宽带网费', icon: ph('wifi-high', C.home) },
      { name: '有线电视', icon: ph('television', C.home) },
      { name: '垃圾处理费', icon: ph('trash', C.home) },
      { name: '家政保洁', icon: ph('broom', C.home) },
      { name: '维修服务', icon: ph('wrench', C.home) },
      { name: '搬家费', icon: ph('truck', C.home) },
      { name: '装修', icon: ph('hammer', C.home) },
      { name: '家具', icon: ph('armchair', C.home) },
      { name: '家电', icon: ph('plug', C.home) },
      { name: '床上用品', icon: ph('bed', C.home) },
      { name: '厨具餐具', icon: ph('cooking-pot', C.home) },
      { name: '家纺布艺', icon: ph('needle', C.home) },
      { name: '家居装饰', icon: ph('frame-corners', C.home) },
      { name: '绿植花艺', icon: ph('plant', C.home) },
      { name: '智能家居', icon: ph('house-simple', C.home) }
    ]
  },
  {
    name: '娱乐休闲', type: 2, icon: ph('film-strip', C.fun),
    children: [
      { name: '电影', icon: ph('film-strip', C.fun) },
      { name: '演唱会', icon: ph('microphone-stage', C.fun) },
      { name: '话剧', icon: ph('mask-happy', C.fun) },
      { name: '音乐会', icon: ph('music-notes', C.fun) },
      { name: '脱口秀', icon: ph('microphone', C.fun) },
      { name: 'Live现场', icon: ph('guitar', C.fun) },
      { name: '展览', icon: ph('image-square', C.fun) },
      { name: '博物馆', icon: ph('bank', C.fun) },
      { name: '艺术展', icon: ph('palette', C.fun) },
      { name: 'KTV', icon: ph('microphone', C.fun) },
      { name: '酒吧', icon: ph('martini', C.fun) },
      { name: '夜店', icon: ph('disco-ball', C.fun) },
      { name: '游戏充值', icon: ph('game-controller', C.fun) },
      { name: 'Steam', icon: ph('steam-logo', C.fun) },
      { name: '主机游戏', icon: ph('game-controller', C.fun) },
      { name: '手游充值', icon: ph('device-mobile', C.fun) },
      { name: '订阅会员', icon: ph('star', C.fun) },
      { name: '视频会员', icon: ph('television-simple', C.fun) },
      { name: '音乐会员', icon: ph('music-note', C.fun) },
      { name: '读书会员', icon: ph('book-open', C.fun) },
      { name: '剧本杀', icon: ph('magnifying-glass', C.fun) },
      { name: '密室逃脱', icon: ph('door', C.fun) },
      { name: '桌游', icon: ph('dice-six', C.fun) },
      { name: '麻将棋牌', icon: ph('puzzle-piece', C.fun) },
      { name: '街机电玩', icon: ph('joystick', C.fun) },
      { name: '轰趴', icon: ph('confetti', C.fun) },
      { name: '户外露营娱乐', icon: ph('tent', C.fun) }
    ]
  },
  {
    name: '运动健身', type: 2, icon: ph('barbell', C.sports),
    children: [
      { name: '健身房月卡', icon: ph('barbell', C.sports) },
      { name: '健身私教', icon: ph('person-simple-walk', C.sports) },
      { name: '瑜伽', icon: ph('yin-yang', C.sports) },
      { name: '普拉提', icon: ph('person-simple', C.sports) },
      { name: '舞蹈', icon: ph('person-arms-spread', C.sports) },
      { name: '跑步装备', icon: ph('person-simple-run', C.sports) },
      { name: '骑行装备', icon: ph('bicycle', C.sports) },
      { name: '游泳', icon: ph('swimming-pool', C.sports) },
      { name: '滑雪', icon: ph('snowflake', C.sports) },
      { name: '滑板', icon: ph('person-simple', C.sports) },
      { name: '轮滑', icon: ph('sneaker-move', C.sports) },
      { name: '攀岩', icon: ph('mountains', C.sports) },
      { name: '户外徒步', icon: ph('boot', C.sports) },
      { name: '登山', icon: ph('mountains', C.sports) },
      { name: '露营', icon: ph('tent', C.sports) },
      { name: '钓鱼', icon: ph('fish-simple', C.sports) },
      { name: '潜水', icon: ph('mask-sad', C.sports) },
      { name: '冲浪', icon: ph('wave-sine', C.sports) },
      { name: '马术', icon: ph('horse', C.sports) },
      { name: '高尔夫', icon: ph('golf', C.sports) },
      { name: '保龄球', icon: ph('volleyball', C.sports) },
      { name: '台球', icon: ph('circle', C.sports) },
      { name: '篮球', icon: ph('basketball', C.sports) },
      { name: '足球', icon: ph('soccer-ball', C.sports) },
      { name: '羽毛球', icon: ph('racquet', C.sports) },
      { name: '乒乓球', icon: ph('ping-pong', C.sports) },
      { name: '网球', icon: ph('tennis-ball', C.sports) },
      { name: '排球', icon: ph('volleyball', C.sports) },
      { name: '橄榄球', icon: ph('football', C.sports) },
      { name: '棒球', icon: ph('baseball', C.sports) },
      { name: '武术格斗', icon: ph('boxing-glove', C.sports) },
      { name: '电竞', icon: ph('game-controller', C.sports) }
    ]
  },
  {
    name: '兴趣爱好', type: 2, icon: ph('palette', C.hobby),
    children: [
      { name: '摄影器材', icon: ph('camera', C.hobby) },
      { name: '镜头配件', icon: ph('aperture', C.hobby) },
      { name: '相机维修', icon: ph('wrench', C.hobby) },
      { name: '绘画文创', icon: ph('palette', C.hobby) },
      { name: '画材画具', icon: ph('paint-brush', C.hobby) },
      { name: '书法', icon: ph('pen-nib', C.hobby) },
      { name: '乐器', icon: ph('music-notes', C.hobby) },
      { name: '吉他', icon: ph('guitar', C.hobby) },
      { name: '钢琴', icon: ph('piano-keys', C.hobby) },
      { name: '电子琴', icon: ph('piano-keys', C.hobby) },
      { name: '架子鼓', icon: ph('music-note', C.hobby) },
      { name: '口琴', icon: ph('music-note', C.hobby) },
      { name: '尤克里里', icon: ph('guitar', C.hobby) },
      { name: '唱片CD', icon: ph('disc', C.hobby) },
      { name: '黑胶', icon: ph('vinyl-record', C.hobby) },
      { name: '手办', icon: ph('person', C.hobby) },
      { name: '谷子周边', icon: ph('gift', C.hobby) },
      { name: '盲盒', icon: ph('package', C.hobby) },
      { name: '潮玩', icon: ph('smiley', C.hobby) },
      { name: '毛绒玩具', icon: ph('smiley-meh', C.hobby) },
      { name: '模型拼装', icon: ph('cube', C.hobby) },
      { name: '高达模型', icon: ph('robot', C.hobby) },
      { name: '乐高', icon: ph('squares-four', C.hobby) },
      { name: '机器人', icon: ph('robot', C.hobby) },
      { name: '棋牌', icon: ph('horse', C.hobby) },
      { name: '卡牌', icon: ph('cards', C.hobby) },
      { name: '宝可梦', icon: ph('lightning', C.hobby) },
      { name: '万智牌', icon: ph('cards-three', C.hobby) },
      { name: '收藏', icon: ph('archive', C.hobby) },
      { name: '集邮', icon: ph('envelope-simple', C.hobby) },
      { name: '钱币收藏', icon: ph('coin', C.hobby) },
      { name: '手工DIY', icon: ph('scissors', C.hobby) },
      { name: '编织', icon: ph('needle', C.hobby) },
      { name: '刺绣', icon: ph('needle', C.hobby) },
      { name: '烘焙', icon: ph('cake', C.hobby) },
      { name: '烹饪', icon: ph('cooking-pot', C.hobby) },
      { name: '咖啡器具', icon: ph('coffee', C.hobby) },
      { name: '茶具茶叶', icon: ph('tea-bag', C.hobby) },
      { name: '香道', icon: ph('flame', C.hobby) },
      { name: '汉服', icon: ph('dress', C.hobby) },
      { name: 'Cosplay', icon: ph('mask-happy', C.hobby) },
      { name: '占卜塔罗', icon: ph('star-four', C.hobby) },
      { name: '写作出版', icon: ph('pencil-line', C.hobby) },
      { name: '宠物饲养', icon: ph('paw-print', C.hobby) }
    ]
  },
  {
    name: '数码科技', type: 2, icon: ph('desktop', C.digital),
    children: [
      { name: '电脑', icon: ph('desktop', C.digital) },
      { name: '笔记本', icon: ph('laptop', C.digital) },
      { name: '台式机', icon: ph('desktop-tower', C.digital) },
      { name: '显示器', icon: ph('monitor', C.digital) },
      { name: '键盘鼠标', icon: ph('keyboard', C.digital) },
      { name: '电脑配件', icon: ph('plugs-connected', C.digital) },
      { name: '显卡', icon: ph('graphics-card', C.digital) },
      { name: '内存硬盘', icon: ph('hard-drive', C.digital) },
      { name: '手机', icon: ph('device-mobile', C.digital) },
      { name: '平板', icon: ph('device-tablet', C.digital) },
      { name: '耳机', icon: ph('headphones', C.digital) },
      { name: '音响', icon: ph('speaker-high', C.digital) },
      { name: '智能手表', icon: ph('watch', C.digital) },
      { name: '运动手环', icon: ph('watch', C.digital) },
      { name: '智能家居设备', icon: ph('house-simple', C.digital) },
      { name: '相机', icon: ph('camera', C.digital) },
      { name: '镜头', icon: ph('aperture', C.digital) },
      { name: '无人机', icon: ph('drone', C.digital) },
      { name: '投影仪', icon: ph('projector-screen', C.digital) },
      { name: '智能穿戴', icon: ph('eyeglasses', C.digital) },
      { name: '移动电源', icon: ph('battery-charging-vertical', C.digital) },
      { name: '数据线', icon: ph('usb', C.digital) },
      { name: '转接器', icon: ph('plugs', C.digital) }
    ]
  },
  {
    name: '科技服务', type: 2, icon: ph('cloud', C.cloud),
    children: [
      { name: '服务器', icon: ph('hard-drives', C.cloud) },
      { name: '云服务', icon: ph('cloud', C.cloud) },
      { name: 'VPS', icon: ph('cloud-arrow-up', C.cloud) },
      { name: '域名', icon: ph('globe', C.cloud) },
      { name: 'SSL证书', icon: ph('lock-key', C.cloud) },
      { name: 'CDN', icon: ph('rocket-launch', C.cloud) },
      { name: '对象存储', icon: ph('database', C.cloud) },
      { name: '邮箱服务', icon: ph('envelope', C.cloud) },
      { name: '软件订阅', icon: ph('disc', C.cloud) },
      { name: 'SaaS订阅', icon: ph('gear', C.cloud) },
      { name: 'AI服务', icon: ph('robot', C.cloud) },
      { name: 'ChatGPT', icon: ph('chat-circle-text', C.cloud) },
      { name: 'Claude', icon: ph('sparkle', C.cloud) },
      { name: 'API费用', icon: ph('key', C.cloud) },
      { name: 'GitHub', icon: ph('github-logo', C.cloud) },
      { name: '设计工具', icon: ph('palette', C.cloud) },
      { name: 'Figma', icon: ph('figma-logo', C.cloud) },
      { name: 'Adobe', icon: ph('palette', C.cloud) },
      { name: '开发工具', icon: ph('code', C.cloud) },
      { name: '字体授权', icon: ph('text-aa', C.cloud) },
      { name: '素材库', icon: ph('images', C.cloud) },
      { name: '代码托管', icon: ph('git-branch', C.cloud) }
    ]
  },
  {
    name: '学习教育', type: 2, icon: ph('books', C.edu),
    children: [
      { name: '书籍', icon: ph('book', C.edu) },
      { name: '电子书', icon: ph('book-open-text', C.edu) },
      { name: '杂志报刊', icon: ph('newspaper', C.edu) },
      { name: '在线课程', icon: ph('monitor-play', C.edu) },
      { name: '网课', icon: ph('chalkboard-teacher', C.edu) },
      { name: '培训班', icon: ph('chalkboard', C.edu) },
      { name: '考试报名', icon: ph('exam', C.edu) },
      { name: '考证', icon: ph('certificate', C.edu) },
      { name: '留学费用', icon: ph('graduation-cap', C.edu) },
      { name: '语言学习', icon: ph('translate', C.edu) },
      { name: '英语', icon: ph('text-aa', C.edu) },
      { name: '日语', icon: ph('translate', C.edu) },
      { name: '孩子学费', icon: ph('backpack', C.edu) },
      { name: '学杂费', icon: ph('briefcase', C.edu) },
      { name: '教材', icon: ph('book-bookmark', C.edu) },
      { name: '文具', icon: ph('pencil', C.edu) },
      { name: '补习班', icon: ph('compass', C.edu) },
      { name: '兴趣班', icon: ph('palette', C.edu) },
      { name: '夏令营', icon: ph('tent', C.edu) },
      { name: '冬令营', icon: ph('snowflake', C.edu) },
      { name: '研学游学', icon: ph('globe-hemisphere-east', C.edu) },
      { name: '教育软件', icon: ph('disc', C.edu) },
      { name: '学习平板', icon: ph('device-tablet', C.edu) }
    ]
  },
  {
    name: '医疗健康', type: 2, icon: ph('first-aid-kit', C.health),
    children: [
      { name: '门诊挂号', icon: ph('hospital', C.health) },
      { name: '急诊', icon: ph('ambulance', C.health) },
      { name: '住院费', icon: ph('bed', C.health) },
      { name: '手术费', icon: ph('scissors', C.health) },
      { name: '药品', icon: ph('pill', C.health) },
      { name: '处方药', icon: ph('syringe', C.health) },
      { name: '非处方药', icon: ph('test-tube', C.health) },
      { name: '中药', icon: ph('leaf', C.health) },
      { name: '保健品', icon: ph('flask', C.health) },
      { name: '体检', icon: ph('stethoscope', C.health) },
      { name: '专项体检', icon: ph('clipboard-text', C.health) },
      { name: '牙科洗牙', icon: ph('tooth', C.health) },
      { name: '牙科治疗', icon: ph('tooth', C.health) },
      { name: '牙齿矫正', icon: ph('smiley', C.health) },
      { name: '种植牙', icon: ph('tooth', C.health) },
      { name: '眼科', icon: ph('eye', C.health) },
      { name: '配眼镜', icon: ph('eyeglasses', C.health) },
      { name: '隐形眼镜', icon: ph('eye', C.health) },
      { name: '近视手术', icon: ph('magnifying-glass', C.health) },
      { name: '皮肤科', icon: ph('drop-half', C.health) },
      { name: '心理咨询', icon: ph('brain', C.health) },
      { name: '中医', icon: ph('plant', C.health) },
      { name: '推拿', icon: ph('hand', C.health) },
      { name: '针灸', icon: ph('needle', C.health) },
      { name: '康复理疗', icon: ph('first-aid', C.health) },
      { name: '医美', icon: ph('syringe', C.health) },
      { name: '整形', icon: ph('sparkle', C.health) },
      { name: '护理用品', icon: ph('bandaids', C.health) },
      { name: '轮椅辅具', icon: ph('wheelchair', C.health) },
      { name: '疫苗', icon: ph('syringe', C.health) },
      { name: '生育产检', icon: ph('baby', C.health) }
    ]
  },
  {
    name: '美容美发', type: 2, icon: ph('scissors', C.salon),
    children: [
      { name: '理发', icon: ph('scissors', C.salon) },
      { name: '烫染发', icon: ph('paint-bucket', C.salon) },
      { name: '护发', icon: ph('drop', C.salon) },
      { name: '美甲', icon: ph('hand-pointing', C.salon) },
      { name: '美睫', icon: ph('eye', C.salon) },
      { name: '美瞳', icon: ph('eye-closed', C.salon) },
      { name: '纹绣', icon: ph('pencil', C.salon) },
      { name: '纹身', icon: ph('pen-nib', C.salon) },
      { name: 'SPA按摩', icon: ph('hand-heart', C.salon) },
      { name: '足疗', icon: ph('sneaker', C.salon) },
      { name: '汗蒸', icon: ph('thermometer-hot', C.salon) },
      { name: '皮肤管理', icon: ph('sparkle', C.salon) },
      { name: '瘦身塑形', icon: ph('person-simple', C.salon) }
    ]
  },
  {
    name: '宠物', type: 2, icon: ph('paw-print', C.pet),
    children: [
      { name: '宠物粮', icon: ph('bone', C.pet) },
      { name: '零食罐头', icon: ph('package', C.pet) },
      { name: '宠物保健品', icon: ph('pill', C.pet) },
      { name: '宠物医疗', icon: ph('first-aid-kit', C.pet) },
      { name: '绝育', icon: ph('scissors', C.pet) },
      { name: '疫苗', icon: ph('syringe', C.pet) },
      { name: '寄养', icon: ph('house', C.pet) },
      { name: '洗护美容', icon: ph('bathtub', C.pet) },
      { name: '宠物用品', icon: ph('bone', C.pet) },
      { name: '猫砂', icon: ph('cat', C.pet) },
      { name: '尿垫', icon: ph('bandaids', C.pet) },
      { name: '玩具', icon: ph('tennis-ball', C.pet) },
      { name: '牵引绳', icon: ph('dog', C.pet) },
      { name: '笼子', icon: ph('house-line', C.pet) },
      { name: '宠物服饰', icon: ph('t-shirt', C.pet) },
      { name: '训练课', icon: ph('graduation-cap', C.pet) },
      { name: '宠物保险', icon: ph('shield-check', C.pet) },
      { name: '宠物殡葬', icon: ph('flower', C.pet) }
    ]
  },
  {
    name: '人情往来', type: 2, icon: ph('heart', C.social),
    children: [
      { name: '婚礼礼金', icon: ph('diamonds-four', C.social) },
      { name: '生日礼金', icon: ph('cake', C.social) },
      { name: '满月酒', icon: ph('baby', C.social) },
      { name: '寿宴', icon: ph('confetti', C.social) },
      { name: '丧葬', icon: ph('flower-lotus', C.social) },
      { name: '孝敬父母', icon: ph('users-three', C.social) },
      { name: '孝敬长辈', icon: ph('user', C.social) },
      { name: '亲友礼物', icon: ph('gift', C.social) },
      { name: '节日礼物', icon: ph('tree-evergreen', C.social) },
      { name: '慰问探望', icon: ph('flower', C.social) },
      { name: '份子钱', icon: ph('envelope', C.social) },
      { name: '彩礼嫁妆', icon: ph('diamond', C.social) },
      { name: '压岁钱', icon: ph('envelope-simple', C.social) },
      { name: '伴手礼', icon: ph('gift', C.social) }
    ]
  },
  {
    name: '工作商务', type: 2, icon: ph('briefcase', C.work),
    children: [
      { name: '通讯话费', icon: ph('phone', C.work) },
      { name: '流量套餐', icon: ph('cell-signal-high', C.work) },
      { name: '办公用品', icon: ph('paperclip', C.work) },
      { name: '打印复印', icon: ph('printer', C.work) },
      { name: '办公软件', icon: ph('monitor', C.work) },
      { name: '商务差旅', icon: ph('airplane-takeoff', C.work) },
      { name: '出差住宿', icon: ph('buildings', C.work) },
      { name: '招待应酬', icon: ph('beer-stein', C.work) },
      { name: '职业认证', icon: ph('certificate', C.work) },
      { name: '行业协会', icon: ph('handshake', C.work) },
      { name: '名片印刷', icon: ph('credit-card', C.work) },
      { name: '商务礼品', icon: ph('gift', C.work) },
      { name: '会议会展', icon: ph('presentation', C.work) }
    ]
  },
  {
    name: '母婴亲子', type: 2, icon: ph('baby', C.baby),
    children: [
      { name: '奶粉', icon: ph('baby-carriage', C.baby) },
      { name: '辅食', icon: ph('bowl-food', C.baby) },
      { name: '纸尿裤', icon: ph('baby', C.baby) },
      { name: '湿巾', icon: ph('toilet-paper', C.baby) },
      { name: '婴儿洗护', icon: ph('drop', C.baby) },
      { name: '玩具', icon: ph('smiley', C.baby) },
      { name: '童书', icon: ph('book', C.baby) },
      { name: '童装童鞋', icon: ph('baby', C.baby) },
      { name: '推车安全座椅', icon: ph('baby-carriage', C.baby) },
      { name: '奶瓶餐具', icon: ph('baby-carriage', C.baby) },
      { name: '孕产用品', icon: ph('baby-carriage', C.baby) },
      { name: '月嫂育儿嫂', icon: ph('user-circle-plus', C.baby) },
      { name: '早教', icon: ph('book-open-text', C.baby) },
      { name: '亲子活动', icon: ph('balloon', C.baby) },
      { name: '儿童摄影', icon: ph('camera', C.baby) },
      { name: '儿童医疗', icon: ph('first-aid-kit', C.baby) }
    ]
  },
  {
    name: '金融保险', type: 2, icon: ph('bank', C.finance),
    children: [
      { name: '商业保险', icon: ph('shield-check', C.finance) },
      { name: '健康险', icon: ph('first-aid', C.finance) },
      { name: '车险', icon: ph('car', C.finance) },
      { name: '寿险', icon: ph('user', C.finance) },
      { name: '意外险', icon: ph('warning', C.finance) },
      { name: '家财险', icon: ph('house', C.finance) },
      { name: '贷款利息', icon: ph('coins', C.finance) },
      { name: '信用卡年费', icon: ph('credit-card', C.finance) },
      { name: '信用卡手续费', icon: ph('credit-card', C.finance) },
      { name: '分期手续费', icon: ph('chart-line', C.finance) },
      { name: '转账手续费', icon: ph('arrows-left-right', C.finance) },
      { name: 'ATM手续费', icon: ph('bank', C.finance) },
      { name: '汇款手续费', icon: ph('paper-plane-tilt', C.finance) },
      { name: '税费', icon: ph('receipt', C.finance) },
      { name: '个人所得税', icon: ph('clipboard-text', C.finance) },
      { name: '社保个缴', icon: ph('first-aid-kit', C.finance) },
      { name: '公积金个缴', icon: ph('house', C.finance) },
      { name: '基金申购费', icon: ph('chart-line-up', C.finance) }
    ]
  },
  {
    name: '公益慈善', type: 2, icon: ph('hand-heart', C.charity),
    children: [
      { name: '慈善捐款', icon: ph('heart', C.charity) },
      { name: '众筹', icon: ph('hands-praying', C.charity) },
      { name: '互助', icon: ph('handshake', C.charity) },
      { name: '志愿者支出', icon: ph('hand-waving', C.charity) },
      { name: '动物救助', icon: ph('paw-print', C.charity) },
      { name: '环保公益', icon: ph('leaf', C.charity) },
      { name: '宗教捐赠', icon: ph('flower-lotus', C.charity) }
    ]
  },
  {
    name: '个人提升', type: 2, icon: ph('target', C.growth),
    children: [
      { name: '心理疏导', icon: ph('brain', C.growth) },
      { name: '职业咨询', icon: ph('briefcase', C.growth) },
      { name: '形象管理', icon: ph('sparkle', C.growth) },
      { name: '礼仪培训', icon: ph('crown', C.growth) },
      { name: '个人IP', icon: ph('user-circle', C.growth) },
      { name: '付费社群', icon: ph('users', C.growth) },
      { name: '知识星球', icon: ph('star', C.growth) },
      { name: '播客订阅', icon: ph('microphone', C.growth) }
    ]
  },
  {
    name: '特殊场合', type: 2, icon: ph('confetti', C.occasion),
    children: [
      { name: '婚礼支出', icon: ph('diamonds-four', C.occasion) },
      { name: '生日派对', icon: ph('cake', C.occasion) },
      { name: '毕业礼', icon: ph('graduation-cap', C.occasion) },
      { name: '纪念日', icon: ph('heart', C.occasion) },
      { name: '节日庆祝', icon: ph('confetti', C.occasion) },
      { name: '跨年活动', icon: ph('sparkle', C.occasion) }
    ]
  },
  {
    name: '其他支出', type: 2, icon: ph('dots-three-circle', C.other),
    children: [
      { name: '手续费', icon: ph('arrows-left-right', C.other) },
      { name: '丢失赔偿', icon: ph('warning-octagon', C.other) },
      { name: '罚款', icon: ph('warning', C.other) },
      { name: '押金', icon: ph('coins', C.other) },
      { name: '抵押金', icon: ph('lock', C.other) },
      { name: '未分类支出', icon: ph('question', C.other) },
      { name: '报销垫付', icon: ph('clipboard', C.other) },
      { name: '借出款项', icon: ph('handshake', C.other) }
    ]
  },

  // ========== 收入 ==========
  {
    name: '工资薪酬', type: 1, icon: ph('money', C.salary),
    children: [
      { name: '基本工资', icon: ph('currency-circle-dollar', C.salary) },
      { name: '绩效奖金', icon: ph('chart-line-up', C.salary) },
      { name: '年终奖', icon: ph('confetti', C.salary) },
      { name: '十三薪', icon: ph('gift', C.salary) },
      { name: '加班费', icon: ph('clock', C.salary) },
      { name: '补贴津贴', icon: ph('coins', C.salary) },
      { name: '餐补', icon: ph('bowl-food', C.salary) },
      { name: '交通补贴', icon: ph('bus', C.salary) },
      { name: '住房补贴', icon: ph('house', C.salary) },
      { name: '通讯补贴', icon: ph('phone', C.salary) },
      { name: '高温补贴', icon: ph('sun', C.salary) },
      { name: '报销返还', icon: ph('arrow-counter-clockwise', C.salary) },
      { name: '出差补助', icon: ph('airplane', C.salary) },
      { name: '值班费', icon: ph('moon', C.salary) },
      { name: '提成', icon: ph('chart-bar', C.salary) }
    ]
  },
  {
    name: '投资理财', type: 1, icon: ph('chart-line-up', C.invest),
    children: [
      { name: '银行利息', icon: ph('bank', C.invest) },
      { name: '定期收益', icon: ph('calendar-check', C.invest) },
      { name: '活期收益', icon: ph('arrows-left-right', C.invest) },
      { name: '货币基金', icon: ph('currency-dollar', C.invest) },
      { name: '基金分红', icon: ph('chart-pie', C.invest) },
      { name: '股票收益', icon: ph('trend-up', C.invest) },
      { name: '股票分红', icon: ph('chart-line', C.invest) },
      { name: '债券收益', icon: ph('scroll', C.invest) },
      { name: '理财产品', icon: ph('briefcase', C.invest) },
      { name: '信托收益', icon: ph('bank', C.invest) },
      { name: '黄金收益', icon: ph('coin', C.invest) },
      { name: '虚拟货币', icon: ph('currency-btc', C.invest) },
      { name: '外汇收益', icon: ph('arrows-left-right', C.invest) },
      { name: 'P2P 回款', icon: ph('arrow-counter-clockwise', C.invest) }
    ]
  },
  {
    name: '资产收益', type: 1, icon: ph('house-line', C.asset),
    children: [
      { name: '房租收入', icon: ph('house', C.asset) },
      { name: '车位租金', icon: ph('circle-half', C.asset) },
      { name: '设备租金', icon: ph('wrench', C.asset) },
      { name: '版权收益', icon: ph('copyright', C.asset) },
      { name: '专利收益', icon: ph('lightbulb', C.asset) },
      { name: '版税', icon: ph('books', C.asset) }
    ]
  },
  {
    name: '副业兼职', type: 1, icon: ph('briefcase', C.side),
    children: [
      { name: '兼职工资', icon: ph('money', C.side) },
      { name: '稿费', icon: ph('pen-nib', C.side) },
      { name: '翻译稿费', icon: ph('translate', C.side) },
      { name: '佣金提成', icon: ph('chart-bar', C.side) },
      { name: '咨询费', icon: ph('chat-circle-text', C.side) },
      { name: '培训授课', icon: ph('chalkboard-teacher', C.side) },
      { name: '设计接单', icon: ph('palette', C.side) },
      { name: '外包项目', icon: ph('code', C.side) },
      { name: '自媒体收入', icon: ph('device-mobile', C.side) },
      { name: '广告费', icon: ph('megaphone', C.side) },
      { name: '推广佣金', icon: ph('link', C.side) }
    ]
  },
  {
    name: '经营收入', type: 1, icon: ph('storefront', C.business),
    children: [
      { name: '店铺营收', icon: ph('storefront', C.business) },
      { name: '电商销售', icon: ph('shopping-cart', C.business) },
      { name: '二手转卖', icon: ph('recycle', C.business) },
      { name: '闲置回收', icon: ph('package', C.business) },
      { name: '直播打赏', icon: ph('gift', C.business) },
      { name: '礼物分成', icon: ph('heart', C.business) },
      { name: '付费内容', icon: ph('lock-key', C.business) },
      { name: '知识付费', icon: ph('books', C.business) },
      { name: '订阅收入', icon: ph('star', C.business) },
      { name: '会员费', icon: ph('credit-card', C.business) }
    ]
  },
  {
    name: '偏财所得', type: 1, icon: ph('gift', C.windfall),
    children: [
      { name: '红包', icon: ph('envelope', C.windfall) },
      { name: '礼金回礼', icon: ph('heart', C.windfall) },
      { name: '中奖', icon: ph('confetti', C.windfall) },
      { name: '彩票', icon: ph('ticket', C.windfall) },
      { name: '抽奖', icon: ph('target', C.windfall) },
      { name: '退税', icon: ph('receipt', C.windfall) },
      { name: '退款', icon: ph('arrow-counter-clockwise', C.windfall) },
      { name: '积分变现', icon: ph('star', C.windfall) },
      { name: '信用卡返现', icon: ph('credit-card', C.windfall) },
      { name: '平台返现', icon: ph('coins', C.windfall) }
    ]
  },
  {
    name: '家庭收入', type: 1, icon: ph('users-three', C.family),
    children: [
      { name: '父母给予', icon: ph('users-three', C.family) },
      { name: '配偶转账', icon: ph('heart', C.family) },
      { name: '子女给予', icon: ph('baby', C.family) },
      { name: '亲友赠予', icon: ph('handshake', C.family) },
      { name: '压岁钱', icon: ph('envelope-simple', C.family) },
      { name: '生日红包', icon: ph('cake', C.family) }
    ]
  },
  {
    name: '借贷往来', type: 1, icon: ph('credit-card', C.loan),
    children: [
      { name: '他人还款', icon: ph('arrow-counter-clockwise', C.loan) },
      { name: '收回借款', icon: ph('coins', C.loan) },
      { name: '押金退还', icon: ph('lock-open', C.loan) }
    ]
  },
  {
    name: '政府补贴', type: 1, icon: ph('bank', C.govt),
    children: [
      { name: '失业金', icon: ph('clipboard-text', C.govt) },
      { name: '生育津贴', icon: ph('baby', C.govt) },
      { name: '低保', icon: ph('house', C.govt) },
      { name: '公积金提取', icon: ph('bank', C.govt) },
      { name: '社保返还', icon: ph('first-aid', C.govt) },
      { name: '政府奖励', icon: ph('trophy', C.govt) }
    ]
  },
  {
    name: '其他收入', type: 1, icon: ph('diamond', C.income),
    children: [
      { name: '意外所得', icon: ph('sparkle', C.income) },
      { name: '保险理赔', icon: ph('shield-check', C.income) },
      { name: '未分类收入', icon: ph('question', C.income) }
    ]
  }
]
