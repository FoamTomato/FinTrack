const userService = require('../services/userService');
const { success } = require('../utils/response');
const https = require('https');

/** 微信小程序 AppID 和 AppSecret - 必须从环境变量读取 */
const WX_APPID = process.env.WX_APPID;
const WX_SECRET = process.env.WX_SECRET;

class UserController {
  /**
   * 登录：用 wx.login 的 code 换取 openid
   */
  async login(req, res, next) {
    try {
      const { code } = req.body;
      if (!code) throw new Error('缺少登录 code');

      // 检查环境变量是否配置
      if (!WX_SECRET) {
        console.error('错误: 环境变量 WX_SECRET 未配置');
        throw new Error('服务配置错误: 缺少 AppSecret');
      }

      const openid = await this._code2Session(code);
      const data = await userService.getProfile(openid);
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  // ... (getProfile 保持不变)

  /** 获取当前用户状态 */
  async getProfile(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid'] || 'test_openid';
      const data = await userService.getProfile(openid);
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  // ... (updateProfile 保持不变)
  async updateProfile(req, res, next) {
      // ... 保持原有逻辑
      try {
        const openid = req.headers['x-wx-openid'] || 'test_openid';
        const { nickname, avatarUrl } = req.body;
        if (!nickname) throw new Error('昵称不能为空');
  
        const result = await userService.updateProfile(openid, nickname, avatarUrl);
        if (result) {
          success(res, { message: '绑定成功' });
        } else {
          // 如果更新失败，可能是只有 openid 但没有记录，尝试插入
          // 但正常逻辑下 login 会创建记录，所以这里直接报失败
          throw new Error('更新失败'); 
        }
      } catch (err) {
        next(err);
      }
  }

  /**
   * 调用微信 jscode2session 接口，用 code 换 openid
   */
  _code2Session(code) {
    return new Promise((resolve, reject) => {
      // 关键修正：
      // 1. 使用 http 协议 (避免 self-signed certificate 错误)
      // 2. 显式传递 secret (避免 appsecret missing 错误)
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_APPID}&secret=${WX_SECRET}&js_code=${code}&grant_type=authorization_code`;

      https.get(url, (resp) => {
        let data = '';
        resp.on('data', (chunk) => data += chunk);
        resp.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.openid) {
              resolve(result.openid);
            } else {
              const errMsg = result.errmsg || '获取 openid 失败';
              // 打印完整错误以便调试
              console.error('微信接口返回错误:', result);
              reject(new Error(`${errMsg} (${result.errcode || 'unknown'})`));
            }
          } catch (e) {
            reject(new Error('解析微信响应失败'));
          }
        });
      }).on('error', (err) => {
        reject(new Error('调用微信接口失败: ' + err.message));
      });
    });
  }
}

module.exports = new UserController();
