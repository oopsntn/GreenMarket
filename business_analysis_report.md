# GreenMarket - Phân Tích Nghiệp Vụ & So Sánh Report 1-2-3

> Ngày phân tích: 2026-04-15
> Phạm vi: Database (GreenMarket.sql) → Backend Code → Report 1/2/3

---

## I. Tổng quan hiện trạng hệ thống

### 1.1 Database Schema (GreenMarket.sql)

| Thành phần | Số lượng |
|---|---|
| **Tables** | 38 bảng + 1 View |
| **Trigger Functions** | 9 functions |
| **Triggers** | 11 triggers |
| **Indexes** | ~60 indexes |
| **Seed Data** | Users, Shops, Posts, Categories, Attributes, Promotions, Jobs, etc. |

#### Danh sách 38 bảng theo nhóm nghiệp vụ:

| Nhóm | Bảng |
|---|---|
| **Auth & Users** | `users`, `admins`, `roles`, `admin_roles`, `business_roles`, `qr_sessions`, `otp_requests`, `verifications` |
| **Shop** | `shops`, `blocked_shops` |
| **Post** | `posts`, `post_images`, `post_videos`, `post_categories`, `post_attribute_values`, `post_meta`, `favorite_posts` |
| **Category & Attribute** | `categories`, `attributes`, `category_attributes` |
| **Report & Moderation** | `reports`, `report_evidence`, `moderation_actions`, `moderation_feedback`, `escalations` |
| **Promotion & Payment** | `placement_slots`, `promotion_packages`, `promotion_package_prices`, `promotion_package_audit_log`, `post_promotions`, `payment_txn` |
| **Posting Plans** | `user_posting_plans`, `posting_fee_ledger` |
| **Analytics** | `daily_placement_metrics`, `trend_scores`, `ai_insights`, `event_logs` |
| **Collaborator** | `jobs`, `job_contact_requests`, `job_deliverables`, `earning_entries`, `payout_requests` |
| **Host** | `host_contents`, `host_earnings`, `host_payout_requests` |
| **Operations** | `operation_tasks`, `task_replies` |
| **System** | `system_settings`, `admin_system_settings`, `admin_templates`, `system_notifications`, `banned_keywords` |

### 1.2 Backend Code (back-end/src/)

#### User-side Controllers (13 file):
| Controller | Nghiệp vụ |
|---|---|
| `auth.controller.ts` | OTP login/register/logout |
| `profile.controller.ts` | View/Edit profile |
| `shop.controller.ts` | CRUD Shop, search, statistics |
| `post.controller.ts` | CRUD Posts, submit, trash, restore |
| `category.controller.ts` | Browse categories |
| `report.controller.ts` | Submit reports |
| `payment.controller.ts` | VNPay/MoMo payment flow |
| `promotion.controller.ts` | View/purchase promotion packages |
| `pricing-config.controller.ts` | Posting plan pricing |
| `collaborator.controller.ts` | Jobs, earnings, payouts |
| `host.controller.ts` | Host contents, earnings, payouts |
| `manager.controller.ts` | Moderation queue, reports, feedback, escalation |
| `operations.controller.ts` | Operation tasks, replies, notifications |
| `qrAuth.controller.ts` | QR code login for web |

#### Admin-side Controllers (23 file):
| Controller | Nghiệp vụ |
|---|---|
| `user.controller.ts` | User management (list, lock, unlock) |
| `role.controller.ts` | Role assignment |
| `shop.controller.ts` | Shop management |
| `post.controller.ts` | Post management |
| `category.controller.ts` | Category CRUD |
| `attribute.controller.ts` | Attribute CRUD |
| `category-mapping.controller.ts` | Category-Attribute mapping |
| `template.controller.ts` | Admin templates |
| `template-builder.controller.ts` | Template builder config |
| `settings.controller.ts` | System settings |
| `report.controller.ts` | Report management |
| `placement-slot.controller.ts` | Placement slot management |
| `promotion-package.controller.ts` | Promotion package CRUD + pricing |
| `promotion.controller.ts` | Promotion list/enforce |
| `boosted-post.controller.ts` | Boosted post management |
| `dashboard.controller.ts` | Admin dashboard KPIs |
| `analytics.controller.ts` | Placement analytics |
| `revenue.controller.ts` | Revenue summary |
| `customer-spending.controller.ts` | Customer spending report |
| `export.controller.ts` | CSV export |
| `activity-log.controller.ts` | Activity/event log |
| `ai-insight.controller.ts` | AI insight generation/history |
| `business-role.controller.ts` | Business role management |

