/**
 * API Configuration
 *
 * ANDROID EMULATOR: http://10.0.2.2:5000/api
 * ANDROID DEVICE: http://<YOUR_MACHINE_IP>:5000/api (VD: http://192.168.1.100:5000/api)
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Lấy IP từ environment variable (.env.local)
const getApiBaseUrl = () => {
  const API_IP = process.env.EXPO_PUBLIC_API_IP || "192.168.1.3";
  const API_PORT = process.env.EXPO_PUBLIC_API_PORT || "5000";

  const DEV_API_URL = `http://10.0.2.2:${API_PORT}/api`; // Android Emulator
  const DEVICE_API_URL = `http://${API_IP}:${API_PORT}/api`; // Physical Android Device

  // Thay đổi return tùy theo loại device kiểm tra:
  // return DEV_API_URL; // Dùng cho Android Emulator
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
    if (error.response?.status === 401) {
      // Xử lý lỗi 401 Unauthorized (ví dụ: token hết hạn)
      await AsyncStorage.removeItem('token')
      // Có thể thêm logic chuyển hướng người dùng đến màn hình đăng nhập nếu cần

    }
    return Promise.reject(error)
  }

)

