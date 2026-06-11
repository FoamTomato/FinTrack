const fs = require('fs')
const path = require('path')
const db = require('../config/db')

const RETENTION_DAYS = 30
const CROP_RETENTION_DAYS = 365
const UPLOAD_BASE = path.join(__dirname, '..', 'uploads')
const SCAN_CROP_DIR = path.join(UPLOAD_BASE, 'scan-crops')

async function runCleanup() {
  await _cleanupExpiredTasks()
  _cleanupExpiredCrops()
}

// 30 天任务清理：删原图；未导入(imported=0)的任务连带删其裁剪小图(孤儿)，
// 已导入的裁图保留到 1 年清理（交易详情仍可看到来源裁图）。
async function _cleanupExpiredTasks() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ')

  const [rows] = await db.execute(
    'SELECT id, image_url, imported FROM scan_tasks WHERE created_at < ?',
    [cutoff]
  )
  if (!rows.length) return

  const ids = rows.map(r => r.id)

  for (const row of rows) {
    // 删原图
    if (row.image_url) {
      fs.unlink(path.join(__dirname, '..', row.image_url), () => {})
    }
    // 未导入的任务：删掉它产生的孤儿裁图 scan-crops/<id>_*.jpg
    if (!row.imported) {
      _deleteCropsOfTask(row.id)
    }
  }

  // 批量删除数据库记录（每次最多 500 条，避免超长 IN 子句）
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = ids.slice(i, i + 500)
    const placeholders = chunk.map(() => '?').join(',')
    await db.execute(`DELETE FROM scan_tasks WHERE id IN (${placeholders})`, chunk)
  }

  console.log(`[cleanup] Deleted ${ids.length} scan tasks older than ${RETENTION_DAYS} days`)
}

// 删除某任务的全部裁图 scan-crops/<taskId>_*.jpg
function _deleteCropsOfTask(taskId) {
  let files
  try {
    files = fs.readdirSync(SCAN_CROP_DIR)
  } catch (_) {
    return
  }
  const prefix = `${taskId}_`
  for (const f of files) {
    if (f.startsWith(prefix)) {
      fs.unlink(path.join(SCAN_CROP_DIR, f), () => {})
    }
  }
}

// 1 年裁图清理：删 scan-crops/ 内 mtime 超 365 天的文件（已导入裁图随之过期，前端对 404 容错）
function _cleanupExpiredCrops() {
  const cutoffMs = Date.now() - CROP_RETENTION_DAYS * 24 * 60 * 60 * 1000
  let files
  try {
    files = fs.readdirSync(SCAN_CROP_DIR)
  } catch (_) {
    return
  }
  let removed = 0
  for (const f of files) {
    const fp = path.join(SCAN_CROP_DIR, f)
    try {
      const stat = fs.statSync(fp)
      if (stat.mtimeMs < cutoffMs) {
        fs.unlinkSync(fp)
        removed++
      }
    } catch (_) {}
  }
  if (removed) console.log(`[cleanup] Deleted ${removed} crops older than ${CROP_RETENTION_DAYS} days`)
}

function startCleanupScheduler() {
  // 每天凌晨 3 点运行一次（24h interval，首次延迟到下一个 3:00）
  const now = new Date()
  const next3am = new Date(now)
  next3am.setHours(3, 0, 0, 0)
  if (next3am <= now) next3am.setDate(next3am.getDate() + 1)

  const msUntilFirst = next3am - now
  setTimeout(() => {
    runCleanup().catch(err => console.error('[cleanup] error:', err))
    setInterval(() => {
      runCleanup().catch(err => console.error('[cleanup] error:', err))
    }, 24 * 60 * 60 * 1000)
  }, msUntilFirst)

  console.log(`[cleanup] Scheduler started, first run at ${next3am.toLocaleString()}`)
}

module.exports = { startCleanupScheduler, runCleanup }
