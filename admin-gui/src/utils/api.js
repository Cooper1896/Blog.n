const API_BASE = '';

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export async function apiGet(url) {
  return handleResponse(await fetch(`${API_BASE}${url}`));
}

export async function apiPost(url, data) {
  return handleResponse(await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }));
}

export async function apiDelete(url) {
  return handleResponse(await fetch(`${API_BASE}${url}`, { method: 'DELETE' }));
}

export async function apiUpload(url, formData) {
  return handleResponse(await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    body: formData,
  }));
}

export function formatDate(date) {
  if (!date) return '未知';
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

export function formatDateTime(date) {
  if (!date) return '未知';
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatWordCount(count) {
  if (count >= 10000) return (count / 10000).toFixed(1) + ' 万';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
  return count.toString();
}

export function timeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diff = (now - d) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
  if (diff < 2592000) return Math.floor(diff / 86400) + ' 天前';
  return formatDate(date);
}

export function readingTime(wordCount) {
  const minutes = Math.ceil(wordCount / 400);
  return minutes < 1 ? '不到 1 分钟' : `${minutes} 分钟`;
}
