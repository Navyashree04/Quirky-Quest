import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send the httpOnly refresh cookie automatically
});

// In-memory access token — not localStorage, to reduce XSS token-theft risk.
// Lives here (module scope) rather than in React state so the axios
// interceptors below can read/write it without importing React.
let accessToken = null;
let onAccessTokenChange = () => {};

export function setAccessToken(token) {
  accessToken = token;
  onAccessTokenChange(token);
}

export function getAccessToken() {
  return accessToken;
}

/** Lets AuthContext react when a token is refreshed behind its back. */
export function subscribeToTokenChanges(callback) {
  onAccessTokenChange = callback;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    const isExpired = response?.status === 401 && response?.data?.code === 'TOKEN_EXPIRED';
    const alreadyRetried = config?._retry;
    const isAuthRoute = config?.url?.startsWith('/auth/');

    if (!isExpired || alreadyRetried || isAuthRoute) {
      return Promise.reject(error);
    }

    config._retry = true;

    // Coalesce concurrent 401s into a single refresh call.
    if (!refreshPromise) {
      refreshPromise = api
        .post('/auth/refresh')
        .then((res) => {
          setAccessToken(res.data.accessToken);
          return res.data.accessToken;
        })
        .catch((refreshErr) => {
          setAccessToken(null);
          throw refreshErr;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const newToken = await refreshPromise;
      config.headers.Authorization = `Bearer ${newToken}`;
      return api(config);
    } catch (refreshErr) {
      return Promise.reject(refreshErr);
    }
  }
);

export default api;