#### Services (13 file):
`payment.service.ts`, `post.service.ts`, `posting-policy.service.ts`, `adminPromotion.service.ts`, `adminReporting.service.ts`, `adminPlacementSlotCatalog.service.ts`, `adminConfigStore.service.ts`, `geminiAI.service.ts`, `email.service.ts`, `verification.service.ts`, `storage.service.ts`, `owner-dashboard.service.ts`, `promotionScheduler.ts`

#### Schema Models: **53 files** (đầy đủ cho 38 bảng)

### 1.3 Frontend

| Platform | Tech | Trạng thái |
|---|---|---|
| **Mobile App** | React Native/Expo | ✅ Có code |
| **User Web** | React (Vite) | ✅ Có code |
| **Admin Web** | React (Vite) | ✅ Có code |

---

## II. Tổng quan Report 1-2-3

| Report | Nội dung chính | Trạng thái |
|---|---|---|
| **Report 1** | Project Introduction, Stakeholders, Major Features (FE-01→FE-21), Limitations | Cơ bản đầy đủ |
| **Report 2** | Project Management Plan, WBS, RACI, Training, Tools | Cơ bản đầy đủ |
| **Report 3** | SRS - 129 Use Cases (UC01→UC129), Functional Requirements, Non-Functional Requirements, Business Rules | Rất chi tiết |

---

## III. SO SÁNH CHI TIẾT: Code/DB vs Report 1-2-3

### 3.1 Report 1 - Major Features (FE-xx) vs Hiện trạng

| Feature ID | Mô tả Report 1 | DB | Backend | Frontend | Trạng thái |
|---|---|---|---|---|---|
| FE-01 | OTP-based authentication + RBAC | ✅ `otp_requests`, `verifications`, `users`, `roles`, `business_roles` | ✅ `auth.controller` | ✅ Mobile + Web | ✅ **ĐÃ TRIỂN KHAI** |
| FE-02 | Browse posts by categories, view feed | ✅ `posts`, `categories`, `post_categories` | ✅ `post.controller` | ✅ | ✅ **ĐÃ TRIỂN KHAI** |
| FE-03 | Search, filter, sort by structured attributes | ✅ `post_attribute_values`, indexes | ✅ `post.controller` | ✅ | ✅ **ĐÃ TRIỂN KHAI** |
| FE-04 | View post details, contact seller | ✅ `posts.post_contact_phone` | ✅ | ✅ | ✅ **ĐÃ TRIỂN KHAI** |
| FE-05 | Shop management | ✅ `shops` | ✅ `shop.controller` | ✅ | ✅ **ĐÃ TRIỂN KHAI** |
| FE-06 | Post management (CRUD, trash, restore) | ✅ `posts`, `post_images`, `post_videos` | ✅ `post.controller` | ✅ | ✅ **ĐÃ TRIỂN KHAI** |
| FE-07 | Favorites management | ✅ `favorite_posts` | ✅ `post.controller` (favorites) | ✅ | ✅ **ĐÃ TRIỂN KHAI** |
| FE-08 | Reporting mechanism | ✅ `reports`, `report_evidence` | ✅ `report.controller` | ✅ | ✅ **ĐÃ TRIỂN KHAI** |
| FE-09 | Moderation workflow (Manager) | ✅ `moderation_actions`, `moderation_feedback` | ✅ `manager.controller` | ✅ Mobile | ✅ **ĐÃ TRIỂN KHAI** |
| FE-10 | Taxonomy & attribute management (Admin) | ✅ `categories`, `attributes`, `category_attributes` | ✅ Admin controllers | ✅ Admin Web | ✅ **ĐÃ TRIỂN KHAI** |
| FE-11 | Template/Reason configuration (Admin) | ✅ `admin_templates` | ✅ `template.controller` | ✅ Admin Web | ✅ **ĐÃ TRIỂN KHAI** |
| FE-12 | Analytics & export (Admin) | ✅ `daily_placement_metrics`, `event_logs` | ✅ `analytics`, `dashboard`, `export` controllers | ✅ Admin Web | ✅ **ĐÃ TRIỂN KHAI** |
| FE-13 | Placement-based promotion packages | ✅ `placement_slots`, `promotion_packages`, `promotion_package_prices`, `post_promotions` | ✅ `promotion.controller`, `payment.controller` | ✅ | ✅ **ĐÃ TRIỂN KHAI** |
| FE-14 | Engagement analytics + AI recommendations | ✅ `trend_scores`, `ai_insights` | ✅ `ai-insight.controller`, `geminiAI.service` | ✅ Admin Web | ✅ **ĐÃ TRIỂN KHAI** |
| FE-15 | Payment demo (MoMo Sandbox) | ✅ `payment_txn` | ✅ `payment.controller` | ✅ | ⚠️ **ĐÃ CHUYỂN SANG VNPay** (Report ghi MoMo) |
| FE-16 | Host module | ✅ `host_contents`, `host_earnings`, `host_payout_requests` | ✅ `host.controller` | ✅ Mobile | ✅ **ĐÃ TRIỂN KHAI** |
| FE-17 | Collaborator service module | ✅ `jobs`, `job_contact_requests`, `job_deliverables`, `earning_entries`, `payout_requests` | ✅ `collaborator.controller` | ✅ Mobile | ✅ **ĐÃ TRIỂN KHAI** |
| FE-18 | Operations Staff module | ✅ `operation_tasks`, `task_replies`, `escalations`, `system_notifications` | ✅ `operations.controller` | ✅ Mobile | ✅ **ĐÃ TRIỂN KHAI** |
| FE-19 | Web Client Portal | — | ✅ shared API | ✅ `user-web` | ✅ **ĐÃ TRIỂN KHAI** |
| FE-20 | Rating and Review Management | ❌ **KHÔNG CÓ BẢNG** | ❌ **KHÔNG CÓ API** | ❌ | ❌ **CHƯA TRIỂN KHAI** |
| FE-21 | Point & Loyalty System | ❌ **KHÔNG CÓ BẢNG** | ❌ **KHÔNG CÓ API** | ❌ | ❌ **CHƯA TRIỂN KHAI** |

