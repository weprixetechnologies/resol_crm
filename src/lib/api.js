import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Create the Axios instance
export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach access token to every request
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Variables to handle concurrent refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle 401s and auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If it's a 401 error and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid intercepting the refresh route itself
      if (originalRequest.url.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until the refresh is complete
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = Cookies.get('refreshToken');

      if (!refreshToken) {
        // No refresh token available, must log out
        processQueue(new Error('No refresh token available'), null);
        Cookies.remove('accessToken');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        // Use a separate axios instance/request to bypass interceptors
        const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });

        const newAccessToken = res.data.data.accessToken;
        const newRefreshToken = res.data.data.refreshToken;

        Cookies.set('accessToken', newAccessToken, { expires: 1 });
        if (newRefreshToken) {
          Cookies.set('refreshToken', newRefreshToken, { expires: 7 });
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (err) {
        // Refresh token failed or is expired
        processQueue(err, null);
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Wrapper for existing fetchApi calls to avoid breaking the app
export async function fetchApi(endpoint, options = {}) {
  try {
    const axiosOptions = {
      method: options.method || 'GET',
      url: endpoint,
      headers: options.headers || {},
    };

    if (options.body) {
      // If it's a FormData object, Axios handles it.
      // If it's a JSON string, we need to parse it for Axios data field.
      if (options.body instanceof FormData) {
        axiosOptions.data = options.body;
        // Let Axios automatically set the Content-Type with the proper boundary
        axiosOptions.headers['Content-Type'] = undefined;
      } else {
        axiosOptions.data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      }
    }

    const response = await api.request(axiosOptions);
    return response.data;
  } catch (error) {
    if (error.response) {
      // Return structured error mimicking our previous native fetchApi
      return {
        success: false,
        error: {
          message: error.response.data?.error?.message || 'Server error',
          code: error.response.data?.error?.code
        }
      };
    }
    console.error('Axios Fetch Error:', error);
    return { success: false, error: { message: 'Network error or server is unreachable.' } };
  }
}
