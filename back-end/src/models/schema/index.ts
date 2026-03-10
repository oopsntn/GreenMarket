/**
 * Schema barrel export
 *
 * Re-exports every table so consumers can do:
 *   import * as schema from "../models/schema/index.ts";
 *   import { users, admins } from "../models/schema/index.ts";
 */

// ─── Auth ────────────────────────────────────────────
export { users } from "./users";
export { admins } from "./admins";
export { roles } from "./roles";
export { adminRoles } from "./admin-roles";
export { otpRequests } from "./otp-requests";

// ─── Shop ────────────────────────────────────────────
// export { shops } from "./shops.ts";

// ─── Catalog ─────────────────────────────────────────
// export { categories } from "./categories.ts";
// export { attributes } from "./attributes.ts";

// ─── Content ─────────────────────────────────────────
// export { posts } from "./posts.ts";
// export { postImages } from "./post-images.ts";

// ─── System ──────────────────────────────────────────
// export { systemSettings } from "./system-settings.ts";