### 3.2 Report 3 - Use Cases (UC) vs Hiện trạng Code

#### App-based UCs (UC01-UC67)

| UC | Mô tả | DB | API | Status |
|---|---|---|---|---|
| UC01-03 | Auth (Register/Login/Logout) | ✅ | ✅ | ✅ Đã triển khai |
| UC04-05 | Profile (View/Edit) | ✅ | ✅ | ✅ Đã triển khai |
| UC06-11 | Shop Management (6 UCs) | ✅ | ✅ | ✅ Đã triển khai |
| UC12-24 | Post Management (13 UCs) | ✅ | ✅ | ✅ Đã triển khai |
| UC25-28 | Favorite Management (4 UCs) | ✅ | ✅ | ✅ Đã triển khai |
| UC29-33 | Reports Management (5 UCs) | ✅ | ✅ | ✅ Đã triển khai |
| UC34-35 | Block/Unblock Shop | ✅ `blocked_shops` | ✅ | ✅ Đã triển khai |
| UC36-42 | Moderation Management (7 UCs) | ✅ | ✅ `manager.controller` | ✅ Đã triển khai |
| UC43-47 | Operations Staff (5 UCs) | ✅ | ✅ `operations.controller` | ✅ Đã triển khai |
| UC48-52 | Collaborator (5 UCs) | ✅ | ✅ `collaborator.controller` | ✅ Đã triển khai |
| UC53-56 | Host Management (4 UCs) | ✅ | ✅ `host.controller` | ✅ Đã triển khai |
| UC57-62 | Promotion & Placement (6 UCs) | ✅ | ✅ `promotion.controller`, `payment.controller` | ✅ Đã triển khai |
| UC63-65 | Analytics (3 UCs) | ✅ | ✅ | ⚠️ Một phần (post/shop analytics có, "best time to post" chưa rõ) |
| UC66-67 | AI-assisted Insights (2 UCs) | ✅ `ai_insights` | ✅ `geminiAI.service` | ✅ Đã triển khai |

#### Web Admin UCs (UC68-UC103)

