/**
 * API Configuration
 * 
 * ANDROID EMULATOR: http://10.0.2.2:5000/api
 * ANDROID DEVICE: http://<YOUR_MACHINE_IP>:5000/api (VD: http://192.168.1.100:5000/api)
 */

// Lấy IP từ environment variable (.env.local)
const getApiBaseUrl = () => {
  const API_IP = process.env.EXPO_PUBLIC_API_IP || "192.168.1.158";
  const API_PORT = process.env.EXPO_PUBLIC_API_PORT || "5000";
  
  const DEV_API_URL = `http://10.0.2.2:${API_PORT}/api`; // Android Emulator
  const DEVICE_API_URL = `http://${API_IP}:${API_PORT}/api`; // Physical Android Device

  // Thay đổi return tùy theo loại device kiểm tra:
  // return DEV_API_URL; // Dùng cho Android Emulator
  return DEVICE_API_URL; // Dùng cho Physical Device 
};

export const API_BASE_URL = getApiBaseUrl();

// Debug log to verify the URL being used
console.log("[API Config] Using API URL:", API_BASE_URL);
