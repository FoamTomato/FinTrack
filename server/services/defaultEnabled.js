/**
 * 默认启用的"常用"分类名单
 *
 * 新用户初始化或老用户补齐默认分类时:
 * - 一级分类名在 enabledParents 中 → 默认 is_enabled = 1
 *   - 其下子分类名在 enabledChildren[parentName] 中 → 默认 is_enabled = 1
 *   - 不在 → 默认 is_enabled = 0 (用户可在分类管理页自行启用)
 * - 一级分类名不在 enabledParents 中 → 该一级及其全部子分类默认 is_enabled = 0
 *
 * 老用户已存在的分类不做调整,只对新插入的项生效,尊重用户既有设置。
 */

// 默认启用的一级分类名（其余一级及其子分类默认禁用）
const enabledParents = new Set([
  // 支出
  '餐饮美食',
  '交通出行',
  '日用购物',
  '居家住房',
  '娱乐休闲',
  '医疗健康',
  '人情往来',
  '其他支出',
  // 收入
  '工资薪酬',
  '偏财所得',
  '其他收入'
])

// 默认启用一级分类下,具体启用哪些子分类
// 未在此列出的子分类即使父级启用,也默认禁用
const enabledChildren = {
  // 支出
  '餐饮美食': ['早餐', '午餐', '晚餐', '夜宵', '奶茶饮品', '外卖', '聚餐请客', '水果'],
  '交通出行': ['公交', '地铁', '出租车', '网约车', '共享单车', '汽车加油', '停车费'],
  '日用购物': ['日用百货', '纸巾纸品', '清洁用品', '洗护用品'],
  '居家住房': ['房租', '房贷月供', '物业费', '水费', '电费', '燃气费', '宽带网费'],
  '娱乐休闲': ['电影', '订阅会员', '视频会员', '游戏充值', 'KTV'],
  '医疗健康': ['门诊挂号', '药品', '体检'],
  '人情往来': ['婚礼礼金', '生日礼金', '亲友礼物', '份子钱'],
  '其他支出': ['手续费', '罚款', '押金', '未分类支出'],
  // 收入
  '工资薪酬': ['基本工资', '绩效奖金', '年终奖', '加班费', '补贴津贴', '提成'],
  '偏财所得': ['红包', '中奖', '退款', '退税'],
  '其他收入': ['意外所得', '保险理赔', '未分类收入']
}

/**
 * 判断默认分类的初始启用状态
 * @param {string} parentName 一级分类名
 * @param {string} [childName] 子分类名（不传则表示判断一级）
 * @returns {boolean}
 */
function isDefaultEnabled(parentName, childName) {
  if (!enabledParents.has(parentName)) return false
  if (!childName) return true
  const list = enabledChildren[parentName]
  if (!list) return false
  return list.includes(childName)
}

module.exports = { isDefaultEnabled }
