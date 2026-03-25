/**
 * API Configuration
 * 
 * ANDROID EMULATOR: http://10.0.2.2:5000/api
 * ANDROID DEVICE: http://<YOUR_MACHINE_IP>:5000/api (VD: http://192.168.1.100:5000/api)
 */

// Detect environment
const getApiBaseUrl = () => {
  // Thay đổi IP này thành IP của máy chạy backend
  // Để tìm IP, mở cmd/terminal và chạy: ipconfig (Windows) hoặc ifconfig (Mac/Linux)
  const MACHINE_IP = "192.168.1.6"; // Change this to your machine IP
  const DEV_API_URL = `http://10.0.2.2:5000/api`; // Android Emulator
  const DEVICE_API_URL = `http://${MACHINE_IP}:5000/api`; // Physical Android Device

  // Bạn có thể comment/uncomment dòng dưới tùy theo loại device test
  // return DEV_API_URL; // Dùng này cho Emulator
  return DEVICE_API_URL; // Dùng này cho Physical Device 
};

export const API_BASE_URL = getApiBaseUrl();

// Debug log to verify the URL being used
console.log("[API Config] Using API URL:", API_BASE_URL);
