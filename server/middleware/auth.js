/**
 * OpenID 校验中间件
 * 从 x-wx-openid 头中提取并校验 openid
 * 排除不需要鉴权的路由（如 /api/user/login）
 */
const SKIP_PATHS = ['/api/user/login', '/health']

const auth = (req, res, next) => {
  // 跳过无需鉴权的路由
  if (SKIP_PATHS.includes(req.path)) {
    return next()
  }

  const openid = req.headers['x-wx-openid']

  // 校验 openid 存在且非空
  if (!openid || !openid.trim()) {
    return res.json({
      code: 4010,
      message: '未登录或缺少身份标识'
    })
  }

  next()
}

module.exports = auth
