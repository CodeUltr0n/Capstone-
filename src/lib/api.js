async function request(path, options = {}) {
  const token = window.sessionStorage.getItem('orchestrator_api_token');
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.detail || body.error || `API request failed (${response.status})`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
  return body;
}

export const api = {
  health: () => request('/health'),
  listServers: () => request('/servers'),
  addServer: (server) => request('/servers', { method: 'POST', body: JSON.stringify(server) }),
  deleteServer: (id) => request(`/servers/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  pingServer: (id) => request(`/servers/${encodeURIComponent(id)}/ping`, { method: 'POST' }),
  chat: (message, options = {}) => request('/chat', { method: 'POST', body: JSON.stringify({ message, ...options }) }),
  listHistory: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.set(key, value);
    });
    const query = params.toString();
    return request(`/history${query ? `?${query}` : ''}`);
  },
  clearHistory: () => request('/history', { method: 'DELETE' }),
};

export function formatHistoryItem(item) {
  const time = item.created_at ? new Date(item.created_at) : null;
  const age = time ? Math.max(0, Math.floor((Date.now() - time.getTime()) / 60000)) : 0;
  return {
    ...item,
    latency: `${item.latency_ms ?? 0}ms`,
    confidence: `${item.confidence ?? 0}%`,
    timeAgo: age < 1 ? 'Just now' : `${age} min${age === 1 ? '' : 's'} ago`,
  };
}
