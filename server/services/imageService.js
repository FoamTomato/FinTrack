/**
 * 图像预处理（基于 sharp / libvips，内存友好，适配 192M 容器）。
 *
 * 解决 P1：超大 / 超长账单截图整图直发会被模型侧降采样 → 文字糊、识别不全。
 * 做法：
 *   1. 归一：宽 > MAX_W 等比缩小到 MAX_W（不放大）。
 *   2. 分块：缩放后仍过高(长截图) → 竖向切 TILE_H + OVERLAP 的瓦片，逐片清晰识别。
 * 每个瓦片附带其在「原图」中的归一化竖向区间 [y0, y1]（0~1），
 * 供上层把瓦片内的 bbox 映射回原图坐标后合并、去重。
 */
const sharp = require('sharp')

const MAX_W = 1500            // 归一化目标宽度
const TILE_H = 1600           // 单瓦片最大高度
const OVERLAP = 200           // 相邻瓦片重叠高度（避免边界处账单被截断）
const TILE_TRIGGER = TILE_H * 1.2  // 缩放后高度超过此值才分块
const JPEG_QUALITY = 82       // 送模型的瓦片质量

/**
 * 预处理图片，返回 { width, height, tiles:[{base64, mimeType, y0, y1}] }。
 * 任意环节失败时抛错，调用方应自行回退到「整图直发」。
 */
async function prepareTiles(localPath) {
  const meta = await sharp(localPath, { failOn: 'none' }).metadata()
  const origW = meta.width || 0
  const origH = meta.height || 0

  // 拿不到尺寸：整图归一为单瓦片
  if (!origW || !origH) {
    const buf = await sharp(localPath, { failOn: 'none' }).jpeg({ quality: JPEG_QUALITY }).toBuffer()
    return { width: origW, height: origH, tiles: [{ base64: buf.toString('base64'), mimeType: 'image/jpeg', y0: 0, y1: 1 }] }
  }

  const targetW = Math.min(origW, MAX_W)
  // 缩放后真实尺寸（origW<=targetW 时不放大，保持原尺寸）
  const realW = targetW
  const realH = origW <= targetW ? origH : Math.round(origH * (targetW / origW))

  // 归一化大图（中间产物用高质量，避免后续二次压缩糊）
  const resizedBuf = await sharp(localPath, { failOn: 'none' })
    .resize({ width: targetW, withoutEnlargement: true })
    .jpeg({ quality: 95 })
    .toBuffer()

  // 不需要分块：直接作为单瓦片（再压一次到送模型质量）
  if (realH <= TILE_TRIGGER) {
    const buf = await sharp(resizedBuf).jpeg({ quality: JPEG_QUALITY }).toBuffer()
    return { width: origW, height: origH, tiles: [{ base64: buf.toString('base64'), mimeType: 'image/jpeg', y0: 0, y1: 1 }] }
  }

  // 竖向分块
  const tiles = []
  let top = 0
  while (top < realH) {
    const h = Math.min(TILE_H, realH - top)
    const tileBuf = await sharp(resizedBuf)
      .extract({ left: 0, top, width: realW, height: h })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer()
    tiles.push({
      base64: tileBuf.toString('base64'),
      mimeType: 'image/jpeg',
      y0: top / realH,
      y1: (top + h) / realH
    })
    if (top + h >= realH) break
    top += (TILE_H - OVERLAP)
  }
  return { width: origW, height: origH, tiles }
}

/**
 * 按归一化竖向区间 [y0, y1]（0~1，整宽）从图片裁出小图，写到 outPath（JPEG）。
 * 上下各留 pad 比例的边距，避免贴边切到。返回 true/false。
 */
async function cropVertical(localPath, y0, y1, outPath, pad = 0.01) {
  const meta = await sharp(localPath, { failOn: 'none' }).metadata()
  const w = meta.width || 0
  const h = meta.height || 0
  if (!w || !h) return false

  const t = Math.max(0, Math.min(1, Math.min(y0, y1) - pad))
  const b = Math.max(0, Math.min(1, Math.max(y0, y1) + pad))
  const topPx = Math.round(t * h)
  const heightPx = Math.max(1, Math.round((b - t) * h))
  if (heightPx <= 0) return false

  await sharp(localPath, { failOn: 'none' })
    .extract({ left: 0, top: topPx, width: w, height: Math.min(heightPx, h - topPx) })
    .jpeg({ quality: 85 })
    .toFile(outPath)
  return true
}

module.exports = { prepareTiles, cropVertical, MAX_W, TILE_H }
