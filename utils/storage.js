/* ═══════════════════════════════════════════════════════════════
   storage.js — 本地存储封装 (uni.storage + 过期机制)
   ═══════════════════════════════════════════════════════════════ */

const PREFIX = 'bdhy_';

export function setItem(key, value, ttlMs = 0) {
  const data = {
    value,
    timestamp: Date.now(),
    ttl: ttlMs
  };
  uni.setStorageSync(PREFIX + key, JSON.stringify(data));
}

export function getItem(key) {
  const raw = uni.getStorageSync(PREFIX + key);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (data.ttl > 0 && Date.now() - data.timestamp > data.ttl) {
      uni.removeStorageSync(PREFIX + key);
      return null;
    }
    return data.value;
  } catch (e) {
    return null;
  }
}

export function removeItem(key) {
  uni.removeStorageSync(PREFIX + key);
}

export function clearAll() {
  const keys = uni.getStorageInfoSync().keys.filter(k => k.startsWith(PREFIX));
  keys.forEach(k => uni.removeStorageSync(k));
}

export function getCacheSize() {
  const keys = uni.getStorageInfoSync().keys.filter(k => k.startsWith(PREFIX));
  let size = 0;
  keys.forEach(k => {
    size += (uni.getStorageSync(k) || '').length;
  });
  return size;
}
