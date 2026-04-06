# GreenMarket API Documentation

Last updated: 2026-03-31

This document lists APIs that are already implemented in `back-end/src/routes`.
It is intended for `mobile` and `admin-web` teams.

## Base Information

- Base URL (local): `http://localhost:5000`
- API prefix: `/api`
- Auth header: `Authorization: Bearer <token>`
- Content type:
  - JSON APIs: `application/json`
  - Upload API: `multipart/form-data`

## Auth and Session APIs

| Method | Endpoint | Auth | Description | Main request fields |
|---|---|---|---|---|
| POST | `/api/auth/admin/login` | No | Admin login | `email`, `password` |
| POST | `/api/auth/user/request-otp` | No | Request OTP for user login | `mobile` |
| POST | `/api/auth/user/verify-otp` | No | Verify OTP and get user token | `mobile`, `otp` |
| POST | `/api/auth/qr/generate` | No | Create QR session for web login | none |
| GET | `/api/auth/qr/status/:sessionId` | No | Poll QR login session status | path `sessionId` |
| POST | `/api/auth/qr/scan` | User token | Mark QR as scanned from mobile | `sessionId` |
| POST | `/api/auth/qr/authorize` | User token | Authorize QR login from mobile | `sessionId` |

## Mobile/User APIs

### Profile (authenticated user)

| Method | Endpoint | Auth | Description | Main request fields |
|---|---|---|---|---|
| GET | `/api/profile` | User token | Get current user profile | none |
| PATCH | `/api/profile` | User token | Update current user profile | `userDisplayName`, `userAvatarUrl`, `userEmail`, `userLocation`, `userBio` |
| GET | `/api/profile/favorites` | User token | Get list of favorite posts for the current user | none |

### Upload

| Method | Endpoint | Auth | Description | Main request fields |
|---|---|---|---|---|
| POST | `/api/upload` | No | Upload mixed media (images/videos) | `media` (array, max 10 files) |
| POST | `/api/upload/images` | No | Upload images only | `media` (array, max 10 files) |

