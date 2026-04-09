# GreenMarket API Documentation

Last updated: 2026-04-09

This document lists APIs that are already implemented in `back-end/src/routes`.
It is intended for `mobile`, `user-web`, and `admin-web` teams.

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
| GET | `/api/profile/favorites` | User token | Get list of favorite posts for current user | none |

### Collaborator (business role: `COLLABORATOR`)

Auth rules for all endpoints below:
- Requires valid **user token**
- Requires active business role `COLLABORATOR` (`verifyToken + requireBusinessRole("COLLABORATOR")`)

| Method | Endpoint | Auth | Description | Main request fields |
|---|---|---|---|---|
| GET | `/api/collaborator/profile` | User token + `COLLABORATOR` | Get collaborator profile with availability and summary stats | none |
| PATCH | `/api/collaborator/profile` | User token + `COLLABORATOR` | Update collaborator availability | optional: `availabilityStatus` (`available`, `busy`, `offline`), `availabilityNote` |
| GET | `/api/collaborator/jobs` | User token + `COLLABORATOR` | Get available jobs list (open + unassigned) | optional query: `keyword`, `category`, `location`, `page`, `limit` |
| GET | `/api/collaborator/jobs/:id` | User token + `COLLABORATOR` | Get job detail (open jobs or assigned jobs) | path `id` |
| POST | `/api/collaborator/jobs/:id/decision` | User token + `COLLABORATOR` | Accept or decline open job | `decision` (`accept`/`decline`), optional `reason` |
| POST | `/api/collaborator/jobs/:id/contact` | User token + `COLLABORATOR` | Send ask-more request to customer (mock) | path `id`, required `message` |
| GET | `/api/collaborator/my-jobs` | User token + `COLLABORATOR` | Get jobs assigned to current collaborator | optional query: `status`, `page`, `limit` |
| POST | `/api/collaborator/jobs/:id/deliverables` | User token + `COLLABORATOR` | Submit job deliverables and mark job completed | path `id`, required `fileUrls` (string[]), optional `note` |
| GET | `/api/collaborator/earnings` | User token + `COLLABORATOR` | Get earnings summary and history | optional query: `from`, `to` |
| GET | `/api/collaborator/payout-requests` | User token + `COLLABORATOR` | Get payout request history | optional query: `page`, `limit` |
| POST | `/api/collaborator/payout-requests` | User token + `COLLABORATOR` | Create payout request (mock) | required: `amount`, `method`; optional `note` |

**Collaborator notes:**
- `GET /api/collaborator/my-jobs` includes `progressPercent` derived from job status.
- `POST /api/collaborator/payout-requests` enforces minimum payout amount `500000`.

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
| GET | `/api/posts/posting-policy` | User token | Get effective posting plan, daily usage, and tracked posting fees | none |
| POST | `/api/posts/personal-plan/mock-activate` | User token | Activate monthly personal plan (development/mock) | optional: `durationDays` (7-365) |
| PATCH | `/api/posts/:id` | User token | Update user post | path `id` (post owner only) |
| DELETE | `/api/posts/:id` | User token | Soft delete user post | path `id` (post owner only) |
| GET | `/api/posts/:id/favorite` | User token | Check if a post is favorited by current user | path `id` |
| POST | `/api/posts/:id/favorite` | User token | Toggle (add/remove) favorite post | path `id` |

**Posting plan behavior notes (V1):**
- Active garden owner (shop `active`) is treated as `GARDEN_OWNER_LIFETIME` policy:
  - auto-approve new and edited posts
  - daily limit: `20` new posts/day
  - post creation fee tracking: `20,000 VND` per post
  - free edits per post: `4`; then edit fee tracking `5,000 VND` per edit
- Monthly personal policy can be activated via mock endpoint and also auto-approves posts while active.
- Fee tracking is currently recorded in `posting_fee_ledger` for analytics/reconciliation; payment collection workflow is separated.

### Shops

