-- ============================================================
-- GreenMarket Database Backup (Full Schema)
-- PostgreSQL 18.x | Generated: 2026-04-08
-- Tables: 34 | Synced from Drizzle ORM schema
-- Categories: Cây Cảnh Bonsai, Dụng Cụ Làm Vườn
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TRIGGER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION update_admin_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.admin_updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION update_category_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.category_updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION update_post_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.post_updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION update_report_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.report_updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION update_shop_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.shop_updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION update_system_setting_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.system_setting_updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION update_user_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.user_updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION update_business_role_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.business_role_updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$;

-- Trigger: Tự động ghi audit log khi thêm / sửa gói quảng cáo
CREATE OR REPLACE FUNCTION log_promotion_package_changes() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_action VARCHAR(50);
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'PACKAGE_CREATED';
        INSERT INTO promotion_package_audit_log (action_type, package_id, before_state, after_state)
        VALUES (v_action, NEW.promotion_package_id, NULL, row_to_json(NEW)::jsonb);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.promotion_package_deleted_at IS NULL AND NEW.promotion_package_deleted_at IS NOT NULL THEN
            v_action := 'PACKAGE_DELETED';
        ELSIF OLD.promotion_package_deleted_at IS NOT NULL AND NEW.promotion_package_deleted_at IS NULL THEN
            v_action := 'PACKAGE_RESTORED';
        ELSE
            v_action := 'PACKAGE_UPDATED';
        END IF;
        INSERT INTO promotion_package_audit_log (action_type, package_id, before_state, after_state)
        VALUES (v_action, NEW.promotion_package_id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    END IF;
    RETURN NEW;
END; $$;

-- Trigger: Tự động ghi audit log khi thêm / cập nhật bảng giá
CREATE OR REPLACE FUNCTION log_promotion_price_changes() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_action VARCHAR(50);
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Phân loại: áp dụng ngay vs lên lịch tương lai
        IF NEW.effective_from > now() THEN
            v_action := 'PRICE_SCHEDULED';
        ELSE
            v_action := 'PRICE_ADDED';
        END IF;
        INSERT INTO promotion_package_audit_log (action_type, package_id, price_id, before_state, after_state)
        VALUES (v_action, NEW.package_id, NEW.price_id, NULL, row_to_json(NEW)::jsonb);
    ELSIF TG_OP = 'UPDATE' THEN
        -- effective_to được set → đóng lại bảng giá này
        IF OLD.effective_from > now() THEN
            v_action := 'PRICE_SCHEDULED_CANCELLED'; -- Admin hủy lịch giá tương lai
        ELSE
            v_action := 'PRICE_SUPERSEDED';          -- Giá cũ bị thay bởi giá mới
        END IF;
        INSERT INTO promotion_package_audit_log (action_type, package_id, price_id, before_state, after_state)
        VALUES (v_action, NEW.package_id, NEW.price_id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    END IF;
    RETURN NEW;
END; $$;

-- ============================================================
-- TABLES
-- ============================================================

-- Business Roles
CREATE TABLE business_roles (
    business_role_id SERIAL PRIMARY KEY,
    business_role_code VARCHAR(50) NOT NULL UNIQUE,
    business_role_title VARCHAR(100) NOT NULL,
    business_role_audience_group VARCHAR(50),
    business_role_access_scope VARCHAR(100),
    business_role_summary TEXT,
    business_role_responsibilities JSONB DEFAULT '[]'::jsonb,
    business_role_capabilities JSONB DEFAULT '[]'::jsonb,
    business_role_status VARCHAR(20) NOT NULL DEFAULT 'active',
    business_role_created_at TIMESTAMP DEFAULT now(),
    business_role_updated_at TIMESTAMP DEFAULT now()
);

-- Users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    user_mobile VARCHAR(15) NOT NULL UNIQUE,
    user_display_name VARCHAR(80),
    user_avatar_url TEXT,
    user_email VARCHAR(255),
    user_location VARCHAR(255),
    user_bio TEXT,
    user_availability_status VARCHAR(20) NOT NULL DEFAULT 'available',
    user_availability_note TEXT,
    user_status VARCHAR(20) DEFAULT 'active',
    user_business_role_id INTEGER REFERENCES business_roles(business_role_id) ON DELETE SET NULL,
    user_registered_at TIMESTAMP DEFAULT now(),
    user_last_login_at TIMESTAMP,
    user_created_at TIMESTAMP DEFAULT now(),
    user_updated_at TIMESTAMP DEFAULT now()
);

-- Admins
CREATE TABLE admins (
    admin_id SERIAL PRIMARY KEY,
    admin_email VARCHAR(150) NOT NULL UNIQUE,
    admin_username VARCHAR(50) UNIQUE,
    admin_password_hash VARCHAR(255) NOT NULL,
    admin_full_name VARCHAR(100),
    admin_avatar_url TEXT,
    admin_status VARCHAR(20),
    admin_last_login_at TIMESTAMP,
    admin_created_at TIMESTAMP DEFAULT now(),
    admin_updated_at TIMESTAMP DEFAULT now()
);

-- Roles
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_code VARCHAR(50) UNIQUE,
    role_title VARCHAR(100),
    role_created_at TIMESTAMP DEFAULT now()
);

-- Admin Roles
CREATE TABLE admin_roles (
    admin_role_admin_id INTEGER NOT NULL REFERENCES admins(admin_id) ON DELETE CASCADE,
    admin_role_role_id INTEGER NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    PRIMARY KEY (admin_role_admin_id, admin_role_role_id)
);

-- QR Sessions
CREATE TABLE qr_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'pending',
    user_id INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    expires_at TIMESTAMP NOT NULL
);

-- OTP Requests
CREATE TABLE otp_requests (
    otp_request_id SERIAL PRIMARY KEY,
    otp_request_mobile VARCHAR(20),
    otp_request_otp_code VARCHAR(20),
    otp_request_expire_at TIMESTAMP,
    otp_request_status VARCHAR(30),
    otp_request_created_at TIMESTAMP DEFAULT now()
);

-- Banned Keywords
CREATE TABLE banned_keywords (
    banned_keyword_id SERIAL PRIMARY KEY,
    banned_keyword_keyword VARCHAR(50),
    banned_keyword_published BOOLEAN DEFAULT FALSE,
    banned_keyword_created_at TIMESTAMP DEFAULT now()
);

-- Categories
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_parent_id INTEGER REFERENCES categories(category_id) ON DELETE CASCADE,
    category_title VARCHAR(150),
    category_slug VARCHAR(150),
    category_published BOOLEAN DEFAULT false,
    category_created_at TIMESTAMP DEFAULT now(),
    category_updated_at TIMESTAMP DEFAULT now()
);

-- Attributes
CREATE TABLE attributes (
    attribute_id SERIAL PRIMARY KEY,
    attribute_code VARCHAR(100) UNIQUE,
    attribute_title VARCHAR(150),
    attribute_data_type VARCHAR(50),
    attribute_options JSONB,
    attribute_published BOOLEAN DEFAULT false,
    attribute_created_at TIMESTAMP DEFAULT now()
);

-- Category Attributes
CREATE TABLE category_attributes (
    category_attribute_category_id INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE CASCADE,
    category_attribute_attribute_id INTEGER NOT NULL REFERENCES attributes(attribute_id) ON DELETE CASCADE,
    category_attribute_required BOOLEAN DEFAULT false,
    category_attribute_display_order INTEGER DEFAULT 1,
    category_attribute_status VARCHAR(20) DEFAULT 'Active',
    PRIMARY KEY (category_attribute_category_id, category_attribute_attribute_id)
);

-- Shops
CREATE TABLE shops (
    shop_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    shop_name VARCHAR(150) NOT NULL,
    shop_phone VARCHAR(50), 
    shop_email VARCHAR(255) UNIQUE,
    shop_email_verified BOOLEAN DEFAULT FALSE,
    shop_facebook VARCHAR(255),
    shop_instagram VARCHAR(255),
    shop_youtube VARCHAR(255),
    shop_location VARCHAR(255),
    shop_description TEXT,
    shop_logo_url TEXT,
    shop_cover_url TEXT,
    shop_status VARCHAR(20) DEFAULT 'pending',
    shop_vip_started_at TIMESTAMP,
    shop_vip_expires_at TIMESTAMP,
    shop_lat DECIMAL(10, 8),
    shop_lng DECIMAL(11, 8),
    shop_created_at TIMESTAMP DEFAULT now(),
    shop_updated_at TIMESTAMP DEFAULT now()
);

-- Verifications Table for OTP
CREATE TABLE verifications (
    verification_id SERIAL PRIMARY KEY,
    target VARCHAR(255) NOT NULL, -- email or phone number
    otp_code VARCHAR(255) NOT NULL,
    verification_type VARCHAR(20) NOT NULL, -- 'email' or 'phone'
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now()
);

-- Blocked Shops
CREATE TABLE blocked_shops (
    blocked_shop_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    blocked_shop_shop_id INTEGER NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
    blocked_shop_created_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (blocked_shop_user_id, blocked_shop_shop_id)
);

-- Posts
CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    post_author_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    post_shop_id INTEGER REFERENCES shops(shop_id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES categories(category_id) ON DELETE CASCADE,
    post_title VARCHAR(255) NOT NULL,
    post_slug VARCHAR(255) NOT NULL UNIQUE,

    post_price NUMERIC(12,2),
    post_location VARCHAR(255),
    post_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    post_rejected_reason TEXT,
    post_contact_phone VARCHAR(20),
    post_view_count INTEGER DEFAULT 0,
    post_contact_count INTEGER DEFAULT 0,
    post_edit_count INTEGER DEFAULT 0,
    post_paid_edit_count INTEGER DEFAULT 0,
    post_published BOOLEAN DEFAULT FALSE,
    post_submitted_at TIMESTAMP,
    post_published_at TIMESTAMP,
    post_deleted_at TIMESTAMP,
    post_moderated_at TIMESTAMP,
    post_created_at TIMESTAMP DEFAULT now(),
    post_updated_at TIMESTAMP DEFAULT now()
);

