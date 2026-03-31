const db = require('../config/db')

class GroupService {
  /**
   * 校验用户是否为小组成员（不通过则抛错）
   */
  async checkMembership(groupId, openid) {
    const [rows] = await db.execute(
      'SELECT id FROM group_members WHERE group_id = ? AND openid = ?',
      [groupId, openid]
    )
    if (rows.length === 0) {
      throw { type: 'VALIDATION_ERROR', message: '您不是该小组成员' }
    }
  }

  /**
   * 生成唯一邀请码（8位，含冲突重试）
   */
  async generateUniqueInviteCode(maxRetries = 5) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let code = ''
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }

      // 检查是否已存在
      const [rows] = await db.execute(
        'SELECT id FROM `groups` WHERE invite_code = ?',
        [code]
      )
      if (rows.length === 0) return code
    }

    throw new Error('生成邀请码失败，请重试')
  }

  /**
   * 创建小组
   */
  async create(name, openid) {
    // 生成唯一邀请码
    const inviteCode = await this.generateUniqueInviteCode()

    // 插入小组记录
    const [res] = await db.execute(
      'INSERT INTO `groups` (name, owner_openid, invite_code) VALUES (?, ?, ?)',
      [name, openid, inviteCode]
    )
    const groupId = res.insertId

    // 创建者默认加入并成为 owner
    await db.execute(
      "INSERT INTO group_members (group_id, openid, role) VALUES (?, ?, 'owner')",
      [groupId, openid]
    )

    return { id: groupId, inviteCode }
  }

  /**
   * 加入小组（通过邀请码）
   */
  async join(inviteCode, openid) {
    // 查找小组
    const [rows] = await db.execute(
      'SELECT id, name FROM `groups` WHERE invite_code = ?',
      [inviteCode]
    )
    if (rows.length === 0) {
      throw new Error('无效的邀请码')
    }
    const groupId = rows[0].id
    const groupName = rows[0].name

    // 检查是否已加入
    const [members] = await db.execute(
      'SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND openid = ?',
      [groupId, openid]
    )
    if (members[0].count > 0) {
      throw new Error('您已加入该小组')
    }

    // 插入成员记录
    await db.execute(
      "INSERT INTO group_members (group_id, openid, role) VALUES (?, ?, 'member')",
      [groupId, openid]
    )

    return { id: groupId, name: groupName }
  }

  /**
   * 获取我的小组列表
   */
  async getMyGroups(openid) {
    const sql = `SELECT g.id, g.name, g.invite_code, gm.role, gm.joined_at,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
      FROM group_members gm
      JOIN \`groups\` g ON gm.group_id = g.id
      WHERE gm.openid = ?
      ORDER BY gm.joined_at DESC`

    const [rows] = await db.execute(sql, [openid])
    return rows
  }

  /**
   * 获取小组成员
   */
  async getMembers(groupId) {
    const sql = `SELECT gm.id, gm.openid, gm.role, gm.joined_at,
        COALESCE(u.nickname, gm.nickname, '微信用户') as nickname,
        u.avatar_url as avatarUrl,
        DATE_FORMAT(gm.joined_at, '%Y-%m-%d') as joinedDate
      FROM group_members gm
      LEFT JOIN users u ON gm.openid COLLATE utf8mb4_unicode_ci = u.openid COLLATE utf8mb4_unicode_ci
      WHERE gm.group_id = ?
      ORDER BY gm.role = 'owner' DESC, gm.joined_at ASC`

    const [rows] = await db.execute(sql, [groupId])
    return rows
  }
}

module.exports = new GroupService()