| Method | Endpoint | Auth | Description | Main request fields |
|---|---|---|---|---|
| GET | `/api/shops/browse` | No | Browse active public shops (paginated) | optional query: `page`, `limit` |
| POST | `/api/shops/register` | User token | Register shop | required: `shopName`; optional: `shopEmail`, `shopPhone`, `shopLocation`, `shopDescription`, `shopLogoUrl`, `shopCoverUrl`, `shopGalleryImages`, `shopLat`, `shopLng`, `shopFacebook`, `shopInstagram`, `shopYoutube` |
| GET | `/api/shops/my-shop` | User token | Get current user's shop | none |
| GET | `/api/shops/dashboard` | User token | Get owner dashboard metrics (requires active shop) | none |
| PATCH | `/api/shops/:id` | User token | Update shop info (email change resets verification) | `shopName`, `shopEmail`, `shopLocation`, `shopDescription`, `shopLogoUrl`, `shopCoverUrl`, `shopGalleryImages`, `shopLat`, `shopLng`, `shopFacebook`, `shopInstagram`, `shopYoutube` |
| POST | `/api/shops/verify/request` | User token | Request OTP for email/phone verification | `target`, `type` (`email` or `phone`) |
| POST | `/api/shops/verify/email` | User token | Verify shop email with OTP | `email`, `otp` |
| POST | `/api/shops/phones` | User token | Add secondary shop phone with OTP (max 3) | `phone`, `otp` |
| DELETE | `/api/shops/phones` | User token | Remove secondary shop phone (min 1 required) | `phone` |
| POST | `/api/shops/:id/contact-click` | No | Record click to contact shop (phone/Zalo) | path `id` |
| GET | `/api/shops/:id` | No | Get public shop detail with approved posts | path `id` |

**`GET /api/shops/dashboard` response highlights:**
- `shop`: `shopId`, `shopName`, `shopStatus`
- `summary`: `totalPosts`, `approvedPosts`, `pendingPosts`, `rejectedPosts`, `totalViews`, `totalContacts`, `totalShopViews`, `totalShopContactClicks`, `contactRate`, `postContactRate`, `totalPromotionSpend`, `totalBoostPackageSpend`, `successfulPayments`, `successfulBoostPurchases`, `activePromotions`, `boostedPostsActive`
- `topPosts`: top 5 posts by views with `postViewCount`, `postContactCount`, `postStatus`, `isPromoted`, `postUpdatedAt`
- `recentPayments`: latest 10 owner payment records with package/post references

### Reports

| Method | Endpoint | Auth | Description | Main request fields |
|---|---|---|---|---|
| POST | `/api/reports` | No | Submit report for post | required: `postId`, `reportReason`; optional: `reporterId` |

### Promotion (User)

| Method | Endpoint | Auth | Description | Main request fields |
|---|---|---|---|---|
| GET | `/api/promotions/packages` | No | Get published promotion packages | none |
| GET | `/api/promotions/packages/eligible` | User token | Get promotion packages eligible for current account type | none |
| GET | `/api/promotions/packages/:id` | No | Get promotion package detail | path `id` |

**Response fields (highlights):**
- `promotionPackageId`, `promotionPackageTitle`, `promotionPackageDurationDays`, `promotionPackagePrice`
- `promotionPackageMaxPosts`, `promotionPackageDisplayQuota`, `promotionPackageDescription`
- `slotCode`, `slotTitle`, `slotCapacity`
- `slotRules` (JSON): currently supports `priority` for feed ranking weight
- `GET /api/promotions/packages/eligible` returns `{ audience, reason?, packages[] }`:
  - `audience = garden_owner` for active shop accounts.
  - `audience = individual`, `reason = ACTIVE_SHOP_REQUIRED`, `packages = []` for non-owner accounts.

**Promotion ranking behavior:**
- `/api/posts/browse` prioritizes promoted posts by `slotRules.priority` (descending)
- If slot priority is missing/invalid, fallback priority is `1`

### Payment (User, MoMo)

| Method | Endpoint | Auth | Description | Main request fields |
|---|---|---|---|---|
| POST | `/api/payment/buy-package` | User token | Create MoMo payment intent URL for promotion package | `postId`, `packageId` |
| GET | `/api/payment/momo-return` | No | MoMo redirect callback, then backend redirects to frontend payment result | query params from MoMo |
| POST | `/api/payment/momo-ipn` | No | MoMo IPN callback for server-to-server payment update | callback payload from MoMo |
| GET | `/api/payment/mock-gate` | No | Development mock gateway screen (when `MOMO_MOCK=true`) | query: `orderId`, `amount`, `orderInfo`, `requestId`, `extraData` |
| POST | `/api/payment/mock-gate-process` | No | Development mock approve/cancel action | form fields from mock gateway |