| UC | Mô tả | DB | API | Status |
|---|---|---|---|---|
| UC68-75 | Category & Attribute (8 UCs) | ✅ | ✅ Admin controllers | ✅ Đã triển khai |
| UC76-79 | System Settings (4 UCs) | ✅ | ✅ `settings.controller` | ✅ Đã triển khai |
| UC80-85 | Account Management (6 UCs) | ✅ | ✅ `user.controller`, `role.controller` | ✅ Đã triển khai |
| UC86-89 | System Utilities (4 UCs) | ✅ `system_notifications` | ⚠️ Partial | ⚠️ Notifications yes, nhưng UC88 (manage notification settings) và UC89 (submit feedback) chưa rõ API riêng |
| UC90-91 | Dashboard & Export (2 UCs) | ✅ | ✅ `dashboard.controller`, `export.controller` | ✅ Đã triển khai |
| UC92-95 | Promotion Admin (4 UCs) | ✅ | ✅ `placement-slot.controller`, `promotion-package.controller`, `promotion.controller`, `boosted-post.controller` | ✅ Đã triển khai |
| UC96-97 | Analytics Dashboard (2 UCs) | ✅ `daily_placement_metrics`, `trend_scores` | ✅ `analytics.controller` | ✅ Đã triển khai |
| UC99-100 | AI Insights (2 UCs) | ✅ | ✅ `ai-insight.controller` | ✅ Đã triển khai |
| UC101-103 | Financial Analytics (3 UCs) | ✅ `payment_txn` | ✅ `revenue.controller`, `customer-spending.controller`, `export.controller` | ✅ Đã triển khai |

#### Web Client UCs (UC104-UC129)

| UC | Mô tả | DB | API | Status |
|---|---|---|---|---|
| UC104-107 | Rating & Review (4 UCs) | ❌ **KHÔNG CÓ BẢNG** | ❌ **KHÔNG CÓ API** | ❌ **CHƯA TRIỂN KHAI** |
| UC108-111 | Point & Loyalty (4 UCs) | ❌ **KHÔNG CÓ BẢNG** | ❌ **KHÔNG CÓ API** | ❌ **CHƯA TRIỂN KHAI** |
| UC112-114 | News Hub (3 UCs) | ❌ Chưa có bảng `news_articles` | ❌ Chưa có API riêng | ❌ **CHƯA TRIỂN KHAI** (có thể tận dụng Host Contents) |
| UC115-116 | Web Auth & Profile (2 UCs) | ✅ | ✅ QR login + profile API | ✅ Đã triển khai |
| UC117-119 | Web Marketplace Discovery (3 UCs) | ✅ | ✅ Shared API | ✅ Đã triển khai (dùng chung API mobile) |
| UC120-123 | Web Seller Workspace (4 UCs) | ✅ | ✅ | ⚠️ Phần lớn dùng chung API, nhưng "bulk upload" (UC122) chưa có API riêng |
| UC124-126 | Web User Interactions (3 UCs) | ✅ (trừ rating) | ✅ (trừ rating) | ⚠️ Favorites + Reports OK, Rating chưa có |
| UC127-129 | Web Promotion & Points (3 UCs) | ⚠️ Promotion OK, Points ❌ | ⚠️ Promotion OK, Points ❌ | ⚠️ Promotion OK, Points chưa triển khai |

---

## IV. CÁC KHÁC BIỆT CHÍNH CẦN CẬP NHẬT REPORT

### 4.1 🔴 Report 1 - Cần thay đổi/bổ sung

| # | Mục | Vấn đề | Hành động cần làm |
|---|---|---|---|
| 1 | **FE-15** (Payment) | Report ghi "MoMo Sandbox" nhưng code thực tế đã **chuyển sang VNPay Sandbox** + có Mock Mode | **SỬA**: Cập nhật "MoMo Sandbox" → "VNPay Sandbox (và Mock Mode cho testing)" |
| 2 | **FE-20** (Rating & Review) | Report liệt kê feature này nhưng **DB không có bảng**, **API không có** | **GHI CHÚ**: Chuyển thành "Optional/Future" hoặc **XÓA** nếu không kịp triển khai, hoặc **BỔ SUNG** bảng + API |
| 3 | **FE-21** (Point & Loyalty) | Report liệt kê feature nhưng **hoàn toàn chưa triển khai** | **GHI CHÚ**: Chuyển thành "Optional/Future" hoặc **XÓA** |
| 4 | **Technology Stack** | Report ghi "NodeJS + Express + Prisma ORM" nhưng code thực tế dùng **Drizzle ORM** (xem SQL header + schema files) | **SỬA**: "Prisma ORM" → "Drizzle ORM" |
| 5 | **LI-1** (Limitations) | Report ghi "MoMo sandbox for demo" | **SỬA**: → "VNPay sandbox + Mock Mode for demo" |
| 6 | **Software type** | Report ghi "Mobile Application (User-side) & Web Portal (User-side) + Web Portal (Admin-side)" | **BỔ SUNG**: Thêm "QR Code Login for Web Client" vì đã có `qr_sessions` table + `qrAuth.controller` |
| 7 | **Bổ sung feature mới** | Code có nhưng Report 1 chưa ghi | **BỔ SUNG** các features: `user_posting_plans` (Posting Plan/Policy), `posting_fee_ledger` (Fee tracking), `post_videos` (Video support), Shop email verification, Shop VIP system, `promotion_package_prices` (Dynamic pricing), `promotion_package_audit_log` (Audit trail) |