-- Post Images
CREATE TABLE post_images (
    image_id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(post_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_sort_order INTEGER DEFAULT 0,
    image_created_at TIMESTAMP DEFAULT now()
);

-- Post Videos
CREATE TABLE post_videos (
    post_video_id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    video_position INTEGER DEFAULT 0,
    video_created_at TIMESTAMP DEFAULT now()
);

-- Post Categories (Many-to-Many)
CREATE TABLE post_categories (
    post_category_post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    post_category_category_id INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE CASCADE,
    PRIMARY KEY (post_category_post_id, post_category_category_id)
);

-- Post Attribute Values
CREATE TABLE post_attribute_values (
    value_id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(post_id) ON DELETE CASCADE,
    attribute_id INTEGER REFERENCES attributes(attribute_id) ON DELETE CASCADE,
    attribute_value TEXT NOT NULL,
    value_created_at TIMESTAMP DEFAULT now()
);

-- Post Meta
CREATE TABLE post_meta (
    post_meta_id SERIAL PRIMARY KEY,
    post_meta_post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    post_meta_key VARCHAR(100),
    post_meta_content TEXT,
    post_meta_created_at TIMESTAMP DEFAULT now()
);

-- Favorite Posts (Bookmarks)
CREATE TABLE favorite_posts (
    favorite_post_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    favorite_post_post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    favorite_post_created_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (favorite_post_user_id, favorite_post_post_id)
);

-- Reports
CREATE TABLE reports (
    report_id SERIAL PRIMARY KEY,
    reporter_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    post_id INTEGER REFERENCES posts(post_id) ON DELETE SET NULL,
    report_shop_id INTEGER REFERENCES shops(shop_id) ON DELETE SET NULL,
    report_reason_code VARCHAR(50),
    report_reason TEXT NOT NULL,
    report_note TEXT,
    report_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    report_created_at TIMESTAMP DEFAULT now(),
    report_updated_at TIMESTAMP DEFAULT now()
);

-- Report Evidence
CREATE TABLE report_evidence (
    report_evidence_id SERIAL PRIMARY KEY,
    report_evidence_report_id INTEGER NOT NULL REFERENCES reports(report_id) ON DELETE CASCADE,
    report_evidence_url TEXT,
    report_evidence_created_at TIMESTAMP DEFAULT now()
);

-- Moderation Actions
CREATE TABLE moderation_actions (
    moderation_action_id SERIAL PRIMARY KEY,
    moderation_action_action_by INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    moderation_action_post_id INTEGER REFERENCES posts(post_id) ON DELETE SET NULL,
    moderation_action_action VARCHAR(50),
    moderation_action_note TEXT,
    moderation_action_created_at TIMESTAMP DEFAULT now()
);

-- Placement Slots (Ad zones)
CREATE TABLE placement_slots (
    placement_slot_id SERIAL PRIMARY KEY,
    placement_slot_code VARCHAR(100),
    placement_slot_title VARCHAR(150),
    placement_slot_capacity INTEGER,
    placement_slot_rules JSONB,
    placement_slot_published BOOLEAN DEFAULT FALSE,
    placement_slot_created_at TIMESTAMP DEFAULT now()
);

-- Promotion Packages
CREATE TABLE promotion_packages (
    promotion_package_id    SERIAL PRIMARY KEY,
    promotion_package_slot_id INTEGER NOT NULL REFERENCES placement_slots(placement_slot_id) ON DELETE CASCADE,
    promotion_package_title VARCHAR(150),
    promotion_package_duration_days INTEGER,
    promotion_package_max_posts INTEGER DEFAULT 1,
    promotion_package_display_quota INTEGER DEFAULT 0,
    promotion_package_description TEXT,
    promotion_package_published BOOLEAN DEFAULT FALSE,
    promotion_package_deleted_at TIMESTAMP,               -- Soft delete: NULL = còn hoạt động
    promotion_package_created_at TIMESTAMP DEFAULT now()
);

-- Promotion Package Prices (Lịch sử & lên lịch giá)
-- Mỗi dòng là 1 mức giá cho 1 gói trong 1 khoảng thời gian.
-- effective_from có thể là tương lai → admin lên lịch tăng/giảm giá trước.
-- Giá hiện hành tại thời điểm T = dòng có effective_from <= T AND (effective_to IS NULL OR effective_to > T)
CREATE TABLE promotion_package_prices (
    price_id        SERIAL PRIMARY KEY,
    package_id      INTEGER NOT NULL REFERENCES promotion_packages(promotion_package_id) ON DELETE CASCADE,
    price           DECIMAL(15, 2) NOT NULL,
    effective_from  TIMESTAMP NOT NULL DEFAULT now(),    -- Bắt đầu có hiệu lực (có thể là tương lai)
    effective_to    TIMESTAMP,                            -- Kết thúc hiệu lực; NULL = chưa bị thay thế hoặc là mức giá tương lai chưa tới
    note            TEXT,                                 -- Lý do điều chỉnh giá
    created_by      INTEGER REFERENCES admins(admin_id) ON DELETE SET NULL,
    created_at      TIMESTAMP DEFAULT now()
);

-- View: Giá đang áp dụng tại thời điểm hiện tại cho mỗi gói
CREATE VIEW v_promotion_package_current_price AS
SELECT
    ppp.package_id,
    ppp.price_id,
    ppp.price,
    ppp.effective_from,
    ppp.effective_to
FROM promotion_package_prices ppp
WHERE ppp.effective_from <= now()
  AND (ppp.effective_to IS NULL OR ppp.effective_to > now());

-- Promotion Package Audit Log
-- Ghi lại toàn bộ lịch sử hành động của admin lên gói quảng cáo và bảng giá.
-- action_type:
--   PACKAGE_CREATED         → Admin thêm gói mới
--   PACKAGE_UPDATED         → Admin sửa tên / thời hạn / trạng thái published
--   PACKAGE_DELETED         → Admin xóa mềm (deleted_at được set)
--   PACKAGE_RESTORED        → Admin khôi phục gói đã xóa
--   PRICE_ADDED             → Thêm bảng giá có hiệu lực ngay
--   PRICE_SCHEDULED         → Lên lịch giá tương lai (effective_from > now())
--   PRICE_SUPERSEDED        → Giá cũ bị đóng lại khi giá mới thay thế
--   PRICE_SCHEDULED_CANCELLED → Admin hủy lịch giá tương lai trước khi có hiệu lực
CREATE TABLE promotion_package_audit_log (
    audit_id        SERIAL PRIMARY KEY,
    action_type     VARCHAR(50) NOT NULL,
    package_id      INTEGER REFERENCES promotion_packages(promotion_package_id) ON DELETE SET NULL,
    price_id        INTEGER REFERENCES promotion_package_prices(price_id) ON DELETE SET NULL,
    before_state    JSONB,             -- Snapshot trạng thái TRƯỚC khi thay đổi
    after_state     JSONB,             -- Snapshot trạng thái SAU khi thay đổi
    changed_by      INTEGER REFERENCES admins(admin_id) ON DELETE SET NULL,
    changed_at      TIMESTAMP DEFAULT now(),
    note            TEXT               -- Ghi chú bổ sung nếu cần
);

-- Post Promotions
CREATE TABLE post_promotions (
    post_promotion_id SERIAL PRIMARY KEY,
    post_promotion_post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    post_promotion_buyer_id INTEGER NOT NULL,
    post_promotion_package_id INTEGER NOT NULL REFERENCES promotion_packages(promotion_package_id) ON DELETE CASCADE,
    post_promotion_slot_id INTEGER NOT NULL REFERENCES placement_slots(placement_slot_id) ON DELETE CASCADE,
    post_promotion_start_at TIMESTAMP,
    post_promotion_end_at TIMESTAMP,
    post_promotion_status VARCHAR(20),
    post_promotion_created_at TIMESTAMP DEFAULT now()
);

-- Payment Transactions
CREATE TABLE payment_txn (
    payment_txn_id       SERIAL PRIMARY KEY,
    payment_txn_user_id  INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    payment_txn_post_id  INTEGER REFERENCES posts(post_id),
    payment_txn_package_id INTEGER NOT NULL REFERENCES promotion_packages(promotion_package_id) ON DELETE CASCADE,
    payment_txn_price_id INTEGER REFERENCES promotion_package_prices(price_id) ON DELETE SET NULL, -- Snapshot bảng giá tại thời điểm mua
    payment_txn_amount   DECIMAL(15, 2),                  -- Số tiền thực thu (snapshot, không đổi dù giá gói thay đổi sau)
    payment_txn_provider VARCHAR(50),
    payment_txn_provider_txn_id VARCHAR(100) UNIQUE,
    payment_txn_status   VARCHAR(20),
    payment_txn_created_at TIMESTAMP DEFAULT now()
);

-- User Posting Plans
CREATE TABLE user_posting_plans (
    posting_plan_id SERIAL PRIMARY KEY,
    posting_plan_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    posting_plan_code VARCHAR(50) NOT NULL,
    posting_plan_title VARCHAR(120) NOT NULL,
    posting_plan_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- monthly | lifetime
    posting_plan_status VARCHAR(20) NOT NULL DEFAULT 'active', -- active | expired | cancelled
    posting_plan_auto_approve BOOLEAN NOT NULL DEFAULT FALSE,
    posting_plan_daily_post_limit INTEGER,
    posting_plan_post_fee_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    posting_plan_free_edit_quota INTEGER NOT NULL DEFAULT 0,
    posting_plan_edit_fee_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    posting_plan_started_at TIMESTAMP NOT NULL DEFAULT now(),
    posting_plan_expires_at TIMESTAMP,
    posting_plan_created_at TIMESTAMP DEFAULT now(),
    posting_plan_updated_at TIMESTAMP DEFAULT now()
);

-- Posting Fee Ledger
CREATE TABLE posting_fee_ledger (
    posting_fee_id SERIAL PRIMARY KEY,
    posting_fee_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    posting_fee_post_id INTEGER REFERENCES posts(post_id) ON DELETE SET NULL,
    posting_fee_plan_id INTEGER REFERENCES user_posting_plans(posting_plan_id) ON DELETE SET NULL,
    posting_fee_action_type VARCHAR(30) NOT NULL, -- POST_CREATE | POST_EDIT
    posting_fee_quantity INTEGER NOT NULL DEFAULT 1,
    posting_fee_unit_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    posting_fee_total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    posting_fee_currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    posting_fee_note TEXT,
    posting_fee_created_at TIMESTAMP DEFAULT now()
);

-- Daily Placement Metrics
CREATE TABLE daily_placement_metrics (
    daily_placement_metric_id SERIAL PRIMARY KEY,
    daily_placement_metric_date DATE,
    daily_placement_metric_slot_id INTEGER NOT NULL REFERENCES placement_slots(placement_slot_id) ON DELETE CASCADE,
    daily_placement_metric_category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    daily_placement_metric_impressions INTEGER DEFAULT 0,
    daily_placement_metric_clicks INTEGER DEFAULT 0,
    daily_placement_metric_detail_views INTEGER DEFAULT 0,
    daily_placement_metric_contacts INTEGER DEFAULT 0,
    daily_placement_metric_ctr DECIMAL(5, 4),
    daily_placement_metric_created_at TIMESTAMP DEFAULT now()
);

-- Trend Scores
CREATE TABLE trend_scores (
    trend_score_id SERIAL PRIMARY KEY,
    trend_score_as_of_date DATE,
    trend_score_slot_id INTEGER NOT NULL REFERENCES placement_slots(placement_slot_id) ON DELETE CASCADE,
    trend_score_score DECIMAL(10, 4),
    trend_score_components JSONB,
    trend_score_created_at TIMESTAMP DEFAULT now()
);

-- AI Insights
CREATE TABLE ai_insights (
    ai_insight_id SERIAL PRIMARY KEY,
    ai_insight_requested_by INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    ai_insight_scope VARCHAR(50),
    ai_insight_input_snapshot JSONB,
    ai_insight_output_text TEXT,
    ai_insight_provider VARCHAR(50),
    ai_insight_created_at TIMESTAMP DEFAULT now()
);

-- System Settings
CREATE TABLE system_settings (
    system_setting_id SERIAL PRIMARY KEY,
    system_setting_key VARCHAR(100) UNIQUE,
    system_setting_value TEXT,
    system_setting_updated_by INTEGER REFERENCES admins(admin_id) ON DELETE SET NULL,
    system_setting_updated_at TIMESTAMP DEFAULT now()
);

-- Event Logs
CREATE TABLE event_logs (
    event_log_id SERIAL PRIMARY KEY,
    event_log_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    event_log_post_id INTEGER,
    event_log_shop_id INTEGER,
    event_log_slot_id INTEGER,
    event_log_category_id INTEGER,
    event_log_event_type VARCHAR(50),
    event_log_event_time TIMESTAMP DEFAULT now(),
    event_log_meta JSONB
);

-- Collaborator Jobs
CREATE TABLE jobs (
    job_id SERIAL PRIMARY KEY,
    job_customer_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    job_collaborator_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    job_title VARCHAR(255) NOT NULL,
    job_category VARCHAR(100),
    job_location VARCHAR(255),
    job_deadline TIMESTAMP,
    job_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    job_description TEXT,
    job_requirements JSONB DEFAULT '[]'::jsonb,
    job_status VARCHAR(20) NOT NULL DEFAULT 'open',
    job_decline_reason TEXT,
    job_completed_at TIMESTAMP,
    job_created_at TIMESTAMP DEFAULT now(),
    job_updated_at TIMESTAMP DEFAULT now()
);

-- Collaborator Contact Requests (Mock ask-more flow)
CREATE TABLE job_contact_requests (
    contact_request_id SERIAL PRIMARY KEY,
    contact_request_job_id INTEGER NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    contact_request_collaborator_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    contact_request_customer_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    contact_request_message TEXT NOT NULL,
    contact_request_status VARCHAR(20) NOT NULL DEFAULT 'sent',
    contact_request_created_at TIMESTAMP DEFAULT now(),
    contact_request_replied_at TIMESTAMP
);

-- Collaborator Deliverables
CREATE TABLE job_deliverables (
    deliverable_id SERIAL PRIMARY KEY,
    deliverable_job_id INTEGER NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    deliverable_collaborator_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    deliverable_file_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    deliverable_note TEXT,
    deliverable_submitted_at TIMESTAMP DEFAULT now()
);

-- Collaborator Earnings
CREATE TABLE earning_entries (
    earning_entry_id SERIAL PRIMARY KEY,
    earning_entry_collaborator_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    earning_entry_job_id INTEGER REFERENCES jobs(job_id) ON DELETE SET NULL,
    earning_entry_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    earning_entry_type VARCHAR(30) NOT NULL DEFAULT 'job',
    earning_entry_created_at TIMESTAMP DEFAULT now()
);

-- Collaborator Payout Requests (Mock)
CREATE TABLE payout_requests (
    payout_request_id SERIAL PRIMARY KEY,
    payout_request_collaborator_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    payout_request_amount NUMERIC(15,2) NOT NULL,
    payout_request_method VARCHAR(50) NOT NULL,
    payout_request_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payout_request_note TEXT,
    payout_request_created_at TIMESTAMP DEFAULT now(),
    payout_request_processed_at TIMESTAMP
);

-- Admin System Settings
CREATE TABLE admin_system_settings (
    setting_id SERIAL PRIMARY KEY,
    otp_sandbox_enabled BOOLEAN,
    max_images_per_post INTEGER,
    post_rate_limit_per_hour INTEGER,
    banned_keywords JSONB,
    auto_moderation_enabled BOOLEAN,
    keyword_filter_enabled BOOLEAN,
    report_rate_limit INTEGER,
    post_expiry_days INTEGER,
    restore_window_days INTEGER,
    auto_expire_enabled BOOLEAN,
    max_file_size_mb INTEGER,
    image_compression_enabled BOOLEAN,
    updated_by INTEGER REFERENCES admins(admin_id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT now()
);

-- Admin Templates
CREATE TABLE admin_templates (
    template_id SERIAL PRIMARY KEY,
    template_name VARCHAR(150) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    template_content TEXT NOT NULL,
    template_status VARCHAR(30),
    template_created_by INTEGER REFERENCES admins(admin_id) ON DELETE SET NULL,
    template_created_at TIMESTAMP DEFAULT now(),
    template_updated_by INTEGER REFERENCES admins(admin_id) ON DELETE SET NULL,
    template_updated_at TIMESTAMP DEFAULT now()
);

-- Operation Tasks
CREATE TABLE operation_tasks (
    task_id SERIAL PRIMARY KEY,
    task_title VARCHAR(255) NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    task_status VARCHAR(20) NOT NULL DEFAULT 'open',
    task_priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    assignee_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    customer_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    related_target_id INTEGER,
    task_note TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Task Replies
CREATE TABLE task_replies (
    reply_id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES operation_tasks(task_id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    visibility VARCHAR(20) DEFAULT 'internal',
    created_at TIMESTAMP DEFAULT now()
);

-- Moderation Feedback
CREATE TABLE moderation_feedback (
    feedback_id SERIAL PRIMARY KEY,
    target_type VARCHAR(50) NOT NULL,
    target_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    recipient_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- Escalations
CREATE TABLE escalations (
    escalation_id SERIAL PRIMARY KEY,
    source_task_id INTEGER REFERENCES operation_tasks(task_id) ON DELETE SET NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    reason TEXT NOT NULL,
    evidence_urls JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    resolution_note TEXT,
    created_at TIMESTAMP DEFAULT now(),
    resolved_at TIMESTAMP
);

-- System Notifications
CREATE TABLE system_notifications (
    notification_id SERIAL PRIMARY KEY,
    recipient_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now()
);

-- Host Contents
CREATE TABLE host_contents (
    host_content_id SERIAL PRIMARY KEY,
    host_content_author_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    host_content_title VARCHAR(255) NOT NULL,
    host_content_description TEXT,
    host_content_target_type VARCHAR(50) NOT NULL, -- post | shop | external
    host_content_target_id INTEGER, -- linked post_id or shop_id
    host_content_tracking_url TEXT,
    host_content_media_urls JSONB DEFAULT '[]'::jsonb,
    host_content_status VARCHAR(20) DEFAULT 'draft', -- draft | published
    host_content_view_count INTEGER DEFAULT 0,
    host_content_click_count INTEGER DEFAULT 0,
    host_content_created_at TIMESTAMP DEFAULT now(),
    host_content_updated_at TIMESTAMP DEFAULT now(),
    host_content_deleted_at TIMESTAMP
);

-- Host Earnings
CREATE TABLE host_earnings (
    host_earning_id SERIAL PRIMARY KEY,
    host_earning_host_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    host_earning_amount NUMERIC(15,2) NOT NULL,
    host_earning_status VARCHAR(20) DEFAULT 'pending', -- pending | available
    host_earning_source_type VARCHAR(50) NOT NULL, -- view | click | bonus
    host_earning_source_id INTEGER, -- linked host_content_id
    host_earning_created_at TIMESTAMP DEFAULT now()
);

-- Host Payout Requests
CREATE TABLE host_payout_requests (
    host_payout_id SERIAL PRIMARY KEY,
    host_payout_host_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    host_payout_amount NUMERIC(15,2) NOT NULL,
    host_payout_method VARCHAR(50) NOT NULL,
    host_payout_status VARCHAR(20) DEFAULT 'pending', -- pending | completed | rejected
    host_payout_note TEXT,
    host_payout_processed_at TIMESTAMP,
    host_payout_created_at TIMESTAMP DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Posts
CREATE INDEX post_search_idx ON posts USING gin (to_tsvector('simple', post_title));
CREATE INDEX post_category_idx ON posts USING btree (category_id);
CREATE INDEX post_status_idx ON posts USING btree (post_status);
CREATE INDEX post_price_idx ON posts USING btree (post_price);
CREATE INDEX post_location_idx ON posts USING btree (post_location);
CREATE INDEX idx_posts_author ON posts(post_author_id);
CREATE INDEX idx_posts_shop ON posts(post_shop_id);
CREATE INDEX idx_posts_published ON posts(post_published);
CREATE INDEX idx_posts_created ON posts(post_created_at);

-- Post Attribute Values
CREATE INDEX attribute_filter_idx ON post_attribute_values USING btree (post_id, attribute_id, attribute_value);

-- Collaborator Services
CREATE INDEX jobs_status_deadline_idx ON jobs(job_status, job_deadline);
CREATE INDEX jobs_collaborator_status_idx ON jobs(job_collaborator_id, job_status);
CREATE INDEX job_contact_requests_collaborator_created_idx ON job_contact_requests(contact_request_collaborator_id, contact_request_created_at);
CREATE INDEX job_contact_requests_job_created_idx ON job_contact_requests(contact_request_job_id, contact_request_created_at);
CREATE INDEX job_deliverables_job_submitted_idx ON job_deliverables(deliverable_job_id, deliverable_submitted_at);
CREATE INDEX earning_entries_collaborator_created_idx ON earning_entries(earning_entry_collaborator_id, earning_entry_created_at);
CREATE INDEX payout_requests_collaborator_created_idx ON payout_requests(payout_request_collaborator_id, payout_request_created_at);

-- Post Meta
CREATE INDEX idx_post_meta_post ON post_meta(post_meta_post_id);
CREATE INDEX idx_post_meta_key ON post_meta(post_meta_key);

-- Post Categories
CREATE INDEX idx_post_categories_post ON post_categories(post_category_post_id);
CREATE INDEX idx_post_categories_category ON post_categories(post_category_category_id);

-- Favorites & Blocks
CREATE INDEX idx_favorite_posts_user ON favorite_posts(favorite_post_user_id);
CREATE INDEX idx_favorite_posts_post ON favorite_posts(favorite_post_post_id);

-- Users
CREATE INDEX idx_users_mobile ON users(user_mobile);
CREATE INDEX idx_users_status ON users(user_status);
CREATE INDEX idx_users_business_role ON users(user_business_role_id);

-- Admins
CREATE INDEX idx_admins_email ON admins(admin_email);
CREATE INDEX idx_admins_username ON admins(admin_username);
CREATE INDEX idx_admins_status ON admins(admin_status);

-- Shops
CREATE INDEX idx_shops_status ON shops(shop_status);
CREATE INDEX idx_shops_vip_expires_at ON shops(shop_vip_expires_at);

-- Categories
CREATE INDEX idx_categories_parent ON categories(category_parent_id);
CREATE INDEX idx_categories_slug ON categories(category_slug);

-- Category Attributes
CREATE INDEX idx_category_attributes_category ON category_attributes(category_attribute_category_id);
CREATE INDEX idx_category_attributes_attribute ON category_attributes(category_attribute_attribute_id);
CREATE INDEX idx_category_attributes_status ON category_attributes(category_attribute_status);

-- Reports
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_post ON reports(post_id);
CREATE INDEX idx_reports_shop ON reports(report_shop_id);
CREATE INDEX idx_reports_status ON reports(report_status);

-- Promotions
CREATE INDEX idx_post_promotions_post ON post_promotions(post_promotion_post_id);
CREATE INDEX idx_post_promotions_slot ON post_promotions(post_promotion_slot_id);
CREATE INDEX idx_post_promotions_status ON post_promotions(post_promotion_status);
CREATE INDEX idx_post_promotions_dates ON post_promotions(post_promotion_start_at, post_promotion_end_at);

-- Promotion Package Prices
CREATE INDEX idx_pkg_prices_package      ON promotion_package_prices(package_id);
CREATE INDEX idx_pkg_prices_effective    ON promotion_package_prices(package_id, effective_from, effective_to);
-- Index nhanh cho truy vấn: "gói này có bảng giá nào chưa hết hạn?" (bao gồm cả giá tương lai)
CREATE INDEX idx_pkg_prices_open_ended   ON promotion_package_prices(package_id, effective_from) WHERE effective_to IS NULL;

-- Payments
CREATE INDEX idx_payment_txn_user        ON payment_txn(payment_txn_user_id);
CREATE INDEX idx_payment_txn_status      ON payment_txn(payment_txn_status);
CREATE INDEX idx_payment_txn_price       ON payment_txn(payment_txn_price_id);

CREATE INDEX user_posting_plans_user_status_idx
ON user_posting_plans(posting_plan_user_id, posting_plan_status);
CREATE INDEX user_posting_plans_code_status_idx
ON user_posting_plans(posting_plan_code, posting_plan_status);

CREATE INDEX posting_fee_ledger_user_created_idx
ON posting_fee_ledger(posting_fee_user_id, posting_fee_created_at);
CREATE INDEX posting_fee_ledger_post_created_idx
ON posting_fee_ledger(posting_fee_post_id, posting_fee_created_at);

-- Analytics
CREATE INDEX idx_daily_metrics_date ON daily_placement_metrics(daily_placement_metric_date);
CREATE INDEX idx_daily_metrics_slot ON daily_placement_metrics(daily_placement_metric_slot_id);

-- Event Logs
CREATE INDEX idx_event_logs_user ON event_logs(event_log_user_id);
CREATE INDEX idx_event_logs_type ON event_logs(event_log_event_type);
CREATE INDEX idx_event_logs_time ON event_logs(event_log_event_time);

-- Promotion Package Audit Log
CREATE INDEX idx_pkg_audit_package    ON promotion_package_audit_log(package_id);
CREATE INDEX idx_pkg_audit_price      ON promotion_package_audit_log(price_id);
CREATE INDEX idx_pkg_audit_action     ON promotion_package_audit_log(action_type);
CREATE INDEX idx_pkg_audit_changed_by ON promotion_package_audit_log(changed_by);
CREATE INDEX idx_pkg_audit_changed_at ON promotion_package_audit_log(changed_at DESC);

-- Internal Ops Indexes
CREATE INDEX idx_operation_tasks_assignee ON operation_tasks(assignee_id);
CREATE INDEX idx_operation_tasks_status ON operation_tasks(task_status);
CREATE INDEX idx_task_replies_task ON task_replies(task_id);
CREATE INDEX idx_escalations_status ON escalations(status);
CREATE INDEX idx_system_notifications_recipient ON system_notifications(recipient_id);
CREATE INDEX idx_system_notifications_read ON system_notifications(read_status);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();
CREATE TRIGGER update_business_roles_updated_at BEFORE UPDATE ON business_roles FOR EACH ROW EXECUTE FUNCTION update_business_role_updated_at();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_category_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_user_updated_at();
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION update_shop_updated_at();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_post_updated_at();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_report_updated_at();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_system_setting_updated_at();

-- Audit triggers cho promotion packages
CREATE TRIGGER trg_audit_promotion_packages
    AFTER INSERT OR UPDATE ON promotion_packages
    FOR EACH ROW EXECUTE FUNCTION log_promotion_package_changes();

CREATE TRIGGER trg_audit_promotion_prices
    AFTER INSERT OR UPDATE ON promotion_package_prices
    FOR EACH ROW EXECUTE FUNCTION log_promotion_price_changes();

-- ============================================================
-- SEED DATA
-- ============================================================

-- Roles
INSERT INTO roles (role_id, role_code, role_title) VALUES
(1, 'ROLE_SUPER_ADMIN', 'Super Administrator'),
(2, 'ROLE_ADMIN', 'Administrator'),
(3, 'ROLE_SUPPORT', 'Support Staff');

-- Admins (Password hash cho '123456' - demo only)
INSERT INTO admins (admin_id, admin_email, admin_username, admin_password_hash, admin_full_name, admin_status) VALUES
(1, 'admin@greenmarket.com', 'admin', '$2b$10$wE0vD8A5q0oR9.wR1mD3AeS6A0s6yD0R1D.R.R.R.R.R.R.R', 'Hệ Thống Admin', 'active'),
(2, 'mod@greenmarket.com', 'moderator', '$2b$10$wE0vD8A5q0oR9.wR1mD3AeS6A0s6yD0R1D.R.R.R.R.R.R.R', 'Kiểm Duyệt Viên', 'active');

-- Mapping Admin-Roles
INSERT INTO admin_roles (admin_role_admin_id, admin_role_role_id) VALUES
(1, 1),
(2, 2);

-- Normalize demo admin passwords to the real bcrypt hash for '123456'
UPDATE admins
SET admin_password_hash = '$2b$10$KH82bHpUqKJPRktGSh7osORZI..Ie0E18FqB4I8xewhQAKa13x71m'
WHERE admin_email IN ('admin@greenmarket.com', 'mod@greenmarket.com');

-- Business Roles
INSERT INTO business_roles (
    business_role_id,
    business_role_code,
    business_role_title,
    business_role_audience_group,
    business_role_access_scope,
    business_role_summary,
    business_role_responsibilities,
    business_role_capabilities,
    business_role_status
) VALUES
(
    1,
    'USER',
    'User',
    'Marketplace',
    'User Web + User App',
    'Marketplace customer role used by buyers and visitors who explore ornamental plant listings.',
    '["Browse listings", "Save favorites", "Contact sellers", "Submit reports"]'::jsonb,
    '["View approved posts", "Report listings", "Track personal purchase and contact history"]'::jsonb,
    'active'
),
(
    2,
    'HOST',
    'Host',
    'Marketplace',
    'Mobile App',
    'Seller-side business role for shop owners who list ornamental plants and manage promotion packages.',
    '["Manage storefront profile", "Publish and update listings", "Review promotion package options"]'::jsonb,
    '["Create and maintain listings", "Manage shop content", "Request payout for host earnings"]'::jsonb,
    'active'
),
(
    3,
    'COLLABORATOR',
    'Collaborator',
    'Marketplace',
    'Mobile App',
    'Freelance collaborator role for plant care or support jobs available inside the marketplace ecosystem.',
    '["Browse available jobs", "Accept or decline assignments", "Submit work results"]'::jsonb,
    '["Track assigned jobs", "Upload deliverables", "Request payout for completed work"]'::jsonb,
    'active'
),
(
    4,
    'MANAGER',
    'Manager',
    'Marketplace',
    'Mobile App',
    'Operational manager role for moderation-oriented tasks and report resolution flows.',
    '["Review moderation queue", "Resolve reports", "Track moderation quality"]'::jsonb,
    '["Inspect report evidence", "Approve or reject pending actions", "Monitor marketplace quality"]'::jsonb,
    'active'
),
(
    5,
    'OPERATION_STAFF',
    'Operation Staff',
    'Marketplace',
    'Mobile App',
    'Internal operations support role for task handling and day-to-day support workload.',
    '["Handle support requests", "Track assigned internal tasks", "Coordinate operational follow-up"]'::jsonb,
    '["Update task status", "Review support workload", "Escalate issues to managers"]'::jsonb,
    'active'
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Function to sync shop_email to users.user_email
CREATE OR REPLACE FUNCTION sync_shop_to_user_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync email if changed
    IF (NEW.shop_email IS DISTINCT FROM OLD.shop_email) THEN
        UPDATE users 
        SET user_email = NEW.shop_email 
        WHERE user_id = NEW.shop_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for shops table
CREATE TRIGGER trg_sync_shop_to_user_email
AFTER UPDATE OF shop_email ON shops
FOR EACH ROW
EXECUTE FUNCTION sync_shop_to_user_email();

-- Users
INSERT INTO users (
    user_id,
    user_mobile,
    user_display_name,
    user_email,
    user_location,
    user_bio,
    user_status,
    user_business_role_id
) VALUES
(1, '0978195419', 'Nguyễn Thành Nam', 'nguyenthanhnamidol@gmail.com', 'Yên Phong, Bắc Ninh', 'Marketplace account used for general buyer and seller demo flows.', 'active', 2),
(2, '0982703398', 'Trần Văn Bonsai', 'bonsai.tran@gmail.com', 'Hoàng Mai, Hà Nội', 'Shop owner account used to demonstrate host storefront behaviour.', 'active', 2),
(3, '0123456789', 'Lê Hoài Nam', 'hoainam.le@gmail.com', 'Nam Trực, Nam Định', 'Marketplace user account with host permissions for additional shop demo content.', 'active', 2),
(4, '0912345678', 'Trần Thị Kiểng', 'kieng.tran@gmail.com', 'Chợ Lách, Bến Tre', 'Collaborator demo account for mobile job and earnings scenarios.', 'active', 2),
(5, '0966778899', 'Phạm Quốc Huy', 'huy.pham@gmail.com', 'Đống Đa, Hà Nội', 'Manager demo account for moderation queue and report resolution.', 'active', 4),
(6, '0935112233', 'Đặng Minh Tuấn', 'tuan.dang@gmail.com', 'Đông Anh, Hà Nội', 'Operations support demo account for internal task handling.', 'active', 2),
(7, '0901223344', 'Võ Thị Lan', 'lan.vo@gmail.com', 'Long Biên, Hà Nội', 'Marketplace customer demo account for favorites and reporting flows.', 'active', 1),
(8, '0987654321', 'Người Dùng Test 0987654321', 'test.0987654321@gmail.com', 'Hà Nội', 'Test account for 0987654321', 'active', 1),
(9, '0909000003', 'Seed Collaborator Account', 'seed.collaborator@greenmarket.local', 'Ha Noi', 'Seed account for collaborator-role API testing and mobile login.', 'active', 3),
(10, '0909000004', 'Seed Manager Account', 'seed.manager@greenmarket.local', 'Ha Noi', 'Seed account for manager-role API testing and moderation workflows.', 'active', 4),
(136, '0998887776', 'Seed Host Account', 'seed.host@greenmarket.local', 'Ha Noi', 'Seed account for host-role API testing and content management.', 'active', 2),
(137, '0997776665', 'Seed Operation Account', 'seed.operation@greenmarket.local', 'Ha Noi', 'Seed account for operations-staff-role testing and task handling.', 'active', 5);

-- Align demo accounts to business roles used in collaborator APIs
UPDATE users SET user_business_role_id = 3 WHERE user_id = 4;
UPDATE users SET user_business_role_id = 5 WHERE user_id = 6;

-- Collaborator availability profile (mock)
UPDATE users
SET
    user_availability_status = 'available',
    user_availability_note = 'Available 08:00-18:00, Monday to Saturday.'
WHERE user_id = 4;
UPDATE users
SET
    user_availability_status = 'available',
    user_availability_note = 'Available for field support and content delivery tasks.'
WHERE user_id = 9;
UPDATE users
SET
    user_availability_status = 'busy',
    user_availability_note = 'Focused on moderation incidents this week.'
WHERE user_id = 5;
UPDATE users
SET
    user_availability_status = 'busy',
    user_availability_note = 'Handling moderation queue and escalation workflow.'
WHERE user_id = 10;
UPDATE users
SET
    user_availability_status = 'busy'
WHERE user_id = 6;

-- Collaborator Jobs (Mock)
INSERT INTO jobs (
    job_id,
    job_customer_id,
    job_collaborator_id,
    job_title,
    job_category,
    job_location,
    job_deadline,
    job_price,
    job_description,
    job_requirements,
    job_status,
    job_decline_reason,
    job_completed_at,
    job_created_at,
    job_updated_at
) VALUES
(1, 7, NULL, 'Photo package for bonsai listing', 'Photo', 'Long Bien, Ha Noi', now() + interval '3 days', 650000, 'Need 12 listing photos for a bonsai package.', '["24MP camera","4:3 ratio","clean background"]'::jsonb, 'open', NULL, NULL, now() - interval '1 day', now() - interval '1 day'),
(2, 2, 4, 'SEO content for Linh Sam posts', 'Content', 'Hoang Mai, Ha Noi', now() + interval '1 day', 800000, 'Write SEO-ready descriptions for 20 Linh Sam posts.', '["min 600 words","H2/H3 headings","persuasive tone"]'::jsonb, 'accepted', NULL, NULL, now() - interval '2 days', now() - interval '6 hours'),
(3, 1, 4, 'Deliver final bonsai album', 'Photo', 'Yen Phong, Bac Ninh', now() - interval '2 days', 720000, 'Finalized photo album package for Tung La Han listing.', '["20 JPEG photos","3 cover images","source files + web files"]'::jsonb, 'completed', NULL, now() - interval '2 days', now() - interval '4 days', now() - interval '2 days');

INSERT INTO job_contact_requests (
    contact_request_id,
    contact_request_job_id,
    contact_request_collaborator_id,
    contact_request_customer_id,
    contact_request_message,
    contact_request_status,
    contact_request_created_at,
    contact_request_replied_at
) VALUES
(1, 2, 4, 2, 'Can you clarify the exact keyword set and tone before delivery?', 'sent', now() - interval '8 hours', NULL);

INSERT INTO job_deliverables (
    deliverable_id,
    deliverable_job_id,
    deliverable_collaborator_id,
    deliverable_file_urls,
    deliverable_note,
    deliverable_submitted_at
) VALUES
(1, 3, 4, '["https://cdn.greenmarket.local/jobs/3/cover-1.jpg","https://cdn.greenmarket.local/jobs/3/album.zip"]'::jsonb, 'Uploaded full album and source zip.', now() - interval '2 days');

INSERT INTO earning_entries (
    earning_entry_id,
    earning_entry_collaborator_id,
    earning_entry_job_id,
    earning_entry_amount,
    earning_entry_type,
    earning_entry_created_at
) VALUES
(1, 4, 3, 720000, 'job', now() - interval '2 days');

INSERT INTO payout_requests (
    payout_request_id,
    payout_request_collaborator_id,
    payout_request_amount,
    payout_request_method,
    payout_request_status,
    payout_request_note,
    payout_request_created_at,
    payout_request_processed_at
) VALUES
(1, 4, 500000, 'Bank transfer', 'pending', 'Weekly payout request (mock).', now() - interval '1 day', NULL);

-- Host Contents (Mock)
INSERT INTO host_contents (host_content_id, host_content_author_id, host_content_title, host_content_target_type, host_content_target_id, host_content_tracking_url, host_content_status, host_content_view_count, host_content_click_count) VALUES
(1, 1, 'Top 5 loại Tùng La Hán đẹp nhất 2026', 'shop', 3, '/api/host/tracking/1', 'published', 1250, 45),
(2, 1, 'Review bộ kéo cắt tỉa cây cảnh của Shop A', 'post', 1, '/api/host/tracking/2', 'published', 890, 12),
(3, 2, 'Kỹ thuật chăm sóc Mai Chiếu Thủy mùa mưa', 'external', NULL, 'https://external-blog.com/care-guide', 'published', 450, 5);

-- Host Earnings (Mock)
INSERT INTO host_earnings (host_earning_id, host_earning_host_id, host_earning_amount, host_earning_status, host_earning_source_type, host_earning_source_id) VALUES
(1, 1, 225000, 'available', 'click', 1),
(2, 1, 60000, 'pending', 'view', 1),
(3, 1, 500000, 'available', 'bonus', NULL);

-- Host Payout Requests (Mock)
INSERT INTO host_payout_requests (host_payout_id, host_payout_host_id, host_payout_amount, host_payout_method, host_payout_status, host_payout_note) VALUES
(1, 1, 600000, 'Momo', 'completed', 'Thanh toán đợt 1 tháng 4.');

-- Shops
INSERT INTO shops (shop_id, shop_name, shop_phone, shop_email, shop_email_verified, shop_location, shop_description, shop_cover_url, shop_status, shop_vip_started_at, shop_vip_expires_at, shop_lat, shop_lng) VALUES
(1, 'Vườn Bonsai Phố Huyện', '0978195419', 'nguyenthanhnamidol@gmail.com', TRUE, '14 Nghiêm Ích Khiêm, Thị trấn Chờ, Yên Phong, Bắc Ninh',
    'Chuyên bonsai mini và tầm trung. Nhận thiết kế, chăm sóc và phối thế bonsai theo yêu cầu. Ship toàn quốc qua Viettel Post.',
    '/uploads/shop/vuon-bonsai-pho-huyen-1.jpg|/uploads/shop/vuon-bonsai-pho-huyen-2.jpg', 'active', now() - interval '30 days', now() + interval '60 days', 21.201262, 105.950174),
(3, 'Nam Định Art Garden', '0123456789', 'hoainam.le@gmail.com', TRUE, 'Nam Trực, Nam Định',
    'Nghệ nhân cây cảnh cổ truyền Nam Điền. Chuyên sanh, si, tùng la hán cốt cách truyền thống. Hơn 20 năm kinh nghiệm.',
    '/uploads/shop/nam-dinh-art-garden.jpg', 'active', NULL, NULL, 20.2506, 106.2355),
(4, 'Thế Giới Cây Kiểng Miền Tây', '0912345678', 'kieng.tran@gmail.com', TRUE, 'Chợ Lách, Bến Tre',
    'Chuyên cung cấp Linh Sam, Mai Chiếu Thủy, bonsai hoa quả số lượng lớn. Bao ship đồng bằng sông Cửu Long.',
    '/uploads/shop/cay-kieng-mien-tay.jpg', 'active', NULL, NULL, 10.2350, 106.1511),
(6, 'Dụng Cụ Bonsai Pro', '0935112233', 'tuan.dang@gmail.com', TRUE, 'Đông Anh, Hà Nội',
    'Nhập khẩu và phân phối dụng cụ bonsai chính hãng Nhật Bản: kéo Kaneshin, kìm Masakuni, đất Akadama, chậu Tokoname.',
    '/uploads/shop/dung-cu-bonsai-pro.jpg', 'active', NULL, NULL, 21.1395, 105.8544);

-- ============================================================
-- CATEGORIES
-- Chỉ 2 danh mục chính: Cây Cảnh Bonsai + Dụng Cụ Làm Vườn
-- ============================================================
INSERT INTO categories (category_id, category_parent_id, category_title, category_slug, category_published) VALUES
-- Danh mục gốc
(1,  NULL, 'Cây Cảnh Bonsai',       'cay-canh-bonsai',     true),
(2,  NULL, 'Dụng Cụ Làm Vườn',      'dung-cu-lam-vuon',    true),
-- Sub: Cây Cảnh Bonsai
(11, 1,    'Bonsai Mini (Mame/Shito)', 'bonsai-mini',       true),
(12, 1,    'Bonsai Tầm Trung',        'bonsai-tam-trung',   true),
(13, 1,    'Bonsai Đại (San Vườn)',    'bonsai-dai',         true),
(14, 1,    'Bonsai Phong Thủy',       'bonsai-phong-thuy',  true),
(15, 1,    'Bonsai Hoa & Quả',        'bonsai-hoa-qua',     true),
-- Sub: Dụng Cụ Làm Vườn
(21, 2,    'Kéo Tỉa & Kìm Cạp',      'keo-tia-kim-cap',    true),
(22, 2,    'Đất & Giá Thể',           'dat-gia-the',        true),
(23, 2,    'Chậu & Khay Bonsai',      'chau-khay-bonsai',   true),
(24, 2,    'Dây Buộc & Phụ Kiện Uốn', 'day-buoc-phu-kien-uon', true),
(25, 2,    'Bình Tưới & Phun Sương',  'binh-tuoi-phun-suong', true);

-- ============================================================
-- ATTRIBUTES
-- ============================================================
INSERT INTO attributes (attribute_id, attribute_code, attribute_title, attribute_data_type, attribute_options, attribute_published) VALUES
-- Dành cho Cây Cảnh Bonsai
(1, 'dang_cay',   'Dáng Thế',         'enum',   '["Dáng Trực","Dáng Xiên","Dáng Hoành","Dáng Huyền","Dáng Văn Nhân","Dáng Thác Đổ","Dáng Bạt Phong","Dáng Song Thụ"]', true),
(2, 'chieu_cao',  'Chiều cao (cm)',    'number', NULL, true),
(3, 'hoanh_goc',  'Hoành gốc (cm)',   'number', NULL, true),
(4, 'tuoi_cay',   'Tuổi cây (năm)',   'number', NULL, true),
(5, 'nguon_goc',  'Nguồn gốc',        'text',   NULL, true),
-- Dành cho Dụng Cụ Làm Vườn
(6, 'chat_lieu',  'Chất liệu',        'enum',   '["Thép Carbon","Thép Không Gỉ (Inox)","Nhựa PP","Gỗ","Nhôm","Đồng Thau","Gốm Nung"]', true),
(7, 'thuong_hieu','Thương hiệu',      'text',   NULL, true),
(8, 'xuat_xu',    'Xuất xứ',          'enum',   '["Nhật Bản","Trung Quốc","Việt Nam","Đài Loan","Hàn Quốc"]', true);

-- Category-Attribute Mapping
INSERT INTO category_attributes (
    category_attribute_category_id,
    category_attribute_attribute_id,
    category_attribute_required,
    category_attribute_display_order,
    category_attribute_status
) VALUES
-- Cây Cảnh Bonsai (gốc) → kế thừa cho tất cả sub
(1,  1, true,  1, 'Active'),
(1,  2, true,  2, 'Active'),
(1,  3, false, 3, 'Active'),
(1,  4, false, 4, 'Active'),
(1,  5, false, 5, 'Active'),
-- Bonsai Mini
(11, 1, true,  1, 'Active'),
(11, 2, true,  2, 'Active'),
(11, 3, true,  3, 'Active'),
-- Bonsai Tầm Trung
(12, 1, true,  1, 'Active'),
(12, 2, true,  2, 'Active'),
(12, 3, true,  3, 'Active'),
(12, 4, false, 4, 'Active'),
-- Bonsai Đại
(13, 1, true,  1, 'Active'),
(13, 2, true,  2, 'Active'),
(13, 3, true,  3, 'Active'),
(13, 4, true,  4, 'Active'),
(13, 5, false, 5, 'Active'),
-- Bonsai Phong Thủy
(14, 1, true,  1, 'Active'),
(14, 2, true,  2, 'Active'),
-- Bonsai Hoa & Quả
(15, 1, true,  1, 'Active'),
(15, 2, true,  2, 'Active'),
(15, 5, false, 3, 'Active'),
-- Dụng Cụ Làm Vườn (gốc)
(2,  6, true,  1, 'Active'),
(2,  7, false, 2, 'Active'),
(2,  8, false, 3, 'Active'),
-- Kéo Tỉa & Kìm Cạp
(21, 6, true,  1, 'Active'),
(21, 7, true,  2, 'Active'),
(21, 8, true,  3, 'Active'),
-- Đất & Giá Thể
(22, 7, false, 1, 'Active'),
(22, 8, true,  2, 'Active'),
-- Chậu & Khay Bonsai
(23, 6, true,  1, 'Active'),
(23, 7, false, 2, 'Active'),
(23, 8, true,  3, 'Active'),
-- Dây Buộc & Phụ Kiện Uốn
(24, 6, true,  1, 'Active'),
(24, 8, false, 2, 'Active'),
-- Bình Tưới & Phun Sương
(25, 6, true,  1, 'Active'),
(25, 7, false, 2, 'Active'),
(25, 8, false, 3, 'Active');

-- ============================================================
-- POSTS (15 bài đăng: 9 bonsai + 6 dụng cụ)
-- ============================================================
INSERT INTO posts (post_id, post_author_id, post_shop_id, category_id, post_title, post_slug, post_price, post_location, post_status, post_contact_phone, post_view_count, post_contact_count, post_published, post_submitted_at, post_published_at) VALUES
-- === CÂY CẢNH BONSAI ===
(1,  1, 1, 11, 'Sanh Nam Điền Mini Dáng Văn Nhân',
    'sanh-nam-dien-mini-dang-van-nhan',
    2500000, 'Yên Phong, Bắc Ninh', 'approved', '0978195419', 234, 12, true, now() - interval '30 days', now() - interval '29 days'),

(2,  3, 3, 12, 'Tùng La Hán Dáng Trực Cổ Thụ',
    'tung-la-han-dang-truc-co-thu',
    150000000, 'Nam Trực, Nam Định', 'approved', '0123456789', 1520, 45, true, now() - interval '25 days', now() - interval '24 days'),

(3,  4, 3, 12, 'Linh Sam Sông Hinh Lũa Thép',
    'linh-sam-song-hinh-lua-thep',
    8500000, 'Chợ Lách, Bến Tre', 'approved', '0912345678', 876, 28, true, now() - interval '20 days', now() - interval '19 days'),

(4,  3, 3, 13, 'Sanh Quê Dáng Làng Đại Thụ',
    'sanh-que-dang-lang-dai-thu',
    45000000, 'Nam Trực, Nam Định', 'approved', '0123456789', 432, 15, true, now() - interval '18 days', now() - interval '17 days'),

(5,  4, 3, 11, 'Mai Chiếu Thủy Nu Gò Công Mini',
    'mai-chieu-thuy-nu-go-cong-mini',
    3500000, 'Chợ Lách, Bến Tre', 'approved', '0912345678', 567, 19, true, now() - interval '15 days', now() - interval '14 days'),

(6,  2, NULL, 12, 'Thông Đen Nhật Bản Thành Thẩm',
    'thong-den-nhat-ban-thanh-tham',
    25000000, 'Hoàng Mai, Hà Nội', 'approved', '0982703398', 345, 8, true, now() - interval '12 days', now() - interval '11 days'),

(7,  1, 1, 14, 'Si Bonsai Phong Thủy Tài Lộc',
    'si-bonsai-phong-thuy-tai-loc',
    4200000, 'Yên Phong, Bắc Ninh', 'approved', '0978195419', 189, 7, true, now() - interval '10 days', now() - interval '9 days'),

(8,  4, 3, 15, 'Mai Vàng Bonsai Nghệ Thuật',
    'mai-vang-bonsai-nghe-thuat',
    12000000, 'Chợ Lách, Bến Tre', 'approved', '0912345678', 723, 31, true, now() - interval '8 days', now() - interval '7 days'),

(9,  3, 3, 11, 'Tùng Bách Tán Lùn Nhật Mini',
    'tung-bach-tan-lun-nhat-mini',
    6800000, 'Nam Trực, Nam Định', 'approved', '0123456789', 298, 11, true, now() - interval '5 days', now() - interval '4 days'),

-- === DỤNG CỤ LÀM VƯỜN ===
(10, 1, 1, 21, 'Kìm Cạp Xéo Thép Đen Nhật Bản Kaneshin',
    'kim-cap-xeo-thep-den-kaneshin',
    1200000, 'Đông Anh, Hà Nội', 'approved', '0935112233', 156, 22, true, now() - interval '28 days', now() - interval '27 days'),

(11, 6, 4, 21, 'Bộ Kéo Tỉa Bonsai Cao Cấp 5 Món',
    'bo-keo-tia-bonsai-cao-cap-5-mon',
    2850000, 'Đông Anh, Hà Nội', 'approved', '0935112233', 412, 35, true, now() - interval '22 days', now() - interval '21 days'),

(12, 6, 4, 22, 'Đất Akadama Nhật Bản Túi 14L',
    'dat-akadama-nhat-ban-14l',
    320000, 'Đông Anh, Hà Nội', 'approved', '0935112233', 534, 48, true, now() - interval '26 days', now() - interval '25 days'),

(13, 6, 4, 23, 'Chậu Tokoname Men Xanh Ngọc Nhật Bản',
    'chau-tokoname-men-xanh-ngoc',
    850000, 'Đông Anh, Hà Nội', 'approved', '0935112233', 267, 16, true, now() - interval '16 days', now() - interval '15 days'),

(14, 6, 4, 24, 'Bộ Dây Nhôm Uốn Cành 6 Size',
    'bo-day-nhom-uon-canh-6-size',
    280000, 'Đông Anh, Hà Nội', 'approved', '0935112233', 189, 27, true, now() - interval '14 days', now() - interval '13 days'),

(15, 1, 1, 25, 'Bình Phun Sương Đồng Thau Kiểu Nhật',
    'binh-phun-suong-dong-thau-kieu-nhat',
    450000, 'Yên Phong, Bắc Ninh', 'approved', '0978195419', 123, 9, true, now() - interval '7 days', now() - interval '6 days'),

(16, 8, NULL, 11, 'Cây Bonsai Test 0987654321',
    'cay-bonsai-test-0987654321',
    1500000, 'Hà Nội', 'approved', '0987654321', 10, 2, true, now() - interval '1 days', now() - interval '1 days');

-- Post Attribute Values
INSERT INTO post_attribute_values (post_id, attribute_id, attribute_value) VALUES
-- Post 1: Sanh Mini
(1,  1, 'Dáng Văn Nhân'), (1,  2, '25'),  (1,  3, '15'),  (1,  4, '15'),
-- Post 2: Tùng La Hán
(2,  1, 'Dáng Trực'),     (2,  2, '180'), (2,  3, '85'),  (2,  4, '35'), (2,  5, 'Nam Định'),
-- Post 3: Linh Sam
(3,  1, 'Dáng Thác Đổ'),  (3,  2, '45'),  (3,  3, '28'),  (3,  4, '8'),  (3,  5, 'Sông Hinh, Phú Yên'),
-- Post 4: Sanh Quê Đại
(4,  1, 'Dáng Trực'),     (4,  2, '300'), (4,  3, '120'), (4,  4, '30'), (4,  5, 'Nam Định'),
-- Post 5: MCT Mini
(5,  1, 'Dáng Hoành'),    (5,  2, '15'),  (5,  3, '22'),  (5,  5, 'Gò Công, Tiền Giang'),
-- Post 6: Thông Đen
(6,  1, 'Dáng Trực'),     (6,  2, '55'),  (6,  3, '18'),  (6,  4, '10'), (6,  5, 'Nhập khẩu Nhật Bản'),
-- Post 7: Si Phong Thủy
(7,  1, 'Dáng Trực'),     (7,  2, '40'),  (7,  3, '25'),
-- Post 8: Mai Vàng
(8,  1, 'Dáng Hoành'),    (8,  2, '60'),  (8,  3, '35'),  (8,  4, '12'), (8,  5, 'Bến Tre'),
-- Post 9: Tùng Bách Tán
(9,  1, 'Dáng Xiên'),     (9,  2, '20'),  (9,  3, '12'),  (9,  5, 'Giống Nhật Bản'),
-- Post 10: Kìm Cạp Kaneshin
(10, 6, 'Thép Carbon'),   (10, 7, 'Kaneshin'),            (10, 8, 'Nhật Bản'),
-- Post 11: Bộ Kéo 5 Món
(11, 6, 'Thép Không Gỉ (Inox)'), (11, 7, 'TianBonsai'),  (11, 8, 'Trung Quốc'),
-- Post 12: Đất Akadama
(12, 7, 'Ibaraki Akadama'),       (12, 8, 'Nhật Bản'),
-- Post 13: Chậu Tokoname
(13, 6, 'Gốm Nung'),     (13, 7, 'Tokoname'),            (13, 8, 'Nhật Bản'),
-- Post 14: Dây Nhôm
(14, 6, 'Nhôm'),          (14, 8, 'Trung Quốc'),
-- Post 15: Bình Phun Sương
(15, 6, 'Đồng Thau'),     (15, 8, 'Nhật Bản');

-- Post Images
INSERT INTO post_images (post_id, image_url, image_sort_order) VALUES
(1,  '/uploads/sanh-nam-dien-mini-1.jpg', 0),
(1,  '/uploads/sanh-nam-dien-mini-2.jpg', 1),
(1,  '/uploads/sanh-nam-dien-mini-3.jpg', 2),
(2,  '/uploads/tung-la-han-1.jpg', 0),
(2,  '/uploads/tung-la-han-2.jpg', 1),
(3,  '/uploads/linh-sam-1.jpg', 0),
(3,  '/uploads/linh-sam-2.jpg', 1),
(4,  '/uploads/sanh-que-dai-1.jpg', 0),
(5,  '/uploads/mct-mini-1.jpg', 0),
(5,  '/uploads/mct-mini-2.jpg', 1),
(6,  '/uploads/thong-den-1.jpg', 0),
(7,  '/uploads/si-phong-thuy-1.jpg', 0),
(8,  '/uploads/mai-vang-1.jpg', 0),
(8,  '/uploads/mai-vang-2.jpg', 1),
(9,  '/uploads/tung-bach-tan-1.jpg', 0),
(10, '/uploads/kim-cap-kaneshin-1.jpg', 0),
(11, '/uploads/bo-keo-5-mon-1.jpg', 0),
(11, '/uploads/bo-keo-5-mon-2.jpg', 1),
(12, '/uploads/dat-akadama-1.jpg', 0),
(13, '/uploads/chau-tokoname-1.jpg', 0),
(13, '/uploads/chau-tokoname-2.jpg', 1),
(14, '/uploads/day-nhom-uon-1.jpg', 0),
(15, '/uploads/binh-phun-suong-1.jpg', 0);

-- Favorite Posts (Bookmarks)
INSERT INTO favorite_posts (favorite_post_user_id, favorite_post_post_id, favorite_post_created_at) VALUES
(5, 1, now() - interval '20 days'),
(5, 3, now() - interval '15 days'),
(5, 8, now() - interval '5 days'),
(7, 2, now() - interval '18 days'),
(7, 5, now() - interval '10 days'),
(7, 13, now() - interval '8 days'),
(2, 9, now() - interval '3 days');

-- ============================================================
-- PLACEMENT SLOTS & PROMOTION PACKAGES
-- ============================================================
INSERT INTO placement_slots (placement_slot_id, placement_slot_code, placement_slot_title, placement_slot_capacity, placement_slot_rules, placement_slot_published) VALUES
(1, 'BOOST_POST', 'Day bai nha vuon', 200, '{"max_per_shop": 20, "min_post_status": "approved", "audience": "active-shop"}', true),
(2, 'SHOP_VIP', 'Nha vuon VIP', 500, '{"max_per_shop": 1, "display_priority": "top", "audience": "active-shop"}', true);

INSERT INTO promotion_packages (
    promotion_package_id,
    promotion_package_slot_id,
    promotion_package_title,
    promotion_package_duration_days,
    promotion_package_max_posts,
    promotion_package_display_quota,
    promotion_package_description,
    promotion_package_published
) VALUES
(1, 1, 'Gói tuần', 7, 1, 35000, 'Ưu tiên hiển thị bài đăng trong 7 ngày.', true),
(2, 1, 'Gói tháng', 30, 1, 180000, 'Ưu tiên hiển thị bài đăng trong 30 ngày.', true),
(3, 2, 'Gói Nhà vườn VIP (3 tháng)', 90, 1, 0, 'Ưu tiên hiển thị shop trong danh sách nhà vườn và hiển thị huy hiệu VIP.', true);

-- Promotion Package Prices (2 goi day bai + 1 goi Nha vuon VIP 3 thang)
INSERT INTO promotion_package_prices (package_id, price, effective_from, effective_to, note, created_by) VALUES
(1, 99000, now() - interval '90 days', NULL, 'Giá gói đẩy bài theo tuần', 1),
(2, 299000, now() - interval '90 days', NULL, 'Giá gói đẩy bài theo tháng', 1),
(3, 499000, now() - interval '90 days', NULL, 'Giá gói Nhà vườn VIP 3 tháng', 1);

-- ============================================================
-- POSTING PLANS (OWNER / PERSONAL)
-- ============================================================
INSERT INTO user_posting_plans (
    posting_plan_id,
    posting_plan_user_id,
    posting_plan_code,
    posting_plan_title,
    posting_plan_cycle,
    posting_plan_status,
    posting_plan_auto_approve,
    posting_plan_daily_post_limit,
    posting_plan_post_fee_amount,
    posting_plan_free_edit_quota,
    posting_plan_edit_fee_amount,
    posting_plan_started_at,
    posting_plan_expires_at,
    posting_plan_created_at,
    posting_plan_updated_at
) VALUES
(1, 1, 'GARDEN_OWNER_LIFETIME', 'Goi Chu Vuon Vinh Vien', 'lifetime', 'active', true, 20, 20000, 4, 5000, now() - interval '120 days', NULL, now() - interval '120 days', now() - interval '120 days'),
(2, 2, 'PERSONAL_MONTHLY',      'Goi Ca Nhan Theo Thang', 'monthly',  'active', true, 20,     0, 4, 5000, now() - interval '12 days',  now() + interval '18 days', now() - interval '12 days', now() - interval '12 days'),
(3, 7, 'PERSONAL_MONTHLY',      'Goi Ca Nhan Theo Thang', 'monthly',  'expired', true, 20,    0, 4, 5000, now() - interval '65 days', now() - interval '35 days', now() - interval '65 days', now() - interval '35 days');

-- Fee ledger demo for posting-plan billing (tracking only)
INSERT INTO posting_fee_ledger (
    posting_fee_id,
    posting_fee_user_id,
    posting_fee_post_id,
    posting_fee_plan_id,
    posting_fee_action_type,
    posting_fee_quantity,
    posting_fee_unit_amount,
    posting_fee_total_amount,
    posting_fee_currency,
    posting_fee_note,
    posting_fee_created_at
) VALUES
(1, 1, 15, NULL, 'POST_CREATE', 1, 20000, 20000, 'VND', 'Owner plan create-post fee tracking.', now() - interval '7 days'),
(2, 3, 9,  NULL, 'POST_CREATE', 1, 20000, 20000, 'VND', 'Owner plan create-post fee tracking.', now() - interval '5 days'),
(3, 1, 7,  NULL, 'POST_EDIT',   1, 5000,  5000,  'VND', 'Charged after free edit quota was exhausted.', now() - interval '2 days'),
(4, 2, 6,  2,    'POST_EDIT',   1, 5000,  5000,  'VND', 'Monthly personal plan paid edit beyond free quota.', now() - interval '1 day');

-- ============================================================
-- BANNED KEYWORDS
-- ============================================================
INSERT INTO banned_keywords (banned_keyword_keyword, banned_keyword_published) VALUES
('lừa đảo', true),
('scam', true),
('fake', true),
('hàng giả', true),
('cây chết', true),
('gỗ lậu', true);

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================
INSERT INTO system_settings (system_setting_key, system_setting_value, system_setting_updated_by) VALUES
('site_name', 'GreenMarket', 1),
('site_description', 'Sàn mua bán cây cảnh bonsai và dụng cụ làm vườn hàng đầu Việt Nam', 1),
('max_images_per_post', '10', 1),
('max_video_per_post', '2', 1),
('post_auto_approve', 'false', 1),
('otp_expire_minutes', '10', 1),
('vnpay_sandbox', 'true', 1),
('contact_email', 'support@greenmarket.com', 1),
('contact_phone', '1900-xxxx', 1),
('admin_web_settings', '{"general":{"platformName":"GreenMarket","supportEmail":"support@greenmarket.vn","defaultLanguage":"English"},"moderation":{"autoModeration":true,"bannedKeywordFilter":true,"reportLimit":5},"postLifecycle":{"postExpiryDays":30,"restoreWindowDays":7,"allowAutoExpire":true},"media":{"maxImagesPerPost":10,"maxFileSizeMb":5,"enableImageCompression":true}}', 1),
('admin_template_builder_preset', '{"selectedTemplateId":null,"selectedTypeFilter":"All","channel":"Email","audience":"Seller","tone":"Supportive","shopName":"Green Corner Garden","postTitle":"Rare Monstera Deliciosa for Sale","reason":"Listing is missing mandatory details.","slotName":"Home Top","contactEmail":"ops@greenmarket.com","adminNote":"Update the content and resubmit within 24 hours."}', 1),
('admin_ai_insight_settings', '{"autoDailySummary":true,"anomalyAlerts":true,"operatorDigest":false,"recommendationTone":"Balanced","confidenceThreshold":78,"promptVersion":"gm-admin-v1.4","reviewMode":"Required"}', 1);

-- OTP Requests (Sample)
INSERT INTO otp_requests (otp_request_mobile, otp_request_otp_code, otp_request_expire_at, otp_request_status) VALUES
('0978195419', '123456', now() + interval '10 minutes', 'verified'),
('0982703398', '654321', now() + interval '10 minutes', 'pending');

-- ============================================================
-- ADMIN TEMPLATES
-- ============================================================
INSERT INTO admin_templates (
    template_id,
    template_name,
    template_type,
    template_content,
    template_status,
    template_created_by,
    template_created_at,
    template_updated_by,
    template_updated_at
) VALUES
(1, 'Post Rejection - Invalid Content', 'Rejection Reason', 'Your post violates GreenMarket content policy because the uploaded media does not match the listing details. Please revise the content and submit again.', 'Active', 1, '2026-03-10 09:00:00', 1, '2026-03-14 10:15:00'),
(2, 'Post Rejection - Missing Information', 'Rejection Reason', 'Your post is missing required information such as care notes, product size, or accurate pricing. Please complete the details before resubmitting.', 'Active', 1, '2026-03-11 09:20:00', 1, '2026-03-13 08:30:00'),
(3, 'Report Reason - Spam Content', 'Report Reason', 'This listing appears to contain repetitive promotional messaging, external contact spam, or misleading attention bait.', 'Active', 1, '2026-03-08 13:00:00', 1, '2026-03-12 14:10:00'),
(4, 'Report Reason - Suspicious Pricing', 'Report Reason', 'This listing price deviates significantly from comparable marketplace items and should be reviewed manually by the moderation team.', 'Active', 1, '2026-03-09 11:10:00', 1, '2026-03-12 16:05:00'),
(5, 'Notification - Payment Verification', 'Notification', 'We received your transfer confirmation. GreenMarket admin is verifying the payment before reopening or updating your promotion package.', 'Active', 1, '2026-03-15 10:00:00', 1, '2026-03-18 09:30:00'),
(6, 'Notification - Promotion Reopened', 'Notification', 'Your expired promotion has been reopened after payment verification. Delivery resumes immediately in the assigned placement slot.', 'Active', 1, '2026-03-16 14:00:00', 1, '2026-03-18 15:20:00'),
(7, 'Notification - Export Completed', 'Notification', 'Your requested admin export has finished successfully. Download the generated report from the export history screen.', 'Active', 1, '2026-03-17 08:00:00', 1, '2026-03-17 08:05:00'),
(8, 'Internal Moderation Escalation', 'Notification', 'This case has been escalated to the moderation lead for manual review because it affects promotion delivery quality or marketplace safety.', 'Disabled', 1, '2026-03-18 09:45:00', 1, '2026-03-25 10:00:00');

-- ============================================================
-- POST PROMOTIONS / BOOSTED CAMPAIGNS
-- ============================================================
INSERT INTO post_promotions (
    post_promotion_id,
    post_promotion_post_id,
    post_promotion_buyer_id,
    post_promotion_package_id,
    post_promotion_slot_id,
    post_promotion_start_at,
    post_promotion_end_at,
    post_promotion_status,
    post_promotion_created_at
) VALUES
(1, 1, 1, 1, 1, '2026-03-05 08:00:00', '2026-03-11 23:59:00', 'expired',  '2026-03-04 16:00:00'),
(2, 4, 3, 2, 1, '2026-03-12 08:00:00', '2026-04-10 23:59:00', 'active',   '2026-03-11 14:20:00'),
(3, 2, 4, 3, 2, '2026-03-08 08:00:00', '2026-03-14 23:59:00', 'paused',   '2026-03-07 17:30:00'),
(4, 8, 4, 4, 2, '2026-03-18 08:00:00', '2026-04-16 23:59:00', 'active',   '2026-03-17 13:10:00'),
(5, 3, 2, 5, 3, '2026-03-20 08:00:00', '2026-03-26 23:59:00', 'expired',  '2026-03-19 11:00:00'),
(6, 6, 1, 6, 3, '2026-03-25 08:00:00', '2026-04-23 23:59:00', 'active',   '2026-03-24 15:45:00'),
(7, 7, 1, 1, 1, '2026-04-05 08:00:00', '2026-04-11 23:59:00', 'active',   '2026-04-04 09:10:00'),
(8, 11, 6, 3, 2, '2026-04-02 08:00:00', '2026-04-08 23:59:00', 'paused',  '2026-04-01 12:05:00'),
(9, 12, 6, 5, 3, '2026-04-01 08:00:00', '2026-04-07 23:59:00', 'closed',  '2026-03-31 18:00:00'),
(10, 9, 3, 6, 3, '2026-04-11 08:00:00', '2026-05-10 23:59:00', 'scheduled','2026-04-09 08:30:00'),
(11, 10, 1, 2, 1, '2026-04-12 08:00:00', '2026-05-12 23:59:00', 'scheduled','2026-04-10 08:35:00'),
(12, 13, 6, 4, 2, '2026-03-28 08:00:00', '2026-04-26 23:59:00', 'active', '2026-03-27 15:10:00'),
(13, 14, 6, 6, 3, '2026-03-29 08:00:00', '2026-04-27 23:59:00', 'active', '2026-03-28 10:45:00');

-- ============================================================
-- PAYMENT TRANSACTIONS
-- ============================================================
INSERT INTO payment_txn (
    payment_txn_id,
    payment_txn_user_id,
    payment_txn_package_id,
    payment_txn_post_id,
    payment_txn_price_id,
    payment_txn_amount,
    payment_txn_provider,
    payment_txn_provider_txn_id,
    payment_txn_status,
    payment_txn_created_at
) VALUES
(1, 1, 1, 1, 2, 180000, 'bank_transfer', 'GM-TXN-20260304-001', 'success', '2026-03-04 15:30:00'),
(2, 3, 2, 4, 3, 500000, 'bank_transfer', 'GM-TXN-20260311-002', 'success', '2026-03-11 13:40:00'),
(3, 4, 3, 2, 4, 80000,  'bank_transfer', 'GM-TXN-20260307-003', 'success', '2026-03-07 18:00:00'),
(4, 4, 4, 8, 6, 250000, 'bank_transfer', 'GM-TXN-20260317-004', 'success', '2026-03-17 12:45:00'),
(5, 2, 5, 3, 7, 50000,  'bank_transfer', 'GM-TXN-20260319-005', 'success', '2026-03-19 10:20:00'),
(6, 1, 6, 6, 8, 150000, 'bank_transfer', 'GM-TXN-20260324-006', 'pending', '2026-03-24 14:30:00'),
(7, 6, 4, 13, 6, 250000, 'bank_transfer', 'GM-TXN-20260327-007', 'success', '2026-03-27 16:10:00'),
(8, 6, 6, 14, 8, 150000, 'bank_transfer', 'GM-TXN-20260328-008', 'success', '2026-03-28 11:00:00'),
(9, 1, 1, 7, 2, 180000, 'bank_transfer', 'GM-TXN-20260404-009', 'success', '2026-04-04 09:20:00'),
(10, 6, 3, 11, 4, 80000, 'bank_transfer', 'GM-TXN-20260401-010', 'pending', '2026-04-01 11:25:00'),
(11, 6, 5, 12, 7, 50000, 'bank_transfer', 'GM-TXN-20260331-011', 'failed', '2026-03-31 19:15:00'),
(12, 3, 6, 9, 8, 150000, 'bank_transfer', 'GM-TXN-20260409-012', 'success', '2026-04-09 08:50:00'),
(13, 1, 2, 10, 3, 500000, 'bank_transfer', 'GM-TXN-20260410-013', 'pending', '2026-04-10 08:55:00'),
(14, 5, 5, 15, 7, 50000, 'bank_transfer', 'GM-TXN-20260326-014', 'success', '2026-03-26 17:40:00');

-- ============================================================
-- REPORTS MODERATION
-- ============================================================
INSERT INTO reports (report_id, reporter_id, post_id, report_shop_id, report_reason_code, report_reason, report_note, report_status, admin_note, report_created_at, report_updated_at) VALUES
(1, 5, 1, 1, 'MISLEADING_INFO', 'Post title and product details are not consistent with the attached listing photos.', 'The seller describes a different bonsai shape in the text than in the gallery.', 'pending', NULL, '2026-03-29 09:15:00', '2026-03-29 09:15:00'),
(2, 5, 2, 3, 'SPAM_PROMOTION', 'The post content repeats promotional text and external contact instructions too aggressively.', 'Please review whether this listing should stay visible or be rewritten.', 'resolved', 'Seller was instructed to remove repeated off-platform promotion text before republishing.', '2026-03-28 15:42:00', '2026-03-29 10:05:00'),
(3, 5, 6, 3, 'SUSPICIOUS_PRICING', 'The listed price looks abnormal compared with similar ornamental plant posts in the same category.', 'Potential bait pricing. Needs manual moderation follow-up.', 'dismissed', 'Pricing was verified with the shop and no policy breach was found.', '2026-03-27 11:20:00', '2026-03-28 08:40:00'),
(4, 7, 3, 3, 'COPYRIGHT_MEDIA', 'Listing photos appear copied from another marketplace source.', 'Image set looks duplicated from a third-party seller page.', 'pending', NULL, '2026-03-26 14:05:00', '2026-03-26 14:05:00'),
(5, 2, 4, 3, 'OFF_PLATFORM_CONTACT', 'Seller requests direct contact outside GreenMarket before checkout.', 'Contains messaging that bypasses marketplace payment flow.', 'resolved', 'Content was edited and compliant version was republished.', '2026-03-25 16:25:00', '2026-03-26 10:10:00'),
(6, 4, 8, 3, 'WRONG_CATEGORY', 'The post was published under the wrong category and disrupts category relevance.', 'Needs category correction and listing clean-up.', 'dismissed', 'Category was acceptable after manual review.', '2026-03-24 09:30:00', '2026-03-24 17:20:00'),
(7, 5, 9, 3, 'MISLEADING_INFO', 'The post description overstates the maturity and shape training of the tree.', 'Customer noted mismatch between wording and actual plant size.', 'pending', NULL, '2026-03-23 13:15:00', '2026-03-23 13:15:00'),
(8, 7, 13, 4, 'SPAM_PROMOTION', 'Repeated marketing text is making the listing difficult to review.', 'Needs moderation note and content clean-up.', 'resolved', 'Seller removed duplicated promotional slogans and listing stayed visible.', '2026-03-22 10:45:00', '2026-03-22 15:40:00'),
(9, 2, 15, 1, 'SUSPICIOUS_PRICING', 'The reported price looks too low compared with product material quality.', 'Possible bait price to attract off-platform contact.', 'pending', NULL, '2026-03-21 11:05:00', '2026-03-21 11:05:00');

-- ============================================================
-- EVENT LOGS / EXPORT HISTORY / ACTIVITY LOG
-- ============================================================
INSERT INTO event_logs (
    event_log_id,
    event_log_user_id,
    event_log_post_id,
    event_log_shop_id,
    event_log_slot_id,
    event_log_category_id,
    event_log_event_type,
    event_log_event_time,
    event_log_meta
) VALUES
(1, 6, NULL, NULL, NULL, NULL, 'admin_login',        '2026-03-29 08:00:00', '{"action":"Admin Login","detail":"Admin dashboard session started successfully.","performedBy":"System Administrator"}'),
(2, 3, NULL, NULL, NULL, NULL, 'role_assigned',      '2026-03-29 08:35:00', '{"action":"Role Assigned","detail":"Assigned role: Operation Staff.","performedBy":"System Administrator"}'),
(3, 4, NULL, NULL, NULL, NULL, 'account_locked',     '2026-03-29 09:10:00', '{"action":"Account Locked","detail":"User access was restricted after moderation review.","performedBy":"System Administrator"}'),
(4, 4, NULL, NULL, NULL, NULL, 'account_unlocked',   '2026-03-29 11:05:00', '{"action":"Account Unlocked","detail":"User access was restored after verification.","performedBy":"System Administrator"}'),
(5, 1, NULL, NULL, NULL, NULL, 'admin_export',       '2026-03-29 12:00:00', '{"action":"Export Generated","detail":"Users CSV export completed.","generatedBy":"System Administrator","reportName":"Users Export - 2026-03-29","status":"Completed"}'),
(6, 1, NULL, NULL, NULL, NULL, 'admin_export',       '2026-03-29 12:08:00', '{"action":"Export Generated","detail":"Revenue summary CSV export completed.","generatedBy":"System Administrator","reportName":"Revenue Summary - 2026-03-29","status":"Completed"}'),
(7, 1, NULL, NULL, NULL, NULL, 'admin_export',       '2026-03-29 12:16:00', '{"action":"Export Generated","detail":"Customer spending CSV export completed.","generatedBy":"System Administrator","reportName":"Customer Spending - 2026-03-29","status":"Completed"}'),
(8, 1, NULL, NULL, NULL, NULL, 'admin_export',       '2026-03-29 12:25:00', '{"action":"Export Generated","detail":"Analytics overview CSV export completed.","generatedBy":"System Administrator","reportName":"Analytics Overview - 2026-03-29","status":"Completed"}'),
(9, 1, NULL, NULL, NULL, NULL, 'admin_export',       '2026-03-29 12:33:00', '{"action":"Export Generated","detail":"Promotion operations CSV export completed.","generatedBy":"System Administrator","reportName":"Promotion Operations - 2026-03-29","status":"Completed"}'),
(10, 1, NULL, NULL, NULL, NULL, 'admin_export',      '2026-03-29 12:44:00', '{"action":"Export Generated","detail":"Boosted campaigns CSV export completed.","generatedBy":"System Administrator","reportName":"Boosted Campaigns - 2026-03-29","status":"Completed"}'),
(11, 2, 2, 3, 2, 11, 'promotion_resumed',            '2026-03-30 09:20:00', '{"action":"Promotion Resumed","detail":"Category Top campaign resumed after content update.","performedBy":"System Administrator"}'),
(12, 1, 3, 2, 3, 12, 'promotion_reopened',           '2026-03-30 15:10:00', '{"action":"Promotion Reopened","detail":"Expired Search Boost campaign reopened after payment confirmation.","performedBy":"System Administrator"}');

-- ============================================================
-- DAILY PLACEMENT METRICS
-- ============================================================
INSERT INTO daily_placement_metrics (
    daily_placement_metric_id,
    daily_placement_metric_date,
    daily_placement_metric_slot_id,
    daily_placement_metric_category_id,
    daily_placement_metric_impressions,
    daily_placement_metric_clicks,
    daily_placement_metric_detail_views,
    daily_placement_metric_contacts,
    daily_placement_metric_ctr,
    daily_placement_metric_created_at
) VALUES
(1,  '2026-03-05', 1, 11, 3300, 96, 41, 9, 2.91, '2026-03-05 23:59:00'),
(2,  '2026-03-06', 1, 11, 3100, 89, 38, 8, 2.87, '2026-03-06 23:59:00'),
(3,  '2026-03-07', 1, 11, 3400, 101, 43, 10, 2.97, '2026-03-07 23:59:00'),
(4,  '2026-03-08', 2, 11, 1800, 37, 18, 4, 2.06, '2026-03-08 23:59:00'),
(5,  '2026-03-09', 2, 11, 1850, 39, 19, 4, 2.11, '2026-03-09 23:59:00'),
(6,  '2026-03-10', 1, 11, 3200, 95, 40, 9, 2.97, '2026-03-10 23:59:00'),
(7,  '2026-03-11', 1, 11, 3350, 98, 42, 9, 2.93, '2026-03-11 23:59:00'),
(8,  '2026-03-12', 1, 11, 3450, 103, 46, 10, 2.99, '2026-03-12 23:59:00'),
(9,  '2026-03-13', 1, 11, 3600, 108, 48, 11, 3.00, '2026-03-13 23:59:00'),
(10, '2026-03-14', 2, 11, 1900, 41, 20, 5, 2.16, '2026-03-14 23:59:00'),
(11, '2026-03-20', 3, 12, 7200, 104, 51, 13, 1.44, '2026-03-20 23:59:00'),
(12, '2026-03-21', 3, 12, 7100, 102, 50, 12, 1.44, '2026-03-21 23:59:00'),
(13, '2026-03-22', 3, 12, 7250, 108, 53, 14, 1.49, '2026-03-22 23:59:00'),
(14, '2026-03-23', 3, 12, 7050, 101, 49, 12, 1.43, '2026-03-23 23:59:00'),
(15, '2026-03-24', 3, 12, 7300, 111, 55, 14, 1.52, '2026-03-24 23:59:00'),
(16, '2026-03-25', 2, 11, 7600, 182, 88, 20, 2.39, '2026-03-25 23:59:00'),
(17, '2026-03-26', 3, 12, 7400, 106, 54, 13, 1.43, '2026-03-26 23:59:00'),
(18, '2026-03-27', 2, 11, 7550, 180, 86, 20, 2.38, '2026-03-27 23:59:00'),
(19, '2026-03-28', 2, 11, 7480, 177, 85, 19, 2.37, '2026-03-28 23:59:00'),
(20, '2026-03-29', 2, 11, 7620, 183, 89, 20, 2.40, '2026-03-29 23:59:00'),
(21, '2026-03-30', 2, 11, 7500, 181, 87, 19, 2.41, '2026-03-30 23:59:00'),
(22, '2026-03-31', 2, 11, 7580, 184, 90, 21, 2.43, '2026-03-31 23:59:00');

-- ============================================================
-- AI TREND SCORES
-- ============================================================
INSERT INTO trend_scores (
    trend_score_id,
    trend_score_as_of_date,
    trend_score_slot_id,
    trend_score_score,
    trend_score_components,
    trend_score_created_at
) VALUES
(1,  '2026-03-05', 1, 82.5, '{"traffic":82,"revenue":76,"operations":88}', '2026-03-05 23:59:00'),
(2,  '2026-03-08', 2, 68.0, '{"traffic":64,"revenue":66,"operations":74}', '2026-03-08 23:59:00'),
(3,  '2026-03-11', 1, 84.0, '{"traffic":83,"revenue":79,"operations":86}', '2026-03-11 23:59:00'),
(4,  '2026-03-14', 2, 71.0, '{"traffic":69,"revenue":67,"operations":77}', '2026-03-14 23:59:00'),
(5,  '2026-03-20', 3, 63.0, '{"traffic":61,"revenue":65,"operations":63}', '2026-03-20 23:59:00'),
(6,  '2026-03-22', 3, 66.0, '{"traffic":64,"revenue":68,"operations":66}', '2026-03-22 23:59:00'),
(7,  '2026-03-25', 2, 87.0, '{"traffic":88,"revenue":83,"operations":90}', '2026-03-25 23:59:00'),
(8,  '2026-03-27', 3, 72.0, '{"traffic":70,"revenue":73,"operations":73}', '2026-03-27 23:59:00'),
(9,  '2026-03-29', 2, 89.0, '{"traffic":90,"revenue":86,"operations":91}', '2026-03-29 23:59:00'),
(10, '2026-03-31', 3, 74.0, '{"traffic":72,"revenue":75,"operations":75}', '2026-03-31 23:59:00');

-- ============================================================
-- AI INSIGHT HISTORY
-- ============================================================
INSERT INTO ai_insights (
    ai_insight_id,
    ai_insight_requested_by,
    ai_insight_scope,
    ai_insight_input_snapshot,
    ai_insight_output_text,
    ai_insight_provider,
    ai_insight_created_at
) VALUES
(1, 1, 'Placement Performance', '{"title":"Placement Performance summary","focus":"Placement Performance","status":"Generated","generatedBy":"System Administrator","model":"Gemini gemini-2.0-flash"}', 'Homepage traffic stayed stable while Category Top outperformed revenue expectations in the final week of March. Keep Category Top inventory available because it is converting best among active slots.', 'Gemini gemini-2.0-flash', '2026-03-25 10:00:00'),
(2, 1, 'Promotion Watchlist',   '{"title":"Promotion Watchlist summary","focus":"Promotion Watchlist","status":"Needs Review","generatedBy":"System Administrator","model":"Gemini gemini-2.0-flash"}', 'Search Boost campaigns that expired on 2026-03-26 still show demand signals. Review whether any eligible cases should be reopened after payment confirmation.', 'Gemini gemini-2.0-flash', '2026-03-26 09:45:00'),
(3, 1, 'Revenue Signals',       '{"title":"Revenue Signals summary","focus":"Revenue Signals","status":"Generated","generatedBy":"System Administrator","model":"Gemini gemini-2.0-flash"}', 'March revenue was concentrated in Homepage and Category Top packages. Search Boost volume increased late in the month but paid contribution is still smaller than premium placements.', 'Gemini gemini-2.0-flash', '2026-03-27 14:15:00'),
(4, 1, 'Operator Load',         '{"title":"Operator Load summary","focus":"Operator Load","status":"Generated","generatedBy":"System Administrator","model":"Gemini gemini-2.0-flash"}', 'Ops Team B handled the largest number of category campaigns. The current load remains acceptable, but new escalations should be balanced toward Team A for the next cycle.', 'Gemini gemini-2.0-flash', '2026-03-28 08:40:00'),
(5, 1, 'Placement Performance', '{"title":"Placement Performance summary","focus":"Placement Performance","status":"Archived","generatedBy":"System Administrator","model":"Gemini gemini-2.0-flash"}', 'Early March homepage impressions were healthy but softened before premium 30-day inventory was activated. Review creative freshness for homepage premium buyers.', 'Gemini gemini-2.0-flash', '2026-03-29 16:25:00'),
(6, 1, 'Revenue Signals',       '{"title":"Revenue Signals summary","focus":"Revenue Signals","status":"Needs Review","generatedBy":"System Administrator","model":"Gemini gemini-2.0-flash"}', 'Average order value is currently supported by premium homepage packages, while smaller search packages are driving order count. Keep both tiers visible in pricing analysis.', 'Gemini gemini-2.0-flash', '2026-03-30 11:10:00');

-- ============================================================
-- RESET SEQUENCES
-- ============================================================

-- ============================================================
-- OPERATIONS & MANAGER DATA
-- ============================================================

-- Operation Tasks
INSERT INTO operation_tasks (task_id, task_title, task_type, task_status, task_priority, assignee_id, customer_id, related_target_id, task_note, created_at, updated_at) VALUES
(1, 'Hỗ trợ đổi email shop', 'support', 'in_progress', 'medium', 6, 2, NULL, 'Khách hàng gặp lỗi OTP khi đổi email.', now() - interval '2 days', now() - interval '1 day'),
(2, 'Xác minh báo cáo spam', 'report_check', 'open', 'high', 6, 7, 2, 'Report #2 cần tra xét IP.', now() - interval '1 day', now() - interval '1 day'),
(3, 'Cấp lại quyền đăng bài', 'support', 'closed', 'high', 6, 3, NULL, 'Đã mở khóa.', now() - interval '5 days', now() - interval '4 days');

-- Task Replies
INSERT INTO task_replies (reply_id, task_id, sender_id, message, visibility, created_at) VALUES
(1, 1, 6, 'Tôi đang kiểm tra hệ thống SMS provider.', 'internal', now() - interval '1 day'),
(2, 2, 6, 'Khách này có dấu hiệu spam thực sự. Sẽ báo cấp trên.', 'internal', now() - interval '12 hours');

-- Moderation Actions
INSERT INTO moderation_actions (moderation_action_id, moderation_action_action_by, moderation_action_post_id, moderation_action_action, moderation_action_note, moderation_action_created_at) VALUES
(1, 5, 2, 'HIDDEN', 'Tạm ẩn do spam. Chờ shop sửa.', now() - interval '5 days'),
(2, 5, 2, 'RESTORED', 'Shop đã sửa bài hợp lệ.', now() - interval '4 days');

-- Moderation Feedback
INSERT INTO moderation_feedback (feedback_id, target_type, target_id, sender_id, recipient_id, message, created_at) VALUES
(1, 'post', 2, 5, 3, 'Vui lòng gỡ bỏ các đoạn quảng cáo lặp lại quá nhiều lần để bài được hiển thị lại.', now() - interval '5 days');

-- Escalations
INSERT INTO escalations (escalation_id, source_task_id, target_type, target_id, created_by, severity, reason, status, resolution_note, created_at) VALUES
(1, 2, 'shop', 3, 6, 'high', 'Shop này vi phạm nhiều lần, vượt quyền hạn của Operation Staff.', 'open', NULL, now() - interval '12 hours');

-- System Notifications
INSERT INTO system_notifications (notification_id, recipient_id, title, content, type, read_status, created_at) VALUES
(1, 6, 'Task mới: Xác minh báo cáo spam', 'Bạn được assign một task mới từ hệ thống phân bổ.', 'new_task', true, now() - interval '1 day'),
(2, 5, 'Escalation mới: Cần xử lý shop vi phạm', 'Operation Staff (ID: 6) vừa đẩy một ticket lên mức quản lý.', 'escalation', false, now() - interval '12 hours');

SELECT setval('users_user_id_seq', (SELECT COALESCE(MAX(user_id), 1) FROM users));
SELECT setval('admins_admin_id_seq', (SELECT COALESCE(MAX(admin_id), 1) FROM admins));
SELECT setval('roles_role_id_seq', (SELECT COALESCE(MAX(role_id), 1) FROM roles));
SELECT setval('business_roles_business_role_id_seq', (SELECT COALESCE(MAX(business_role_id), 1) FROM business_roles));
SELECT setval('otp_requests_otp_request_id_seq', (SELECT COALESCE(MAX(otp_request_id), 1) FROM otp_requests));
SELECT setval('categories_category_id_seq', (SELECT COALESCE(MAX(category_id), 1) FROM categories));
SELECT setval('attributes_attribute_id_seq', (SELECT COALESCE(MAX(attribute_id), 1) FROM attributes));
SELECT setval('posts_post_id_seq', (SELECT COALESCE(MAX(post_id), 1) FROM posts));
SELECT setval('post_images_image_id_seq', (SELECT COALESCE(MAX(image_id), 1) FROM post_images));
SELECT setval('post_videos_post_video_id_seq', (SELECT COALESCE(MAX(post_video_id), 1) FROM post_videos));
SELECT setval('post_attribute_values_value_id_seq', (SELECT COALESCE(MAX(value_id), 1) FROM post_attribute_values));
SELECT setval('jobs_job_id_seq', (SELECT COALESCE(MAX(job_id), 1) FROM jobs));
SELECT setval('job_contact_requests_contact_request_id_seq', (SELECT COALESCE(MAX(contact_request_id), 1) FROM job_contact_requests));
SELECT setval('job_deliverables_deliverable_id_seq', (SELECT COALESCE(MAX(deliverable_id), 1) FROM job_deliverables));
SELECT setval('earning_entries_earning_entry_id_seq', (SELECT COALESCE(MAX(earning_entry_id), 1) FROM earning_entries));
SELECT setval('payout_requests_payout_request_id_seq', (SELECT COALESCE(MAX(payout_request_id), 1) FROM payout_requests));
SELECT setval('reports_report_id_seq', (SELECT COALESCE(MAX(report_id), 1) FROM reports));
SELECT setval('placement_slots_placement_slot_id_seq', (SELECT COALESCE(MAX(placement_slot_id), 1) FROM placement_slots));
SELECT setval('promotion_packages_promotion_package_id_seq', (SELECT COALESCE(MAX(promotion_package_id), 1) FROM promotion_packages));
SELECT setval('promotion_package_prices_price_id_seq',          (SELECT COALESCE(MAX(price_id),              1) FROM promotion_package_prices));
SELECT setval('promotion_package_audit_log_audit_id_seq',        (SELECT COALESCE(MAX(audit_id),              1) FROM promotion_package_audit_log));
SELECT setval('user_posting_plans_posting_plan_id_seq',          (SELECT COALESCE(MAX(posting_plan_id),       1) FROM user_posting_plans));
SELECT setval('posting_fee_ledger_posting_fee_id_seq',           (SELECT COALESCE(MAX(posting_fee_id),        1) FROM posting_fee_ledger));
SELECT setval('banned_keywords_banned_keyword_id_seq', (SELECT COALESCE(MAX(banned_keyword_id), 1) FROM banned_keywords));
SELECT setval('system_settings_system_setting_id_seq', (SELECT COALESCE(MAX(system_setting_id), 1) FROM system_settings));
SELECT setval('admin_templates_template_id_seq', (SELECT COALESCE(MAX(template_id), 1) FROM admin_templates));
SELECT setval('post_promotions_post_promotion_id_seq', (SELECT COALESCE(MAX(post_promotion_id), 1) FROM post_promotions));
SELECT setval('payment_txn_payment_txn_id_seq', (SELECT COALESCE(MAX(payment_txn_id), 1) FROM payment_txn));
SELECT setval('event_logs_event_log_id_seq', (SELECT COALESCE(MAX(event_log_id), 1) FROM event_logs));
SELECT setval('daily_placement_metrics_daily_placement_metric_id_seq', (SELECT COALESCE(MAX(daily_placement_metric_id), 1) FROM daily_placement_metrics));
SELECT setval('trend_scores_trend_score_id_seq', (SELECT COALESCE(MAX(trend_score_id), 1) FROM trend_scores));
SELECT setval('ai_insights_ai_insight_id_seq', (SELECT COALESCE(MAX(ai_insight_id), 1) FROM ai_insights));
SELECT setval('operation_tasks_task_id_seq', (SELECT COALESCE(MAX(task_id), 1) FROM operation_tasks));
SELECT setval('task_replies_reply_id_seq', (SELECT COALESCE(MAX(reply_id), 1) FROM task_replies));
SELECT setval('moderation_actions_moderation_action_id_seq', (SELECT COALESCE(MAX(moderation_action_id), 1) FROM moderation_actions));
SELECT setval('moderation_feedback_feedback_id_seq', (SELECT COALESCE(MAX(feedback_id), 1) FROM moderation_feedback));
SELECT setval('escalations_escalation_id_seq', (SELECT COALESCE(MAX(escalation_id), 1) FROM escalations));
SELECT setval('system_notifications_notification_id_seq', (SELECT COALESCE(MAX(notification_id), 1) FROM system_notifications));
SELECT setval('host_contents_host_content_id_seq', (SELECT COALESCE(MAX(host_content_id), 1) FROM host_contents));
SELECT setval('host_earnings_host_earning_id_seq', (SELECT COALESCE(MAX(host_earning_id), 1) FROM host_earnings));
SELECT setval('host_payout_requests_host_payout_id_seq', (SELECT COALESCE(MAX(host_payout_id), 1) FROM host_payout_requests));

