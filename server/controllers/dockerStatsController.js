const http = require('http')

// 通过 Docker Unix socket 调用 API
// 显式关闭 keep-alive 并兜底 res 错误，避免 timeout/异常时 socket 残留
function dockerRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        socketPath: '/var/run/docker.sock',
        path,
        method: 'GET',
        headers: { Connection: 'close' },
      },
      res => {
        let data = ''
        res.on('data', c => data += c)
        res.on('end', () => {
          try { resolve(JSON.parse(data)) }
          catch(e) { reject(new Error('JSON parse error: ' + data.slice(0, 100))) }
        })
        res.on('error', err => { res.resume(); reject(err) })
      }
    )
    req.on('error', reject)
    req.setTimeout(8000, () => {
      req.destroy(new Error('timeout'))
      reject(new Error('timeout'))
    })
    req.end()
  })
}

function toMB(v) {
  if (v == null) return 0
  if (typeof v === 'number') return v / 1048576
  return v / 1048576
}

function fmtUptime(startedAt) {
  if (!startedAt || startedAt === '0001-01-01T00:00:00Z') return '—'
  const diff = Date.now() - new Date(startedAt).getTime()
  const days  = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins  = Math.floor((diff % 3600000) / 60000)
  if (days > 0)  return days + ' 天 ' + hours + ' 小时'
  if (hours > 0) return hours + ' 小时 ' + mins + ' 分钟'
  return mins + ' 分钟'
}

const getDockerStats = async (req, res) => {
  try {
    // 1. 获取所有容器列表（包括停止的）
    const containers = await dockerRequest('/containers/json?all=1')

    // 2. 并发获取每个容器的 stats（running 才有意义）
    const results = await Promise.all(containers.map(async c => {
      const name   = (c.Names[0] || '').replace(/^\//, '')
      const status = c.State  // running / exited / restarting
      const startedAt = c.Status

      let cpu_percent = 0, mem_usage_mb = 0, mem_limit_mb = 512
      let net_rx_mb = 0, net_tx_mb = 0, block_read_mb = 0, block_write_mb = 0
      let uptime = '—'

      if (status === 'running') {
        try {
          const s = await dockerRequest('/containers/' + c.Id + '/stats?stream=false&one-shot=true')

          // CPU %
          const cpuDelta    = s.cpu_stats.cpu_usage.total_usage - s.precpu_stats.cpu_usage.total_usage
          const systemDelta = s.cpu_stats.system_cpu_usage - s.precpu_stats.system_cpu_usage
          const numCpu      = s.cpu_stats.online_cpus || s.cpu_stats.cpu_usage.percpu_usage?.length || 1
          cpu_percent = systemDelta > 0 ? (cpuDelta / systemDelta) * numCpu * 100 : 0

          // Memory
          const memCache  = s.memory_stats.stats?.cache || 0
          mem_usage_mb    = toMB(s.memory_stats.usage - memCache)
          mem_limit_mb    = toMB(s.memory_stats.limit)

          // Network（累计）
          const nets = s.networks || {}
          for (const iface of Object.values(nets)) {
            net_rx_mb += toMB(iface.rx_bytes || 0)
            net_tx_mb += toMB(iface.tx_bytes || 0)
          }

          // Disk IO（累计）
          const blkStats = s.blkio_stats?.io_service_bytes_recursive || []
          for (const b of blkStats) {
            if (b.op === 'read'  || b.op === 'Read')  block_read_mb  += toMB(b.value)
            if (b.op === 'write' || b.op === 'Write') block_write_mb += toMB(b.value)
          }

          // Uptime
          const inspect = await dockerRequest('/containers/' + c.Id + '/json')
          uptime = fmtUptime(inspect.State?.StartedAt)
        } catch(e) {
          // stats 失败不影响其他容器
        }
      }

      return {
        name,
        status: status === 'exited' ? 'stopped' : status,
        cpu_percent:    Math.round(cpu_percent * 100) / 100,
        mem_usage_mb:   Math.round(mem_usage_mb * 10) / 10,
        mem_limit_mb:   Math.round(mem_limit_mb * 10) / 10,
        net_rx_mb:      Math.round(net_rx_mb * 10) / 10,
        net_tx_mb:      Math.round(net_tx_mb * 10) / 10,
        block_read_mb:  Math.round(block_read_mb * 10) / 10,
        block_write_mb: Math.round(block_write_mb * 10) / 10,
        uptime,
      }
    }))

    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getDockerStats }
