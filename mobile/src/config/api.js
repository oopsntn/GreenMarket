
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

let unauthorizedHandler = null;
let isHandlingUnauthorized = false;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;
};

// Lấy IP từ environment variable (.env.local)
const getApiBaseUrl = () => {
  const API_IP = process.env.EXPO_PUBLIC_API_IP || "14.170.9.64";
  const API_PORT = process.env.EXPO_PUBLIC_API_PORT || "5000";

  const DEV_API_URL = `http://10.0.2.2:${API_PORT}/api`; // Android Emulator
  const DEVICE_API_URL = `http://${API_IP}:${API_PORT}/api`; // Physical Android Device

  return DEVICE_API_URL; // Dùng cho Physical Device
};

export const API_BASE_URL = getApiBaseUrl();

// Extract base server URL (without /api) for images and uploads
export const getServerBaseUrl = () => {
  // Extract base URL from API_BASE_URL (remove /api suffix)
  return API_BASE_URL.replace(/\/api\s*$/, '');
};

// Debug log to verify the URL being used
console.log("[API Config] Using API URL:", API_BASE_URL);
console.log("[API Config] Server Base URL:", getServerBaseUrl());

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": 'application/json'
  },
  timeout: 10000,
})

/*/ Thêm interceptor để tự động thêm token vào header nếu có*/
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
    delete config.headers['content-type']
  }

  return config
})

/* Thêm interceptor để xử lý lỗi phản hồi từ server */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true
      try {
        if (unauthorizedHandler) {
          await Promise.resolve(unauthorizedHandler(error))
        } else {
          await AsyncStorage.multiRemove(['token', 'user'])
        }
      } catch (handlerError) {
        console.error('[API] Unauthorized handler error:', handlerError)
        await AsyncStorage.multiRemove(['token', 'user'])
      } finally {
        isHandlingUnauthorized = false
      }
    }
    return Promise.reject(error)
  }

)

