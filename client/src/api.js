import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api`,
  withCredentials: true,
});

// Lets AuthContext react to an expired/revoked session.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const url = error.config?.url || '';
    const isAuthCheck = url.includes('/auth/login') || url.includes('/auth/me');
    if (error.response?.status === 401 && !isAuthCheck) onUnauthorized();
    return Promise.reject(error);
  }
);

// Turns an axios error into { message, fields } for forms.
export function parseError(error) {
  const data = error.response?.data;
  const fields = {};
  (data?.errors || []).forEach((e) => { if (e.field && !fields[e.field]) fields[e.field] = e.message; });
  const message = error.response
    ? data?.message || 'Request failed'
    : 'Cannot reach the server. Check your connection and try again.';
  return { message, fields };
}

export default api;
