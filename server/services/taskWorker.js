/**
 * 后台任务 worker —— 让识图(scan_tasks) / 语音(voice_tasks) 的解析真正后台化、可恢复、受限流。
 *
 * 解决 P3：原先仅靠 controller 的 setImmediate 触发一次，容器重启/OOM(192M) 后
 * 搁浅在 pending/processing 的任务永久无人重跑，且多图并发无限流互相拖慢。
 *
 * 机制：
 *   1. 启动时把所有 processing 重置回 pending（重启后它们必然已不在执行）。
 *   2. 定时轮询，原子认领 pending（SELECT 候选 → 带 status 条件的 UPDATE 防并发抢占）。
 *   3. 全局并发上限 MAX_CONCURRENCY（跨两个队列共享，适配 192M + 多模型调用）。
 *   4. 运行中若某任务 processing 超 STALE 秒（卡死/失联）也会被重新拾起。
 *   5. 失败重试由各 service.processTask 落库（retry_count+1 未达上限退回 pending），worker 再认领。
 */
const db = require('../config/db')

const POLL_MS = 3000              // 轮询间隔
const STALE_SEC = 180             // processing 超此秒数视为搁浅，重新入队
const MAX_CONCURRENCY = 2         // 全局并发上限（scan+voice 共享）

const QUEUES = [
  { table: 'scan_tasks', service: require('./scanService') },
  { table: 'voice_tasks', service: require('./voiceService') }
]

let inFlight = 0
let timer = null

// 把搁浅的 processing 退回 pending（staleSec=0 表示全部重置，用于启动时）
async function _resetStranded(staleSec) {
  for (const q of QUEUES) {
    await db.execute(
      `UPDATE ${q.table}
         SET status = 'pending'
       WHERE status = 'processing'
         AND updated_at < (NOW() - INTERVAL ${Number(staleSec) || 0} SECOND)`
    ).catch(() => {})
  }
}

// 原子认领一条 pending：先选候选，再带 status 条件更新，affectedRows=1 才算认领成功
async function _claimOne(q) {
  const [rows] = await db.execute(
    `SELECT id, openid FROM ${q.table} WHERE status = 'pending' ORDER BY id ASC LIMIT 1`
  )
  if (!rows.length) return null
  const task = rows[0]
  const [r] = await db.execute(
    `UPDATE ${q.table} SET status = 'processing' WHERE id = ? AND status = 'pending'`,
    [task.id]
  )
  if (!r || r.affectedRows !== 1) return null   // 被并发抢走
  return task
}

async function _tick() {
  if (inFlight >= MAX_CONCURRENCY) return
  for (const q of QUEUES) {
    while (inFlight < MAX_CONCURRENCY) {
      let task = null
      try {
        task = await _claimOne(q)
      } catch (_) {
        break   // 该队列查询异常，下个 tick 再试
      }
      if (!task) break
      inFlight++
      // 不 await：并发执行，完成/失败后释放槽位（processTask 内部已自行落库状态）
      Promise.resolve(q.service.processTask(task.id, task.openid))
        .catch(() => {})
        .finally(() => { inFlight-- })
    }
  }
}

let _ticking = false
async function _safeTick() {
  if (_ticking) return
  _ticking = true
  try {
    await _resetStranded(STALE_SEC)
    await _tick()
  } catch (_) {
  } finally {
    _ticking = false
  }
}

async function start() {
  if (timer) return
  // 启动先把上次残留的 processing 全部退回 pending（重启后它们已不在执行）
  await _resetStranded(0).catch(() => {})
  timer = setInterval(_safeTick, POLL_MS)
  console.log(`🛠️  taskWorker started (poll ${POLL_MS}ms, concurrency ${MAX_CONCURRENCY})`)
  // 立即跑一次，缩短首单延迟
  _safeTick()
}

function stop() {
  if (timer) { clearInterval(timer); timer = null }
}

// 即时催一次（上传/提交后调用），无需等下个轮询；仍受 MAX_CONCURRENCY 限流
function nudge() {
  _safeTick()
}

module.exports = { start, stop, nudge }
