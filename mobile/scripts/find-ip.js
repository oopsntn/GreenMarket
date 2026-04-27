#!/usr/bin/env node

/**
 * Script để cập nhật API host cố định vào .env.local
 * Chạy: node scripts/find-ip.js
 */

const fs = require("fs");
const path = require("path");

const API_HOST = process.env.EXPO_PUBLIC_API_HOST || "greenmarket.ddns.net";
const API_PORT = process.env.EXPO_PUBLIC_API_PORT || "5000";
const API_SCHEME = process.env.EXPO_PUBLIC_API_SCHEME || "http";

function updateEnvFile() {
  const envPath = path.join(__dirname, "../.env.local");
  const envContent = [
    `EXPO_PUBLIC_API_HOST=${API_HOST}`,
    `EXPO_PUBLIC_API_PORT=${API_PORT}`,
    `EXPO_PUBLIC_API_SCHEME=${API_SCHEME}`,
    "",
  ].join("\n");

  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Cập nhật API host thành công: ${API_HOST}`);
  console.log(`📝 File: .env.local`);
  console.log(`🔗 API URL: ${API_SCHEME}://${API_HOST}:${API_PORT}/api`);
}

updateEnvFile();
