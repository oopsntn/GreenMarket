# 🔧 Hướng Dẫn Kết Nối Android với Backend

## 📱 Bạn đang dùng: **Android Device**

### ✅ Step 1: Tìm IP Máy Chủ Backend

**Cách tìm IP máy của bạn (nơi chạy Backend):**

#### Windows:
```powershell
ipconfig
```
Tìm dòng `IPv4 Address` (thường là `192.168.x.x`)

#### Mac/Linux:
```bash
ifconfig
```
Tìm dòng `inet` (thường là `192.168.x.x`)

**Ví dụ kết quả:**
```
IPv4 Address . . . . . . . . . . . : 192.168.1.100
```

---

### ⚙️ Step 2: Cập Nhật File Config

**File cần sửa:** `mobile/src/config/api.js`

Đổi dòng này:
```javascript
const MACHINE_IP = "192.168.1.100"; // Change this to your machine IP
```

Thành IP của bạn. Ví dụ:
```javascript
const MACHINE_IP = "192.168.1.100"; // IP của máy chạy backend
```

---

### 🎯 Step 3: Chọn Loại Android Device

**Nếu dùng Android Emulator (AVD):**
```javascript
return DEV_API_URL; // Dùng này cho Emulator ✅
// return DEVICE_API_URL; // Dùng này cho Physical Device
```
(Đã mặc định, không cần thay đổi)

**Nếu dùng Physical Android Device:**
```javascript
// return DEV_API_URL; // Dùng này cho Emulator
return DEVICE_API_URL; // Dùng này cho Physical Device ✅
```

---

### 🔍 Step 4: Xác Minh Backend Đang Chạy

**Kiểm tra xem backend có trả lời không:**

```powershell
# Từ terminal của máy chạy backend
curl http://localhost:5000/api/auth/user/request-otp
```

**Nếu backend đang chạy, bạn sẽ thấy:**
```
HTTP 400 hoặc JSON response (không phải connection error)
```

---

### 📱 Step 5: Chạy Mobile App

```bash
cd mobile
npm start
# hoặc
npx expo start
```

Rồi chọn `a` để chạy trên Android Emulator hoặc scan QR code để chạy trên Physical Device.

---

### 🐛 Troubleshooting

| Vấn đề | Giải pháp |
|--------|----------|
| `Network request failed` | Kiểm tra IP máy backend còn chuẩn không (chạy `ipconfig`) |
| `Connection timeout` | Backend chưa chạy hoặc port 5000 bị chặn |
| `ERR_CLEARTEXT_NOT_PERMITTED` | Android P+ yêu cầu HTTPS. Tạm thời dùng emulator hoặc [xem hướng dẫn HTTP exemption](https://developer.android.com/training/articles/security-config) |
| Emulator vẫn không kết nối | Thử restart emulator hoặc sử dụng physical device |

---

### 💡 Tips

1. **Giữ terminal backend visible** - để xem realtime logs
2. **Backend port phải 5000** - kiểm tra file `.env` trong `back-end/`
3. **Firewall** - đảm bảo port 5000 không bị chặn
4. **Cùng WiFi** - Android device phải cùng mạng WiFi với máy backend

---

### ✨ Mọi thứ sẵn sàng!

Sau khi hoàn tất các bước trên, hãy test login trong app. Nếu vẫn có lỗi, share error message để tôi debug thêm.
