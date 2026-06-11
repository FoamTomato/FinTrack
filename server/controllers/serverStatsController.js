const fs = require('fs')

function readFile(path) {
  try { return fs.readFileSync(path, 'utf8') } catch { return '' }
}

function getMemInfo() {
  const raw = readFile('/proc/meminfo')
  const get = key => {
    const m = raw.match(new RegExp('^' + key + '\\s*:\\s*(\\d+)', 'm'))
    return m ? parseInt(m[1]) * 1024 : 0
  }
  const total      = get('MemTotal')
  const free       = get('MemFree')
  const available  = get('MemAvailable')
  const buffers    = get('Buffers')
  const cached     = get('Cached')
  const slab       = get('Slab')
  const sreclaim   = get('SReclaimable')
  const sunreclaim = get('SUnreclaim')
  const used       = total - available
  const toMB = v => Math.round(v / 1048576 * 10) / 10
  return {
    total_mb:       toMB(total),
    used_mb:        toMB(used),
    free_mb:        toMB(free),
    available_mb:   toMB(available),
    buffers_mb:     toMB(buffers),
    cached_mb:      toMB(cached),
    slab_mb:        toMB(slab),
    sreclaim_mb:    toMB(sreclaim),
    sunreclaim_mb:  toMB(sunreclaim),
    used_pct:       total > 0 ? Math.round(used / total * 1000) / 10 : 0,
    sunreclaim_pct: total > 0 ? Math.round(sunreclaim / total * 1000) / 10 : 0,
  }
}

function getSlabTop() {
  const raw = readFile('/proc/slabinfo')
  if (!raw) return []
  const lines = raw.split('\n').slice(2).filter(Boolean)
  const items = lines.map(line => {
    const p = line.trim().split(/\s+/)
    const name = p[0]
    const active_objs = parseInt(p[1]) || 0
    const obj_size    = parseInt(p[3]) || 0
    const size_bytes  = active_objs * obj_size
    return { name, active_objs, obj_size, size_mb: Math.round(size_bytes / 1048576 * 10) / 10 }
  }).filter(x => x.size_mb > 0)
  items.sort((a, b) => b.size_mb - a.size_mb)
  return items.slice(0, 5)
}

function getLoadAvg() {
  const parts = readFile('/proc/loadavg').trim().split(/\s+/)
  const [running, total] = (parts[3] || '0/0').split('/')
  return {
    load1:  parseFloat(parts[0]) || 0,
    load5:  parseFloat(parts[1]) || 0,
    load15: parseFloat(parts[2]) || 0,
    procs_running: parseInt(running) || 0,
    procs_total:   parseInt(total) || 0,
  }
}

function getCpuSample() {
  const line  = readFile('/proc/stat').split('\n')[0]
  const parts = line.trim().split(/\s+/).slice(1).map(Number)
  const idle  = parts[3] + (parts[4] || 0)
  const total = parts.reduce((a, b) => a + b, 0)
  return { idle, total }
}

// 读宿主机 eth0 累计字节（通过 /proc/1/net/dev 访问宿主网络命名空间）
function readEth0() {
  // 优先读宿主机网络命名空间
  for (const path of ['/proc/1/net/dev', '/proc/net/dev']) {
    const raw  = readFile(path)
    const line = raw.split('\n').find(l => l.trim().startsWith('eth0'))
    if (line) {
      const parts = line.trim().split(/\s+/)
      return { rx: parseInt(parts[1]) || 0, tx: parseInt(parts[9]) || 0 }
    }
  }
  return { rx: 0, tx: 0 }
}

// 同时采样 CPU + 网络，间隔 600ms，计算实时速率
function getSampledMetrics() {
  return new Promise(resolve => {
    const cpu1 = getCpuSample()
    const net1 = readEth0()
    const t1   = Date.now()

    setTimeout(() => {
      const cpu2 = getCpuSample()
      const net2 = readEth0()
      const dt   = (Date.now() - t1) / 1000  // 秒

      const dTotal = cpu2.total - cpu1.total
      const dIdle  = cpu2.idle  - cpu1.idle
      const cpu_pct = dTotal > 0 ? Math.round((1 - dIdle / dTotal) * 1000) / 10 : 0

      // 实时速率 KB/s
      const rx_kbps = Math.round((net2.rx - net1.rx) / 1024 / dt * 10) / 10
      const tx_kbps = Math.round((net2.tx - net1.tx) / 1024 / dt * 10) / 10
      // 累计总量 MB
      const rx_total_mb = Math.round(net2.rx / 1048576 * 10) / 10
      const tx_total_mb = Math.round(net2.tx / 1048576 * 10) / 10

      resolve({ cpu_pct, rx_kbps, tx_kbps, rx_total_mb, tx_total_mb })
    }, 600)
  })
}

function getDiskInfo() {
  try {
    const { execSync } = require('child_process')
    const out   = execSync('df -B1 /', { timeout: 3000 }).toString().trim().split('\n').pop()
    const parts = out.split(/\s+/)
    const toMB  = v => Math.round(parseInt(v) / 1048576 * 10) / 10
    const total = toMB(parts[1])
    const used  = toMB(parts[2])
    const avail = toMB(parts[3])
    return { total_mb: total, used_mb: used, avail_mb: avail,
             used_pct: total > 0 ? Math.round(used / total * 1000) / 10 : 0 }
  } catch {
    return { total_mb: 0, used_mb: 0, avail_mb: 0, used_pct: 0 }
  }
}

function getCpuCount() {
  const raw = readFile('/proc/cpuinfo')
  return (raw.match(/^processor\s*:/gm) || []).length || 1
}

const getServerStats = async (req, res) => {
  try {
    const [sampled, mem, load, disk] = await Promise.all([
      getSampledMetrics(),
      Promise.resolve(getMemInfo()),
      Promise.resolve(getLoadAvg()),
      Promise.resolve(getDiskInfo()),
    ])

    const { cpu_pct, rx_kbps, tx_kbps, rx_total_mb, tx_total_mb } = sampled

    res.json({
      cpu_pct,
      cpu_count: getCpuCount(),
      mem,
      load,
      net: { rx_kbps, tx_kbps, rx_total_mb, tx_total_mb },
      disk,
      slab_top: getSlabTop(),
      timestamp: Date.now(),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getServerStats }
