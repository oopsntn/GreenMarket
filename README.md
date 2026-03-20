# GreenMarket 🌿

GreenMarket - Chợ điện tử cho người đam mê cây cảnh.

## 🏗 Cấu trúc Dự Án

- `admin-web/`: Dashboard quản trị (React + TypeScript + Vite).
- `user-web/`: Giao diện người dùng (React + TypeScript + Vite).
- `back-end/`: API Server (Node.js Express + TypeScript + Drizzle ORM).
- `GreenMarket.sql`: File backup database chuẩn với dữ liệu mẫu (Sanh, Tùng, v.v.).

## 🚀 Hướng dẫn khởi chạy nhanh (Dành cho Frontend Team)

Nếu bạn chỉ muốn chạy Backend + Database để làm Frontend, hãy làm theo các bước sau:

1. **Yêu cầu**: Đã cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. **Khởi chạy toàn bộ hệ thống**:
   ```bash
   docker compose up -d --build
   ```
3. **Lưu ý quan trọng (Cập nhật dữ liệu mới nhất)**:
   Để đảm bảo Database luôn có dữ liệu mới nhất từ file `GreenMarket.sql` (xóa dữ liệu cũ, nạp lại từ đầu), hãy dùng lệnh:
   ```bash
   docker compose down -v && docker compose up -d --build
   ```
   *(Tham số `-v` sẽ xóa volume cũ để Docker nạp lại file SQL mới).*

- **API URL:** `http://localhost:5000`
- **Database Port:** `5433` (User: `postgres` | Pass: `admin` | DB: `greenmarket`)

---

## 💻 Hướng dẫn Phát triển (Chạy thủ công)

Dự án sử dụng **pnpm**. Nếu chưa có, hãy cài đặt bằng `npm install -g pnpm`.

### 🎨 Phát triển Frontend (`admin-web` hoặc `user-web`)
1. Di chuyển vào thư mục: `cd admin-web` (hoặc `user-web`)
2. Cài đặt thư viện: `pnpm install`
3. Chạy dev: `pnpm dev`
   - Admin: `http://localhost:5173`
   - User: `http://localhost:5174` (Tùy cấu hình port)

### ⚙️ Phát triển Backend (`back-end`)
1. Di chuyển vào thư mục: `cd back-end`
2. Thiết lập môi trường:
   - Copy `.env.example` thành `.env`.
   - Cập nhật `DATABASE_URL`:
     ```env
     PORT=5000
     DATABASE_URL=postgresql://postgres:admin@localhost:5433/greenmarket
     ```
3. Cài đặt thư viện: `pnpm install`
4. Cập nhật database schema (nếu có thay đổi code):
   ```bash
   pnpm db:push
   ```
5. Chạy dev: `pnpm dev`

---

## 🛠 Lệnh hữu ích

| Lệnh | Mô tả |
|---------|-------------|
| `pnpm build` | Build production |
| `pnpm lint` | Kiểm tra lỗi code (ESLint) |
| `pnpm db:generate` | Tạo file migration từ schema |
| `pnpm db:push` | Đẩy trực tiếp schema vào DB |
| `docker-compose logs -f` | Xem log của hệ thống Docker |

---
*Chúc team làm việc hiệu quả! 🚀*

