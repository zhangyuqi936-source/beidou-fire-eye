/* ═══════════════════════════════════════════════════════════════
   error-handler.js — 全局错误处理
   ═══════════════════════════════════════════════════════════════ */

const ERROR_MESSAGES = {
  'LLM_API_KEY_NOT_CONFIGURED': '请先配置 DeepSeek API Key',
  'AI_TIMEOUT': 'AI 服务繁忙，请稍后重试',
  'AI_CALL_FAILED': '识别失败，请检查网络后重试',
  'NETWORK_UNAVAILABLE': '网络不可用，部分功能受限',
  'PE_UNAVAILABLE': '知识引擎暂不可用',
  'ALL_BACKENDS_FAILED': '所有 AI 服务暂不可用',
  'INVALID_FILE_TYPE': '请上传 JPG/PNG 格式图片',
  'FILE_TOO_LARGE': '文件过大，请压缩后上传',
  'INVALID_VIDEO_FORMAT': '请上传 MP4/MOV 格式视频',
  'RATE_LIMITED': '请求过于频繁，请稍后重试',
  'PARSE_ERROR': '数据解析失败',
  'MISSING_FIELDS': '请填写必填字段'
};

export function setupErrorHandler(app) {
  app.config.errorHandler = (err, vm, info) => {
    console.error('[Global Error]', err, info);
    uni.showToast({
      title: ERROR_MESSAGES[err.message] || '操作失败，请重试',
      icon: 'none',
      duration: 2000
    });
  };
}

export function getErrorMessage(code) {
  return ERROR_MESSAGES[code] || '未知错误';
}

export function handleApiError(error, fallbackMsg = '操作失败') {
  const msg = ERROR_MESSAGES[error.message] || error.message || fallbackMsg;
  uni.showToast({ title: msg, icon: 'none', duration: 2000 });
  return msg;
}