### 4.2 🟡 Report 2 - Cần thay đổi/bổ sung

| # | Mục | Vấn đề | Hành động cần làm |
|---|---|---|---|
| 1 | **Tools & Infrastructure - ORM** | Report ghi "Prisma" | **SỬA**: → "Drizzle ORM" |
| 2 | **Payment** | Report ghi "MoMo Sandbox (Mock)" | **SỬA**: → "VNPay Sandbox (Mock) + Mock Gate Mode" |
| 3 | **Deployment** | Report ghi "VPS/Render/Fly.io (demo)" | **SỬA**: → "Docker Compose + VPS", vì code có `docker-compose.yml` + `docker-compose.prod.yml` + `Dockerfile` |
| 4 | **Iteration 3 (4.3.5)** | "Implement Rating & Review and Loyalty System API" chỉ ước lượng 1 person-day, thực tế **chưa triển khai** | **SỬA**: Ghi rõ "Not implemented" hoặc **xóa** khỏi plan và ghi nhận vào báo cáo cuối |
| 5 | **Testing** | Report ghi "Jest (backend)" | **KIỂM TRA**: Có test scripts trong `back-end/src/scripts/` nhưng không rõ có dùng Jest chính thức không |
| 6 | **Bổ sung** | QR Login, Business Roles system, Posting Plans/Fee Ledger chưa được ghi trong WBS | **BỔ SUNG** vào iteration phù hợp |

### 4.3 🔴 Report 3 (SRS) - Cần thay đổi/bổ sung

#### A. USE CASES CẦN BỔ SUNG (có trong code nhưng thiếu trong Report)

| # | UC mới đề xuất | Mô tả | Cơ sở (Code/DB) |
|---|---|---|---|
| 1 | **UC-NEW-01**: QR Code Web Login | User scan QR từ Mobile App để đăng nhập Web Client | `qr_sessions` table + `qrAuth.controller.ts` |
| 2 | **UC-NEW-02**: Manage Posting Plans | Admin cấu hình Posting Plan (Owner Lifetime, Personal Monthly) | `user_posting_plans`, `posting_fee_ledger`, `posting-policy.service.ts` |
| 3 | **UC-NEW-03**: View/Purchase Posting Plan | User mua/kích hoạt gói đăng tin | `user_posting_plans`, `payment.controller.ts` |
| 4 | **UC-NEW-04**: Track Posting Fees | Hệ thống ghi nhận phí đăng/sửa tin theo plan | `posting_fee_ledger` |
| 5 | **UC-NEW-05**: Manage Promotion Package Pricing | Admin quản lý lịch sử & lên lịch giá gói quảng cáo | `promotion_package_prices`, `promotion_package_audit_log`, `promotion-package.controller.ts` |
| 6 | **UC-NEW-06**: Upload Post Video | User tải video cho bài đăng | `post_videos` table |
| 7 | **UC-NEW-07**: Verify Shop Email | Shop owner xác minh email qua OTP | `verifications`, `shops.shop_email_verified`, `verification.service.ts` |
| 8 | **UC-NEW-08**: Manage Business Roles | Admin quản lý business roles cho user | `business_roles`, `business-role.controller.ts` |
| 9 | **UC-NEW-09**: Shop VIP Package | User mua gói VIP cho shop | `shops.shop_vip_started_at`, `shop_vip_expires_at`, `promotion_packages (id=3)` |
| 10 | **UC-NEW-10**: Owner Dashboard | Shop owner xem dashboard doanh thu/hiệu suất | `owner-dashboard.service.ts` |

