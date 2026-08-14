import axios from 'axios';

const getDynamicBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const protocol = window.location.protocol; // 'http:' or 'https:'
    if (host.includes('ovmsdev')) {
      return `${protocol}//api.ovmsdev.widatra.com/api`;
    }
  }
  return import.meta.env.VITE_API_BASE_URL || 'https://api.ovms.widatra.com/api';
};

export const apiClient = axios.create({
  baseURL: getDynamicBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
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

// Response interceptor to handle global errors and auto-fix image URLs for dev environment
apiClient.interceptors.response.use(
  (response) => {
    if (response && response.data && typeof window !== 'undefined') {
      const host = window.location.hostname;
      const protocol = window.location.protocol;
      if (host.includes('ovmsdev')) {
        try {
          const str = JSON.stringify(response.data);
          if (str.includes('ovms.widatra.com') && !str.includes('ovmsdev.widatra.com')) {
            const targetDomain = `${protocol}//api.ovmsdev.widatra.com`;
            const fixedStr = str.replace(/https?:\/\/(api\.)?ovms\.widatra\.com/g, targetDomain);
            response.data = JSON.parse(fixedStr);
          }
        } catch (e) {
          // ignore
        }
      }
    }
    return response;
  },
  (error) => {
    const isUnauthenticated = error.response?.status === 401;
    const requestUrl = error.config?.url || '';
    const isLoginEndpoint = requestUrl.includes('/login');

    if (isUnauthenticated && !isLoginEndpoint) {
      // Do not kick user to login for background polling requests (e.g., notification badge polling)
      const isBackgroundPolling = requestUrl.includes('/notifications') || 
        requestUrl.includes('/public-stats') ||
        requestUrl.includes('/trip-purposes') ||
        requestUrl.includes('/destination-cities') ||
        requestUrl.includes('/departments');

      if (isBackgroundPolling) {
        return Promise.reject(error);
      }

      // Only redirect if we are not already on the login page
      const currentPath = window.location.pathname + window.location.search;
      if (window.location.pathname !== '/login') {
        sessionStorage.setItem('redirect_intent', currentPath);
        localStorage.removeItem('token');
        localStorage.removeItem('auth_user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('auth_user');
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    return Promise.reject(error);
  }
);
