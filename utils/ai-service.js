/* ═══════════════════════════════════════════════════════════════
   ai-service.js — AI 服务封装层
   封装 image/video/expert 调用
   ═══════════════════════════════════════════════════════════════ */

import { request } from './api-client.js';

/** 图片隐患识别 */
export async function recognizeImage(imageBase64, mimeType = 'image/jpeg', description = '') {
  return request('POST', '/api/image/recognize', {
    image: imageBase64,
    mimeType,
    description
  });
}

/** 视频抽帧分析 */
export async function analyzeVideo(formData) {
  /* Video upload uses multipart */
  const res = await fetch('http://localhost:8080/api/video/frames', {
    method: 'POST',
    body: formData
  });
  return res.json();
}

/** AI 专家单次问答 */
export async function askExpert(question) {
  return request('POST', '/api/expert/ask', { question });
}

/** AI 专家多轮对话 */
export async function chatExpert(messages) {
  return request('POST', '/api/expert/chat', { messages });
}

/** 获取法规列表 */
export async function getLaws(query = '') {
  const path = query ? `/api/laws?q=${encodeURIComponent(query)}` : '/api/laws';
  return request('GET', path);
}

/** 获取报告列表 */
export async function getReports() {
  return request('GET', '/api/reports/list');
}

/** 获取统计数据 */
export async function getStatistics() {
  return request('GET', '/api/reports/statistics');
}

/** 提交反馈 */
export async function submitFeedback(feedback) {
  return request('POST', '/api/feedback/submit', feedback);
}

/** 健康检查 */
export async function healthCheck() {
  return request('GET', '/api/health');
}