#### B. USE CASES TRONG REPORT NHƯNG CHƯA TRIỂN KHAI

| UC | Mô tả | Đề xuất |
|---|---|---|
| UC104 | Rate and review a shop | ❌ Cần tạo bảng `shop_reviews` hoặc **chuyển sang Optional** |
| UC105 | Reply to customer reviews | ❌ Cần tạo bảng hoặc **chuyển sang Optional** |
| UC106 | View shop average rating | ❌ Cần tạo bảng hoặc **chuyển sang Optional** |
| UC107 | Report a fake/abusive review | ❌ Cần tạo bảng hoặc **chuyển sang Optional** |
| UC108 | View reward points balance | ❌ Cần tạo bảng `user_points` hoặc **chuyển sang Optional** |
| UC109 | Earn points via purchases | ❌ Cần tạo bảng hoặc **chuyển sang Optional** |
| UC110 | Redeem points for promotion packages | ❌ Cần tạo bảng hoặc **chuyển sang Optional** |
| UC111 | View point transaction history | ❌ Cần tạo bảng hoặc **chuyển sang Optional** |
| UC112 | Browse and read news articles | ❌ Chưa có bảng `news_articles` riêng (có thể tận dụng `host_contents`) |
| UC113 | Search news by keywords | ❌ Tương tự UC112 |
| UC114 | Share news to social platforms | ❌ Chưa có API riêng |
| UC122 | Bulk upload and manage post images | ⚠️ Có upload single image, chưa có bulk upload API |
| UC129 | View point balance and loyalty on Web | ❌ Chưa triển khai |

#### C. THÔNG TIN SAI LỆCH TRONG REPORT 3 CẦN SỬA

| # | Vấn đề | Vị trí | Sửa |
|---|---|---|---|
| 1 | **Actors** - "Payment Gateway (Momo sandbox)" | Section 1.3.1, Actor #8 | **SỬA** → "Payment Gateway (VNPay sandbox + Mock Mode)" |
| 2 | **UC58** - "Purchase via MoMo sandbox" | UC58 description | **SỬA** → "Purchase via VNPay sandbox / Mock Mode" |
| 3 | **UC102** - "sandbox payment records" | UC102 description | **SỬA** → "VNPay sandbox payment records" |
| 4 | **Missing UC98** | Không có UC98 trong bảng (nhảy từ UC97 sang UC99) | **BỔ SUNG** hoặc ghi rõ "Reserved" |
| 5 | **Placement Slots** | Report mô tả "Home Top/Category Top/Search Boost" nhưng DB thực tế có "BOOST_POST" và "SHOP_VIP" | **SỬA** mô tả cho khớp với thực tế seed data |
| 6 | **Business Roles** | Report liệt kê 7 actors nhưng DB có 5 business_roles (USER, HOST, COLLABORATOR, MANAGER, OPERATION_STAFF) + hệ thống Admin riêng | **BỔ SUNG** mô tả rõ hơn mối quan hệ Actor ↔ Business Role |
| 7 | **Posting Plans/Policy** | Report không đề cập đến hệ thống Posting Plans (GARDEN_OWNER_LIFETIME, PERSONAL_MONTHLY) | **BỔ SUNG** Use Case + mô tả nghiệp vụ |

#### D. BẢNG DB CÓ NHƯNG THIẾU USE CASE TƯƠNG ỨNG

| Bảng DB | Chức năng | UC tương ứng trong Report |
|---|---|---|
| `qr_sessions` | QR Code login cho Web | ❌ Chưa có UC |
| `user_posting_plans` | Gói đăng tin (lifetime/monthly) | ❌ Chưa có UC |
| `posting_fee_ledger` | Ghi nhận phí đăng/sửa tin | ❌ Chưa có UC |
| `post_videos` | Video cho bài đăng | ❌ Chưa có UC (UC24 chỉ nói images) |
| `promotion_package_prices` | Bảng giá & lịch sử giá gói quảng cáo | ❌ Chưa có UC riêng |
| `promotion_package_audit_log` | Audit trail cho thay đổi gói quảng cáo | ❌ Chưa có UC |
| `verifications` | OTP xác minh email/phone | ⚠️ Có trong auth nhưng email verification chưa rõ |
| `post_meta` | Metadata mở rộng cho bài đăng | ❌ Chưa có UC |
| `admin_system_settings` | System settings mở rộng cho admin | ⚠️ Trùng lặp với `system_settings` |

