import axios from 'axios';
import type { AxiosResponse } from 'axios';

// ============ Mock 开关 ============
export const USE_MOCK = true;  // true → Mock 模式，false → 真实接口
// ====================================

const REAL_BASE_URL = USE_MOCK ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080');

// 统一响应格式
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// Mock 数据存储器
const mockDb: Record<string, any> = {};

// Mock 延迟
const mockDelay = (ms: number = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock 响应包装器
const mockSuccess = <T>(data: T): ApiResponse<T> => ({
  code: 200,
  message: 'success',
  data,
});

// Mock 失败响应
const mockError = (message: string) => ({
  code: 400,
  message,
  data: null,
});

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: REAL_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============ 请求拦截器 ============
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (!USE_MOCK) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============ 响应拦截器 ============
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    if (!USE_MOCK) {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }
    
    if (response.data?.code === 200) {
      return response.data.data;
    }
    
    return Promise.reject(new Error(response.data?.message || '请求失败'));
  },
  (error) => {
    console.error(`[API Error]`, error);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    
    const message = error.response?.data?.message || error.message || '网络请求失败';
    return Promise.reject(new Error(message));
  }
);

// ============ 导出 ============
export { mockDelay, mockSuccess, mockError, mockDb };

export default apiClient;