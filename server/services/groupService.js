const db = require('../config/db');

class GroupService {
  /**
   * 生成唯一邀请码 (8位)
   */
  generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * 创建小组
   */
  async create(name, openid) {
    const inviteCode = this.generateInviteCode();
    // 插入小组表
    const [res] = await db.execute(
      `INSERT INTO groups (name, owner_openid, invite_code) VALUES (?, ?, ?)`,
      [name, openid, inviteCode]
    );
    const groupId = res.insertId;

    // 默认创建者加入并成为 Admin
    await db.execute(
      `INSERT INTO group_members (group_id, openid, role) VALUES (?, ?, 'owner')`,
      [groupId, openid]
    );

    return { id: groupId, inviteCode: inviteCode };
  }

  /**
   * 加入小组 (通过邀请码)
   */
  async join(inviteCode, openid) {
    // 1. 查找小组
    const [rows] = await db.execute(`SELECT id, name FROM groups WHERE invite_code = ?`, [inviteCode]);
    if (rows.length === 0) {
      throw new Error('无效的邀请码');
    }
    const groupId = rows[0].id;
    const groupName = rows[0].name;

    // 2. 检查是否已加入
    const [members] = await db.execute(
      `SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND openid = ?`,
      [groupId, openid]
    );
    if (members[0].count > 0) {
      throw new Error('您已加入该小组');
    }

    // 3. 插入成员表
    await db.execute(
      `INSERT INTO group_members (group_id, openid, role) VALUES (?, ?, 'member')`,
      [groupId, openid]
    );

    return { id: groupId, name: groupName };
  }

  /**
   * 获取我的小组列表
   */
  async getMyGroups(openid) {
    const sql = `
      SELECT g.id, g.name, g.invite_code, gm.role, gm.joined_at, 
      (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
      FROM group_members gm
      JOIN groups g ON gm.group_id = g.id
      WHERE gm.openid = ?
      ORDER BY gm.joined_at DESC
    `;
    const [rows] = await db.execute(sql, [openid]);
    return rows;
  }

  /**
   * 获取小组成员
   */
  async getMembers(groupId) {
    const sql = `
      SELECT gm.id, gm.openid, gm.role, gm.joined_at,
             COALESCE(u.nickname, gm.nickname, '微信用户') as nickname,
             u.avatar_url as avatarUrl,
             DATE_FORMAT(gm.joined_at, '%Y-%m-%d') as joinedDate
      FROM group_members gm
      LEFT JOIN users u ON gm.openid COLLATE utf8mb4_unicode_ci = u.openid COLLATE utf8mb4_unicode_ci
      WHERE gm.group_id = ?
      ORDER BY gm.role = 'owner' DESC, gm.joined_at ASC
    `;
    const [rows] = await db.execute(sql, [groupId]);
    return rows;
  }
}

module.exports = new GroupService();
