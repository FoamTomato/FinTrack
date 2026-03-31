const db = require('../config/db')

const BASE_URL = process.env.BASE_URL || 'http://117.72.182.195'

/** 将相对路径的头像 URL 补全为完整 URL */
function fullAvatarUrl(url) {
  if (!url) return url
  if (url.startsWith('/')) return BASE_URL + url
  return url
}

class UserService {
  /**
   * 获取用户信息（不存在则自动创建）
   */
  async getProfile(openid) {
    // 查询用户记录
    const [rows] = await db.execute(
      'SELECT openid, nickname, avatar_url FROM users WHERE openid = ?',
      [openid]
    )

    if (rows.length === 0) {
      // 自动创建基础记录
      await db.execute('INSERT INTO users (openid) VALUES (?)', [openid])
      return { openid, nickname: null, avatarUrl: null, isNew: true }
    }

    return {
      openid: rows[0].openid,
      nickname: rows[0].nickname,
      avatarUrl: fullAvatarUrl(rows[0].avatar_url),
      isNew: !rows[0].nickname
    }
  }

  /**
   * 更新用户信息
   */
  async updateProfile(openid, nickname, avatarUrl) {
    const [result] = await db.execute(
      'UPDATE users SET nickname = ?, avatar_url = ? WHERE openid = ?',
      [nickname, avatarUrl, openid]
    )
    return result.affectedRows > 0
  }
}

module.exports = new UserService()
