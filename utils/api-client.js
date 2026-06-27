/* ═══════════════════════════════════════════════════════════════
   api-client.js — API 调用客户端
   fetch 封装 + 离线降级 + 请求队列
   ═══════════════════════════════════════════════════════════════ */

const CONFIG = {
  baseUrl: 'http://localhost:8080',
  timeout: 15000
};

const offlineQueue = [];

export function setBaseUrl(url) {
  CONFIG.baseUrl = url;
}

export async function request(method, path, body = null, options = {}) {
  const url = CONFIG.baseUrl + path;
  const fetchOptions = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(options.timeout || CONFIG.timeout)
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, fetchOptions);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'API Error');
    return data;
  } catch (e) {
    if (e.name === 'TimeoutError' || e.name === 'AbortError') {
      throw new Error('AI_TIMEOUT');
    }
    if (e.message === 'Failed to fetch' || e.message.includes('NetworkError')) {
      throw new Error('NETWORK_UNAVAILABLE');
    }
    throw e;
  }
}

export function queueOfflineRequest(method, path, body) {
  offlineQueue.push({ method, path, body, timestamp: Date.now() });
}

export async function flushOfflineQueue() {
  while (offlineQueue.length > 0) {
    const req = offlineQueue.shift();
    try {
      await request(req.method, req.path, req.body);
    } catch (e) {
      offlineQueue.unshift(req);
      break;
    }
  }
}

export function getOfflineQueueSize() {
  return offlineQueue.length;
}