**Payment behavior notes:**
- `buy-package` validates post ownership, post approval status, active shop ownership, package publish status, and slot availability before creating payment intent.
- If seller has active shop but post is missing `postShopId`, backend auto-links post to seller shop before creating payment.
- Callback handling (`momo-return` + `momo-ipn`) is idempotent by transaction state to avoid duplicate promotion activation.
- Common error shape: `{ error, code, ...details }`.

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
| Category mappings | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN` |
| Business roles | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN` |
| Placement slots | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN` |
| Promotion packages | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN` |
| Promotions | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN` |
| Boosted posts | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN` |
| Posts moderation | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN`, `ROLE_MODERATOR` |
| Shops moderation | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN`, `ROLE_MODERATOR` |
| Reports moderation | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN`, `ROLE_MODERATOR` |
| Users management | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN`, `ROLE_SUPPORT` |
| Assign user business role | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN` |
| Roles management | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN` |
| Dashboard/Analytics | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN`, `ROLE_SUPPORT`, `ROLE_MODERATOR`, `ROLE_FINANCE` |
| Revenue/Customer spending | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN`, `ROLE_FINANCE` |
| Exports | `ROLE_SUPER_ADMIN`, `ROLE_ADMIN`, `ROLE_FINANCE` |

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

### Category Mappings

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/category-mappings` | List category-attribute mappings |
| POST | `/api/admin/category-mappings` | Create mapping |
| PUT | `/api/admin/category-mappings/:categoryId/:attributeId` | Update mapping |
| PATCH | `/api/admin/category-mappings/:categoryId/:attributeId/status` | Toggle mapping status |
| DELETE | `/api/admin/category-mappings/:categoryId/:attributeId` | Delete mapping |

### Business Roles

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/business-roles` | List business roles |
| GET | `/api/admin/business-roles/:id` | Get business role detail |
| POST | `/api/admin/business-roles` | Create business role |
| PUT | `/api/admin/business-roles/:id` | Update business role |
| PATCH | `/api/admin/business-roles/:id/status` | Update business role status |
| DELETE | `/api/admin/business-roles/:id` | Delete business role |

### Placement Slots

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/placement-slots` | List placement slots |
| GET | `/api/admin/placement-slots/:id` | Get slot detail |
| POST | `/api/admin/placement-slots` | Create slot |
| PUT | `/api/admin/placement-slots/:id` | Update slot |
| DELETE | `/api/admin/placement-slots/:id` | Delete slot |

### Promotion Packages

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/promotion-packages` | List packages |
| GET | `/api/admin/promotion-packages/:id` | Get package detail |
| POST | `/api/admin/promotion-packages` | Create package |
| PUT | `/api/admin/promotion-packages/:id` | Update package |
| DELETE | `/api/admin/promotion-packages/:id` | Delete package |

**Pricing source-of-truth:**
- Package runtime price is sourced from `promotion_package_prices` only.
- Admin `POST/PUT /api/admin/promotion-packages` still accepts `promotionPackagePrice`, but this now writes a new effective price row in `promotion_package_prices` (and closes current open-ended row).
- The legacy `promotion_packages.promotion_package_price` field is deprecated and should not be used as runtime price.

### Promotions

| Method | Endpoint | Description | Main request fields |
|---|---|---|---|
| GET | `/api/admin/promotions` | List purchased promotion records | none |
| GET | `/api/admin/promotions/:id` | Get promotion detail | path `id` |
| PATCH | `/api/admin/promotions/:id/status` | Pause or resume promotion | `status` (`Active`, `Paused`) |
| PATCH | `/api/admin/promotions/:id/package` | Change package, slot, and delivery window | `packageId`, `startDate`, `endDate`, `paymentStatus`, optional `adminNote` |
| PATCH | `/api/admin/promotions/:id/reopen` | Reopen expired promotion after payment confirmation | `packageId`, `startDate`, `endDate`, `paymentStatus`, optional `adminNote` |

### Boosted Posts

| Method | Endpoint | Description | Main request fields |
|---|---|---|---|
| GET | `/api/admin/boosted-posts` | List boosted campaign records | none |
| GET | `/api/admin/boosted-posts/:id` | Get boosted campaign detail | path `id` |
| PATCH | `/api/admin/boosted-posts/:id/status` | Update campaign runtime state | `status` (`Active`, `Paused`, `Closed`) |

