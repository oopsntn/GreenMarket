# GreenMarket API Documentation

Last updated: 2026-03-27

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

### Upload

| Method | Endpoint | Auth | Description | Main request fields |
|---|---|---|---|---|
| POST | `/api/upload` | No | Upload images/videos | `media` (array, max 10 files) |

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
| POST | `/api/posts` | No | Create user post | required: `userId`, `categoryId`, `postTitle` |
| GET | `/api/posts/my-posts` | No | Get current user posts | query `userId` |
| PATCH | `/api/posts/:id` | No | Update user post | body must include `userId`; post owner only |
| DELETE | `/api/posts/:id` | No | Soft delete user post | body must include `userId`; post owner only |

### Shops

| Method | Endpoint | Auth | Description | Main request fields |
|---|---|---|---|---|
| POST | `/api/shops/register` | No | Register shop | required: `userId`, `shopName` |
| GET | `/api/shops/my-shop` | No | Get user shop | query `userId` |
| GET | `/api/shops/:id` | No | Get public shop detail with approved posts | path `id` |
| PATCH | `/api/shops/:id` | No | Update shop info | `shopName`, `shopPhone`, `shopLocation`, `shopDescription`, `shopLat`, `shopLng` |

### Reports

| Method | Endpoint | Auth | Description | Main request fields |
|---|---|---|---|---|
| POST | `/api/reports` | No | Submit report for post | required: `postId`, `reportReason`; optional: `reporterId` |

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

- `mobile/user` domain has mixed auth style:
  - `/api/profile` uses JWT user token.
  - Many other user endpoints currently use `userId` from query/body and do not enforce JWT yet.
- `admin` domain is now protected by JWT and role-based checks.
- Static uploaded files are served at `/uploads/<filename>`.