---

## V. TỔNG HỢP HÀNH ĐỘNG CẦN LÀM

### 5.1 ✅ Report 1 - Danh sách sửa đổi

1. **[SỬA]** Technology stack: "Prisma ORM" → "Drizzle ORM"
2. **[SỬA]** FE-15: "MoMo sandbox" → "VNPay sandbox + Mock Mode"
3. **[SỬA]** LI-1: Cập nhật limitations cho VNPay
4. **[QUYẾT ĐỊNH]** FE-20 (Rating) & FE-21 (Points): Chuyển sang "Optional/Out of scope" hoặc triển khai bổ sung
5. **[BỔ SUNG]** Thêm các features mới: Posting Plans, Post Video, QR Login, Shop VIP, Dynamic Pricing, Audit Trail

### 5.2 ✅ Report 2 - Danh sách sửa đổi

1. **[SỬA]** ORM: Prisma → Drizzle
2. **[SỬA]** Payment: MoMo → VNPay + Mock
3. **[SỬA]** Deployment: VPS/Render → Docker Compose + VPS
4. **[SỬA]** WBS 4.3.5: Rating & Loyalty chưa triển khai → ghi "Deferred"
5. **[BỔ SUNG]** WBS entries cho QR Login, Posting Plans, Business Roles

### 5.3 ✅ Report 3 - Danh sách sửa đổi

#### Sửa chữa (8 mục):
1. Actor #8: MoMo → VNPay
2. UC58: MoMo → VNPay
3. UC102: MoMo → VNPay
4. UC98: Bổ sung hoặc ghi Reserved
5. Placement Slots description: khớp với seed data thực tế
6. Business Roles: mô tả mapping Actor ↔ Business Role
7. Posting Plans: bổ sung mô tả nghiệp vụ
8. ERD: Cần cập nhật lên 38 bảng (nếu ERD cũ ít hơn)

#### Bổ sung Use Cases (10 UC mới):
- UC-NEW-01 đến UC-NEW-10 (xem mục IV.A)

#### Chuyển thành Optional/Deferred (13 UCs):
- UC104-107 (Rating & Review) → Optional
- UC108-111 (Point & Loyalty) → Optional
- UC112-114 (News Hub) → Optional hoặc merge với Host Contents
- UC122 (Bulk Upload) → Optional
- UC129 (Loyalty on Web) → Optional

---

## VI. DATABASE vs REPORT 3 ERD

### Bảng có trong DB nhưng có thể THIẾU trong ERD của Report 3:

| Bảng | Lý do cần bổ sung |
|---|---|
| `qr_sessions` | Feature mới: QR Web Login |
| `user_posting_plans` | Feature mới: Posting Plans |
| `posting_fee_ledger` | Feature mới: Fee Tracking |
| `post_videos` | Feature mới: Video support |
| `promotion_package_prices` | Feature mới: Dynamic pricing |
| `promotion_package_audit_log` | Feature mới: Audit trail |
| `host_contents` | Host role tables |
| `host_earnings` | Host role tables |
| `host_payout_requests` | Host role tables |
| `verifications` | Email/Phone verification |
| `post_meta` | Post metadata extension |
| `admin_system_settings` | Admin settings extension |
| `post_categories` | Many-to-many post ↔ category |

### Bảng CẦN tạo mới (nếu triển khai UC còn thiếu):

| Bảng đề xuất | Cho UC |
|---|---|
| `shop_reviews` | UC104-106 (Rating & Review) |
| `shop_review_replies` | UC105 (Reply to reviews) |
| `user_points` | UC108-111 (Point & Loyalty) |
| `point_transactions` | UC109-111 |
| `news_articles` | UC112-114 (News Hub) - hoặc tận dụng `host_contents` |

---

> [!IMPORTANT]
> **Quyết định cần từ team:**
> 1. FE-20 (Rating) & FE-21 (Points): Triển khai hay chuyển sang Optional?
> 2. UC112-114 (News Hub): Tạo module riêng hay tận dụng `host_contents`?
> 3. Placement Slots: Giữ seed data hiện tại (BOOST_POST, SHOP_VIP) hay đổi về đúng mô tả Report (Home/Category/Search)?
> 4. UC98: Bổ sung UC gì hay đánh số lại?
