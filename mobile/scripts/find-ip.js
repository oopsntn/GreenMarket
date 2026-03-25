#!/usr/bin/env node

/**
 * Script để tự động tìm IP WiFi và cập nhật vào .env.local
 * Chạy: node scripts/find-ip.js
 */

const os = require("os");
const fs = require("fs");
const path = require("path");

function getWiFiIP() {
  const interfaces = os.networkInterfaces();
  
  // Tìm IP từ các network interfaces
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // IPv4 và không phải internal/loopback
      if (iface.family === "IPv4" && !iface.internal) {
        // Ưu tiên WiFi/Ethernet interfaces
        if (name.includes("Wi-Fi") || name.includes("eth") || name.includes("en")) {
          return iface.address;
        }
      }
    }
  }
  
  // Fallback: lấy IP đầu tiên không phải loopback
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return null;
}

function updateEnvFile() {
  const ip = getWiFiIP();
  
  if (!ip) {
    console.error("❌ Lỗi: Không tìm được IP WiFi");
    process.exit(1);
  }
  
  const envPath = path.join(__dirname, "../.env.local");
  const envContent = `EXPO_PUBLIC_API_IP=${ip}\nEXPO_PUBLIC_API_PORT=5000\n`;
  
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Cập nhật IP WiFi thành công: ${ip}`);
  console.log(`📝 File: .env.local`);
  console.log(`🔗 API URL: http://${ip}:5000/api`);
}

updateEnvFile();
