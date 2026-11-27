// Owner: Member 1 (Frontend Developer)
// All HTTP calls to the Express API live here, so components never use fetch directly.
const API = import.meta.env.VITE_API_URL || '';
export const TOKEN_KEY = 'connectx_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

// "/uploads/abc.png" -> full URL that works in dev and in production
export const fileUrl = (path) => (!path ? null : /^https?:/.test(path) ? path : API + path);

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = form; // browser sets the multipart header itself
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(API + path, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // expired/invalid token on a protected call -> tell AuthContext to log out
    if (res.status === 401 && token) window.dispatchEvent(new Event('connectx:unauthorized'));
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  register: (username, email, password) =>
    request('/api/auth/register', { method: 'POST', body: { username, email, password } }),
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/api/users/me'),
  updateProfile: (patch) => request('/api/users/me', { method: 'PUT', body: patch }),
  searchUsers: (q) => request(`/api/users?q=${encodeURIComponent(q)}`),

  listConversations: () => request('/api/conversations'),
  createDirect: (userId) => request('/api/conversations/direct', { method: 'POST', body: { userId } }),
  createGroup: (name, memberIds) =>
    request('/api/conversations/group', { method: 'POST', body: { name, memberIds } }),
  getMessages: (conversationId, before) =>
    request(`/api/conversations/${conversationId}/messages?limit=30${before ? `&before=${before}` : ''}`),

  upload: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/api/upload', { method: 'POST', form });
  },
};
