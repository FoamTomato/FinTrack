/**
 * 图片记账：选图 + 压缩 + 逐张上传，同一次选择归为一个 batchId。
 * 从 pages/scan/index.js 抽出，供「记一笔」页（tabBar 图片模式）与扫描页共用。
 *
 * batch 聚合为前端方案：上传成功后把 { [taskId]: batchId } 写入本地 storage('scanBatchMap')，
 * 时间线据此把同批多张图聚合成一张九宫格卡片。
 */

const API = require('./api');
const Loading = require('./loading');
const Logger = require('./logger');
const log = Logger.module('scanPicker');

const BATCH_MAP_KEY = 'scanBatchMap';

function loadBatchMap() {
  try { return wx.getStorageSync(BATCH_MAP_KEY) || {}; } catch (_) { return {}; }
}
function saveBatchEntry(taskId, batchId) {
  try {
    const map = loadBatchMap();
    map[taskId] = batchId;
    wx.setStorageSync(BATCH_MAP_KEY, map);
  } catch (e) { log.warn('saveBatchEntry failed', e); }
}

// 目标 ≤ 1.5MB（后端限制 5MB，留出 base64/网络余量）；失败或仍超限返回 null
async function compressForUpload(srcPath, originalSize) {
  const TARGET = 1.5 * 1024 * 1024;
  const HARD_LIMIT = 5 * 1024 * 1024;

  const getSize = (p) => new Promise(resolve => {
    wx.getFileInfo({ filePath: p, success: r => resolve(r.size || 0), fail: () => resolve(0) });
  });

  let size = originalSize || await getSize(srcPath);
  if (size && size <= TARGET) return srcPath;

  const isPng = /\.png$/i.test(srcPath);
  const qualities = [80, 60, 40];

  for (const q of qualities) {
    const opts = { src: srcPath, quality: q };
    if (isPng || size > 3 * 1024 * 1024) opts.compressedWidth = 1280;
    const out = await new Promise(resolve => {
      wx.compressImage({ ...opts, success: r => resolve(r.tempFilePath), fail: () => resolve(null) });
    });
    if (!out) continue;
    const outSize = await getSize(out);
    if (outSize && outSize <= TARGET) return out;
    srcPath = out;
    size = outSize || size;
    if (size <= HARD_LIMIT && q === qualities[qualities.length - 1]) return out;
  }
  return null;
}

/**
 * 选图并上传整批。
 * @param {Object} opts
 * @param {Function} opts.onProgress  (current, total) => void
 * @returns {Promise<{batchId:string, uploaded:number, total:number} | null>} 用户取消返回 null
 */
async function pickAndUpload(opts = {}) {
  const { onProgress } = opts;

  let mediaRes;
  try {
    mediaRes = await new Promise((resolve, reject) => {
      wx.chooseMedia({
        count: 9,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: resolve,
        fail: reject
      });
    });
  } catch (err) {
    if (err && err.errMsg && err.errMsg.includes('cancel')) return null;
    log.error('chooseMedia failed:', err);
    Loading.error('选择图片失败');
    return null;
  }

  const files = mediaRes.tempFiles || [];
  if (!files.length) return null;

  // 同一次选择 = 同一批次
  const batchId = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  let uploaded = 0;

  for (let i = 0; i < files.length; i++) {
    if (onProgress) onProgress(i + 1, files.length);
    try {
      const filePath = await compressForUpload(files[i].tempFilePath, files[i].size || 0);
      if (!filePath) {
        Loading.toast(`第 ${i + 1} 张压缩后仍超过限制，已跳过`);
        continue;
      }
      const res = await API.uploadScanImage(filePath);
      if (res.code === 0 && res.data && res.data.taskId) {
        saveBatchEntry(res.data.taskId, batchId);
        uploaded++;
      } else {
        Loading.toast(`第 ${i + 1} 张上传失败：${res.message || '未知错误'}`);
      }
    } catch (err) {
      log.error(`upload[${i}] failed:`, err);
      Loading.toast(`第 ${i + 1} 张上传失败`);
    }
  }

  return { batchId, uploaded, total: files.length };
}

module.exports = { pickAndUpload, loadBatchMap, BATCH_MAP_KEY };
