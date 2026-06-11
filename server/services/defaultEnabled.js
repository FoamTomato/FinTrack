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
  '日常出行',
  '日常购物',
  '居家住房',
  '其他支出',
  // 收入
  '偏财所得',
  '其他收入'
])

// 默认启用一级分类下,具体启用哪些子分类
// 未在此列出的子分类即使父级启用,也默认禁用
const enabledChildren = {
  // 支出
  '餐饮美食': ['早餐', '午餐', '晚餐', '夜宵', '下午茶', '咖啡', '超市购物', '日常买菜'],
  '日常出行': ['公交', '地铁', '网约车', '共享单车', '电动车充电', '停车费', '高铁费'],
  '日常购物': ['日用百货', '纸巾纸品', '清洁用品', '洗护用品', '收纳整理', '雨具', '五金工具', '电池', '灯泡灯具', '绿植花卉', '季节用品', '衣服', '化妆品', '盲盒', '其他'],
  '居家住房': ['房租', '房贷月供', '首付', '物业费', '水电燃气费', '网络费', '搬家费', '装修费', '家政保洁费', '其他费用'],
  '其他支出': ['理发', '烫染发', '护发', '美甲', '美睫', '美瞳', '纹绣', '纹身', 'SPA按摩', '足疗', '汗蒸', '皮肤管理', '瘦身塑形', '手续费', '丢失赔偿', '罚款', '押金', '抵押金', '未分类支出', '报销垫付', '借出款项'],
  // 收入
  '偏财所得': ['红包', '中奖', '退税', '返现', '其他偏财'],
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
