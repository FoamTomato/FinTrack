const axios = require('axios')
const userService = require('../services/userService')
const { success } = require('../utils/response')

const WX_APPID = process.env.WX_APPID
const WX_SECRET = process.env.WX_SECRET

class UserController {
  /**
   * 登录：用 wx.login 的 code 换取 openid
   */
  async login(req, res, next) {
    try {
      // 提取参数
      const { code } = req.body

      // 参数校验
      if (!code) {
        throw { type: 'VALIDATION_ERROR', message: '缺少登录 code' }
      }
      if (!WX_SECRET) {
        throw new Error('服务配置错误: 缺少 AppSecret')
      }

      // 调用微信接口换取 openid
      const openid = await this._code2Session(code)

      // 调用 Service 获取用户信息
      const data = await userService.getProfile(openid)

      // 返回响应
      success(res, data)
    } catch (err) {
      next(err)
    }
  }

  /**
   * 获取当前用户档案
   */
  async getProfile(req, res, next) {
    try {
      // 提取参数
      const openid = req.headers['x-wx-openid']

      // 调用 Service
      const data = await userService.getProfile(openid)

      // 返回响应
      success(res, data)
    } catch (err) {
      next(err)
    }
  }

  /**
   * 更新用户信息
   */
  async updateProfile(req, res, next) {
    try {
      // 提取参数
      const openid = req.headers['x-wx-openid']
      const { nickname, avatarUrl } = req.body

      // 参数校验
      if (!nickname || !nickname.trim()) {
        throw { type: 'VALIDATION_ERROR', message: '昵称不能为空' }
      }

      // 调用 Service
      const result = await userService.updateProfile(openid, nickname.trim(), avatarUrl)

      if (!result) {
        throw new Error('更新失败')
      }

      // 返回响应
      success(res, null, '绑定成功')
    } catch (err) {
      next(err)
    }
  }

  /**
   * 调用微信 jscode2session 接口，用 code 换 openid
   */
  async _code2Session(code) {
    const url = 'https://api.weixin.qq.com/sns/jscode2session'
    const resp = await axios.get(url, {
      params: {
        appid: WX_APPID,
        secret: WX_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    })

    const result = resp.data
    if (!result.openid) {
      console.error('微信接口返回错误:', result)
      throw new Error(`${result.errmsg || '获取 openid 失败'} (${result.errcode || 'unknown'})`)
    }

    return result.openid
  }
}

module.exports = new UserController()
