const db = require('../config/db');

class UserService {
  /**
   * 获取用户信息/检查绑定状态
   */
  async getProfile(openid) {
    const [rows] = await db.execute(
      `SELECT openid, nickname, avatar_url FROM users WHERE openid = ?`,
      [openid]
    );
    
    if (rows.length === 0) {
      // 如果不存在记录，则自动插入一个基础记录并返回
      await db.execute(`INSERT INTO users (openid) VALUES (?)`, [openid]);
      return { openid, nickname: null, avatarUrl: null, isNew: true };
    }
    
    return {
      openid: rows[0].openid,
      nickname: rows[0].nickname,
      avatarUrl: rows[0].avatar_url,
      isNew: !rows[0].nickname // 如果没有昵称，视为未完全绑定
    };
  }

  /**
   * 更新用户信息
   */
  async updateProfile(openid, nickname, avatarUrl) {
    const [res] = await db.execute(
      `UPDATE users SET nickname = ?, avatar_url = ? WHERE openid = ?`,
      [nickname, avatarUrl, openid]
    );
    return res.affectedRows > 0;
  }
}

module.exports = new UserService();