### Categories

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/categories` | No | Get published categories |
| GET | `/api/categories/:id/attributes` | No | Get attributes mapped to category |

### Posts

| Method | Endpoint | Auth | Description | Main request fields |
|---|---|---|---|---|
| GET | `/api/posts/browse` | No | Get public posts with filters | query filters supported by backend service |
| GET | `/api/posts/detail/:slug` | No | Get public post detail | path `slug` |
| POST | `/api/posts/:id/contact-click` | No | Record buyer contact click (analytics counter) | path `id` |
| POST | `/api/posts` | User token | Create user post | required: `categoryId`, `postTitle` |
| GET | `/api/posts/my-posts` | User token | Get current user posts | none |
| GET | `/api/posts/:id/favorite` | User token | Check if a post is favorited by the current user | path `id` |
| POST | `/api/posts/:id/favorite` | User token | Toggle (add/remove) post from favorites | path `id` |
| PATCH | `/api/posts/:id` | User token | Update user post | path `id` (post owner only) |
| DELETE | `/api/posts/:id` | User token | Soft delete user post | path `id` (post owner only) |

### Shops

| Method | Endpoint | Auth | Description | Main request fields |
|---|---|---|---|---|
| GET | `/api/shops/browse` | No | Browse active public shops (paginated) | optional query: `page`, `limit` |
| POST | `/api/shops/register` | User token | Register shop | required: `shopName` |
| GET | `/api/shops/my-shop` | User token | Get current user's shop | none |
| GET | `/api/shops/:id` | No | Get public shop detail with approved posts | path `id` |
| PATCH | `/api/shops/:id` | User token | Update shop info (Note: Email change resets verification) | `shopName`, `shopEmail`, `shopLocation`, `shopDescription`, `shopLat`, `shopLng` |
| POST | `/api/shops/verify/request` | User token | Request OTP for Email or Phone | `target` (email/phone string), `type` ("email" | "phone") |
| POST | `/api/shops/verify/email` | User token | Confirm OTP to verify Shop Email | `email`, `otp` |
| POST | `/api/shops/phones` | User token | Add and verify a secondary phone number (max 3) | `phone`, `otp` |
| DELETE | `/api/shops/phones` | User token | Remove a phone number (min 1 required) | `phone` |

### Reports

| Method | Endpoint | Auth | Description | Main request fields |
|---|---|---|---|---|
| POST | `/api/reports` | No | Submit report for post | required: `postId`, `reportReason`; optional: `reporterId` |

### Promotion (User)

| Method | Endpoint | Auth | Description | Main request fields |
|---|---|---|---|---|
| GET | `/api/promotions/packages` | No | Get published promotion packages | none |
| GET | `/api/promotions/packages/:id` | No | Get promotion package detail | path `id` |

**Response fields (highlights):**
- `promotionPackageId`, `promotionPackageTitle`, `promotionPackageDurationDays`, `promotionPackagePrice`
- `slotCode`, `slotTitle`, `slotCapacity`
- `slotRules` (JSON): currently supports `priority` for feed ranking weight.

**Promotion ranking behavior:**
- `/api/posts/browse` prioritizes promoted posts by `slotRules.priority` (descending).
- If slot priority is missing/invalid, fallback priority is `1`.

### Payment (User)

| Method | Endpoint | Auth | Description | Main request fields |
|---|---|---|---|---|
| POST | `/api/payment/buy-package` | User token | Create VNPay payment URL for package | `postId`, `packageId` |
| GET | `/api/payment/vnpay-return` | No | VNPay redirect result (callback) | query params from VNPay |

## Admin APIs

All admin APIs are mounted under `/api/admin/*` and require:

- Valid admin token (`Authorization: Bearer <admin_token>`)
- Admin guard (`verifyToken + isAdmin`)
- Route-level RBAC (`requireRoles(...)`)

### Role matrix by admin module

| Module | Allowed role codes |
|---|---|
| Categories | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN` |
| Attributes | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN` |
| Posts moderation | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN`, `ROLE_MODERATOR` |
| Shops moderation | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN`, `ROLE_MODERATOR` |
| Reports moderation | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN`, `ROLE_MODERATOR` |
| Users management | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN`, `ROLE_SUPPORT` |
| Roles management | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN` |

### Categories

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/categories` | List categories |
| GET | `/api/admin/categories/:id` | Get category detail |
| POST | `/api/admin/categories` | Create category |
| PUT | `/api/admin/categories/:id` | Update category |
| DELETE | `/api/admin/categories/:id` | Delete category |

### Attributes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/attributes` | List attributes |
| POST | `/api/admin/attributes` | Create attribute |
| PUT | `/api/admin/attributes/:id` | Update attribute |
| DELETE | `/api/admin/attributes/:id` | Delete attribute |
|---|---|---|
| **Placement Slots** | | |
| GET | `/api/admin/placement-slots` | List placement slots |
| GET | `/api/admin/placement-slots/:id` | Get slot detail |
| POST | `/api/admin/placement-slots` | Create slot |
| PUT | `/api/admin/placement-slots/:id` | Update slot |
| DELETE | `/api/admin/placement-slots/:id` | Delete slot |
|---|---|---|
| **Promotion Packages** | | |
| GET | `/api/admin/promotion-packages` | List packages |
| GET | `/api/admin/promotion-packages/:id` | Get package detail |
| POST | `/api/admin/promotion-packages` | Create package |
| PUT | `/api/admin/promotion-packages/:id` | Update package |
| DELETE | `/api/admin/promotion-packages/:id` | Delete package |
|---|---|---|
| **Promotions** | | |
| GET | `/api/admin/promotions` | List purchased promotion records |
| GET | `/api/admin/promotions/:id` | Get promotion detail |
| PATCH | `/api/admin/promotions/:id/status` | Pause or resume a promotion | `status` (`Active`, `Paused`) |
| PATCH | `/api/admin/promotions/:id/package` | Change package, slot, and delivery window | `packageId`, `startDate`, `endDate`, `paymentStatus`, optional `adminNote` |
| PATCH | `/api/admin/promotions/:id/reopen` | Reopen an expired promotion after payment confirmation | `packageId`, `startDate`, `endDate`, `paymentStatus`, optional `adminNote` |
|---|---|---|
| **Boosted Posts** | | |
| GET | `/api/admin/boosted-posts` | List operational boosted campaign records |
| GET | `/api/admin/boosted-posts/:id` | Get boosted campaign detail |
| PATCH | `/api/admin/boosted-posts/:id/status` | Update campaign runtime state | `status` (`Active`, `Paused`, `Closed`) |
|---|---|---|
| **Dashboard & Analytics** | | |
| GET | `/api/admin/dashboard` | Get dashboard overview cards and summary | optional query `fromDate`, `toDate` |
| GET | `/api/admin/analytics` | Get analytics KPI cards and top placement performance | optional query `fromDate`, `toDate` |
| GET | `/api/admin/revenue` | Get revenue KPI cards and package revenue rows | optional query `fromDate`, `toDate` |
| GET | `/api/admin/customer-spending` | Get customer spending KPI cards and customer rows | optional query `fromDate`, `toDate` |
|---|---|---|
| **Exports** | | |
| GET | `/api/admin/exports/history` | List export history entries |
| POST | `/api/admin/exports/general` | Generate a general report export | `module`, optional `fromDate`, `toDate`, `format` |
| POST | `/api/admin/exports/financial` | Generate a financial report export | `reportType`, optional `fromDate`, `toDate`, `format` |

### Posts moderation

| Method | Endpoint | Description | Main request fields |
|---|---|---|---|
| GET | `/api/admin/posts` | List posts (admin view) | none |
| POST | `/api/admin/posts` | Create post (admin/system) | post payload |
| GET | `/api/admin/posts/:id` | Get post detail | path `id` |
| PATCH | `/api/admin/posts/:id/status` | Update moderation status | `status`, optional `reason` |
| DELETE | `/api/admin/posts/:id` | Soft hide post + moderation log | required `adminId`, optional `reason` |

### Shops moderation

| Method | Endpoint | Description | Main request fields |
|---|---|---|---|
| GET | `/api/admin/shops` | List shops | none |
| POST | `/api/admin/shops` | Create shop | shop payload |
| GET | `/api/admin/shops/:id` | Get shop detail | path `id` |
| PATCH | `/api/admin/shops/:id/status` | Update shop status | `status` |
| PATCH | `/api/admin/shops/:id/verify` | Verify and activate shop | path `id` |
| DELETE | `/api/admin/shops/:id` | Delete shop | path `id` |

### Reports moderation

| Method | Endpoint | Description | Main request fields |
|---|---|---|---|
| GET | `/api/admin/reports` | List reports | none |
| GET | `/api/admin/reports/:id` | Get report detail | path `id` |
| PATCH | `/api/admin/reports/:id/resolve` | Resolve/dismiss report | `status`, optional `adminNote` |

### Users management

| Method | Endpoint | Description | Main request fields |
|---|---|---|---|
| GET | `/api/admin/users` | List users | none |
| GET | `/api/admin/users/:id` | Get user detail | path `id` |
| PATCH | `/api/admin/users/:id/status` | Update user status | `status` (`active`, `blocked`) |

### Roles management

| Method | Endpoint | Description | Main request fields |
|---|---|---|---|
| GET | `/api/admin/roles` | List roles | none |
| POST | `/api/admin/roles` | Create role | required `roleCode`, `roleTitle` |
| PATCH | `/api/admin/roles/:id` | Update role | `roleCode` and/or `roleTitle` |
| DELETE | `/api/admin/roles/:id` | Delete role | path `id` |
| GET | `/api/admin/roles/admins/:adminId/roles` | Get roles assigned to admin | path `adminId` |
| PUT | `/api/admin/roles/admins/:adminId/roles` | Replace admin role assignments | `roleIds` (number[]) |

## Current Implementation Notes

- User APIs are split into:
  - Public endpoints: browse/detail APIs (`/api/posts/browse`, `/api/posts/detail/:slug`, `/api/shops/browse`, `/api/shops/:id`).
  - Protected endpoints: user-owned resource APIs require JWT (`/api/profile`, `/api/posts`, `/api/posts/my-posts`, `/api/shops/register`, `/api/shops/my-shop`, etc.).
- `POST /api/posts/:id/contact-click` tracks buyer contact intent per post for analytics.
- `admin` domain is now protected by JWT and role-based checks.
- Static uploaded files are served at `/uploads/<filename>`.
