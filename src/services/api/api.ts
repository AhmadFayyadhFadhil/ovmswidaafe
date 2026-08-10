import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Sangat membantu jika backend Laravel menggunakan Laravel Sanctum cookie-based authentication
});

// Request interceptor to add authorization token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      if (config.headers) {
        if (typeof config.headers.delete === 'function') {
          config.headers.delete('Content-Type');
          config.headers.delete('content-type');
        }
        delete (config.headers as any)['Content-Type'];
        delete (config.headers as any)['content-type'];
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle global errors (e.g. 401 unauth)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/login')) {
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath && currentPath !== '/login') {
        sessionStorage.setItem('redirect_intent', currentPath);
      }
      localStorage.removeItem('token');
      localStorage.removeItem('auth_user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('auth_user');
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
    return Promise.reject(error);
  }
);