### Dashboard and Analytics

| Method | Endpoint | Description | Main request fields |
|---|---|---|---|
| GET | `/api/admin/dashboard` | Get dashboard overview cards and summary | optional query `fromDate`, `toDate` |
| GET | `/api/admin/analytics` | Get analytics KPI cards and top placement performance | optional query `fromDate`, `toDate` |
| GET | `/api/admin/revenue` | Get revenue KPI cards and package revenue rows | optional query `fromDate`, `toDate` |
| GET | `/api/admin/customer-spending` | Get customer spending KPI cards and customer rows | optional query `fromDate`, `toDate` |

### Exports

| Method | Endpoint | Description | Main request fields |
|---|---|---|---|
| GET | `/api/admin/exports/history` | List export history entries | none |
| POST | `/api/admin/exports/general` | Generate general report export | `module`, optional `fromDate`, `toDate`, `format` |
| POST | `/api/admin/exports/financial` | Generate financial report export | `reportType`, optional `fromDate`, `toDate`, `format` |

### Posts Moderation

| Method | Endpoint | Description | Main request fields |
|---|---|---|---|
| GET | `/api/admin/posts` | List posts (admin view) | none |
| POST | `/api/admin/posts` | Create post (admin/system) | post payload |
| GET | `/api/admin/posts/:id` | Get post detail | path `id` |
| PATCH | `/api/admin/posts/:id/status` | Update moderation status | `status`, optional `reason` |
| DELETE | `/api/admin/posts/:id` | Soft hide post + moderation log | required `adminId`, optional `reason` |

### Shops Moderation

| Method | Endpoint | Description | Main request fields |
|---|---|---|---|
| GET | `/api/admin/shops` | List shops | none |
| POST | `/api/admin/shops` | Create shop | shop payload |
| GET | `/api/admin/shops/:id` | Get shop detail | path `id` |
| PATCH | `/api/admin/shops/:id/status` | Update shop status | `status` |
| PATCH | `/api/admin/shops/:id/verify` | Verify and activate shop | path `id` |
| DELETE | `/api/admin/shops/:id` | Delete shop | path `id` |

### Reports Moderation

| Method | Endpoint | Description | Main request fields |
|---|---|---|---|
| GET | `/api/admin/reports` | List reports | none |
| GET | `/api/admin/reports/:id` | Get report detail | path `id` |
| PATCH | `/api/admin/reports/:id/resolve` | Resolve/dismiss report | `status`, optional `adminNote` |

### Users Management

| Method | Endpoint | Description | Main request fields |
|---|---|---|---|
| GET | `/api/admin/users` | List users | none |
| GET | `/api/admin/users/:id` | Get user detail | path `id` |
| PATCH | `/api/admin/users/:id/status` | Update user status | `status` (`active`, `blocked`) |
| PATCH | `/api/admin/users/:id/business-role` | Assign business role to user | `businessRoleId` |

### Roles Management

| Method | Endpoint | Description | Main request fields |
|---|---|---|---|
| GET | `/api/admin/roles` | List roles | none |
| POST | `/api/admin/roles` | Create role | required `roleCode`, `roleTitle` |
| PATCH | `/api/admin/roles/:id` | Update role | `roleCode` and/or `roleTitle` |
| DELETE | `/api/admin/roles/:id` | Delete role | path `id` |
| GET | `/api/admin/roles/admins/:adminId/roles` | Get roles assigned to admin | path `adminId` |
| PUT | `/api/admin/roles/admins/:adminId/roles` | Replace admin role assignments | `roleIds` (number[]) |

## Current Implementation Notes

- Public user endpoints include browse/detail APIs such as `/api/posts/browse`, `/api/posts/detail/:slug`, `/api/shops/browse`, `/api/shops/:id`.
- Protected user endpoints require JWT, such as `/api/profile`, `/api/posts/my-posts`, `/api/shops/my-shop`, `/api/shops/dashboard`, `/api/payment/buy-package`.
- Collaborator module is mounted at `/api/collaborator` and uses business-role guard (`COLLABORATOR`) for all collaborator routes.
- `POST /api/posts/:id/contact-click` tracks buyer contact intent per post for analytics.
- Payment callbacks are handled through `/api/payment/momo-return` and `/api/payment/momo-ipn`.
- Static uploaded files are served at `/uploads/<filename>`.
