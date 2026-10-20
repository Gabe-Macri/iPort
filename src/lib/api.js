/**
 * API client for iPort backend
 */

export async function request(path, options = {}) {
  const token = localStorage.getItem('iport_token') || '';
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(path, { ...options, headers });

  if (res.status === 401) {
    const error = new Error('UNAUTHORIZED');
    error.status = 401;
    throw error;
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    const error = new Error(errorData.error || 'Request failed');
    error.status = res.status;
    throw error;
  }

  return res.json();
}

export const api = {
  getStatus: () => request('/api/status'),
  login: (pin) =>
    request('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ pin })
    }),
  getChats: () => request('/api/chats'),
  getMessages: (chatId, limit = 60, before = null) => {
    const params = new URLSearchParams({ limit });
    if (before) params.append('before', before);
    return request(`/api/chats/${encodeURIComponent(chatId)}/messages?${params.toString()}`);
  },
  sendMessage: ({ chatId, guid, recipient, text, service }) =>
    request('/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({ chatId, guid, recipient, text, service })
    }),
  togglePinChat: (chatId) =>
    request(`/api/chats/${encodeURIComponent(chatId)}/pin`, {
      method: 'POST'
    })
};

