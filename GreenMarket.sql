-- ============================================================
-- GreenMarket Database Backup (Full Schema)
-- PostgreSQL 18.x | Generated: 2026-04-08
-- Tables: 34 | Synced from Drizzle ORM schema
-- Categories: Cây Cảnh Bonsai
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
        INSERT INTO event_logs (event_log_target_type, event_log_target_id, event_log_event_type, event_log_meta)
        VALUES ('package', NEW.promotion_package_id, v_action, jsonb_build_object('after', row_to_json(NEW)::jsonb));
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.promotion_package_deleted_at IS NULL AND NEW.promotion_package_deleted_at IS NOT NULL THEN
            v_action := 'PACKAGE_DELETED';
        ELSIF OLD.promotion_package_deleted_at IS NOT NULL AND NEW.promotion_package_deleted_at IS NULL THEN
            v_action := 'PACKAGE_RESTORED';
        ELSE
            v_action := 'PACKAGE_UPDATED';
        END IF;
        INSERT INTO event_logs (event_log_target_type, event_log_target_id, event_log_event_type, event_log_meta)
        VALUES ('package', NEW.promotion_package_id, v_action, jsonb_build_object('before', row_to_json(OLD)::jsonb, 'after', row_to_json(NEW)::jsonb));
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
        INSERT INTO event_logs (event_log_target_type, event_log_target_id, event_log_event_type, event_log_meta)
        VALUES ('package_price', NEW.package_id, v_action, jsonb_build_object('price_id', NEW.price_id, 'after', row_to_json(NEW)::jsonb));
    ELSIF TG_OP = 'UPDATE' THEN
        -- effective_to được set → đóng lại bảng giá này
        IF OLD.effective_from > now() THEN
            v_action := 'PRICE_SCHEDULED_CANCELLED'; -- Admin hủy lịch giá tương lai
        ELSE
            v_action := 'PRICE_SUPERSEDED';          -- Giá cũ bị thay bởi giá mới
        END IF;
        INSERT INTO event_logs (event_log_target_type, event_log_target_id, event_log_event_type, event_log_meta)
        VALUES ('package_price', NEW.package_id, v_action, jsonb_build_object('price_id', NEW.price_id, 'before', row_to_json(OLD)::jsonb, 'after', row_to_json(NEW)::jsonb));
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
    user_email VARCHAR(255) UNIQUE,
    user_email_verified BOOLEAN DEFAULT FALSE,
    user_location VARCHAR(255),
    user_bio TEXT,
    user_availability_status VARCHAR(20) NOT NULL DEFAULT 'available',
    user_availability_note TEXT,
    user_status VARCHAR(20) DEFAULT 'active',
    user_business_role_id INTEGER REFERENCES business_roles(business_role_id) ON DELETE SET NULL,
    user_specialist_data JSONB,
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

-- Posts
CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    post_author_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    post_shop_id INTEGER REFERENCES shops(shop_id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES categories(category_id) ON DELETE CASCADE,
    post_title VARCHAR(255) NOT NULL,
    post_slug VARCHAR(255) NOT NULL UNIQUE,


    post_location VARCHAR(255),
    post_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, hidden, draft, pending_owner
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

-- Media Assets (Unified resources like images, videos, documents)
CREATE TABLE media_assets (
    asset_id SERIAL PRIMARY KEY,
    target_type VARCHAR(50) NOT NULL, -- post, report, job_deliverable, host_content, user, shop, ticket
    target_id INTEGER NOT NULL,
    media_type VARCHAR(20) NOT NULL, -- image, video, document
    url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    meta_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT now()
);

-- Post Attribute Values
CREATE TABLE post_attribute_values (
    value_id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(post_id) ON DELETE CASCADE,
    attribute_id INTEGER REFERENCES attributes(attribute_id) ON DELETE CASCADE,
    attribute_value TEXT NOT NULL,
    value_created_at TIMESTAMP DEFAULT now()
);
-- Tickets (Unified Support, Reports, and Escalations)
CREATE TABLE tickets (
    ticket_id SERIAL PRIMARY KEY,
    ticket_type VARCHAR(50) NOT NULL, -- SUPPORT, REPORT, ESCALATION, JOB
    ticket_creator_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    ticket_assignee_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    ticket_status VARCHAR(20) NOT NULL DEFAULT 'open',
    ticket_priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    ticket_target_type VARCHAR(50), -- post, shop, user, order
    ticket_target_id INTEGER,
    ticket_title VARCHAR(255),
    ticket_content TEXT NOT NULL,
    ticket_resolution_note TEXT,
    ticket_meta_data JSONB DEFAULT '{}'::jsonb,
    ticket_created_at TIMESTAMP DEFAULT now(),
    ticket_updated_at TIMESTAMP DEFAULT now(),
    ticket_resolved_at TIMESTAMP
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


-- Post Promotions
CREATE TABLE post_promotions (
    post_promotion_id SERIAL PRIMARY KEY,
    post_promotion_post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    post_promotion_buyer_id INTEGER NOT NULL,
    post_promotion_package_id INTEGER NOT NULL REFERENCES promotion_packages(promotion_package_id) ON DELETE RESTRICT,
    post_promotion_slot_id INTEGER NOT NULL REFERENCES placement_slots(placement_slot_id) ON DELETE CASCADE,
    post_promotion_snapshot_title VARCHAR(255),
    post_promotion_snapshot_priority INTEGER,
    post_promotion_start_at TIMESTAMP,
    post_promotion_end_at TIMESTAMP,
    post_promotion_status VARCHAR(20),
    post_promotion_created_at TIMESTAMP DEFAULT now()
);

-- Payment Transactions
-- Unified Cash Transactions (Inbound/Outbound)
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    transaction_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    transaction_amount DECIMAL(15, 2) NOT NULL,
    transaction_currency VARCHAR(10) DEFAULT 'VND',
    transaction_type VARCHAR(50) NOT NULL, -- payment (in), payout (out)
    transaction_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, success, failed, cancelled, rejected
    transaction_provider VARCHAR(50), -- vnpay, payos, bank, system
    transaction_provider_txn_id VARCHAR(100) UNIQUE,
    transaction_reference_type VARCHAR(50), -- package, payout_request
    transaction_reference_id INTEGER,
    transaction_meta JSONB DEFAULT '{}'::jsonb,
    transaction_created_at TIMESTAMP DEFAULT now(),
    transaction_updated_at TIMESTAMP DEFAULT now(),
    transaction_processed_at TIMESTAMP
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
-- Unified Internal Accounting Ledger
CREATE TABLE ledgers (
    ledger_id SERIAL PRIMARY KEY,
    ledger_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    ledger_amount DECIMAL(15, 2) NOT NULL,
    ledger_type VARCHAR(50) NOT NULL, -- earning, fee_debit
    ledger_direction VARCHAR(10) NOT NULL, -- CREDIT (add), DEBIT (subtract)
    ledger_status VARCHAR(20) NOT NULL DEFAULT 'available', -- pending, available, cancelled
    ledger_reference_type VARCHAR(50), -- job, post, content
    ledger_reference_id INTEGER,
    ledger_note TEXT,
    ledger_meta JSONB DEFAULT '{}'::jsonb,
    ledger_created_at TIMESTAMP DEFAULT now()
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

-- Audit Logs (Unified System History)
CREATE TABLE event_logs (
    event_log_id SERIAL PRIMARY KEY,
    event_log_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL, -- Who performed the action
    event_log_target_type VARCHAR(50), -- post, shop, package, slot, user, system
    event_log_target_id INTEGER,
    event_log_event_type VARCHAR(50) NOT NULL,
    event_log_event_time TIMESTAMP DEFAULT now(),
    event_log_meta JSONB DEFAULT '{}'::jsonb
);

-- Note: Jobs, job_contact_requests, and job_deliverables have been consolidated into the 'tickets' table.

-- Unified Earnings
-- User Favorites (Centralized Bookmarks)
CREATE TABLE user_favorites (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    target_id INTEGER NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- post, host_content, etc.
    created_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (user_id, target_id, target_type)
);
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);


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

-- Notifications
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    recipient_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255),
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'system',
    meta_data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now()
);

-- Task/Ticket Replies
CREATE TABLE task_replies (
    reply_id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    visibility VARCHAR(20) DEFAULT 'internal',
    created_at TIMESTAMP DEFAULT now()
);


-- Host Contents
CREATE TABLE host_contents (
    host_content_id SERIAL PRIMARY KEY,
    host_content_author_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    host_content_title VARCHAR(255) NOT NULL,
    host_content_description TEXT,
    host_content_body TEXT,
    host_content_category VARCHAR(50), -- Tin tức, Mẹo vặt, Sự kiện
    host_content_media_urls JSONB DEFAULT '[]'::jsonb,
    host_content_status VARCHAR(20) DEFAULT 'pending_admin', -- pending_admin, published, rejected
    host_content_payout_amount NUMERIC(12,2),
    host_content_view_count INTEGER DEFAULT 0,
    host_content_created_at TIMESTAMP DEFAULT now(),
    host_content_updated_at TIMESTAMP DEFAULT now(),
    host_content_deleted_at TIMESTAMP
);



-- Shop Collaborators
CREATE TABLE shop_collaborators (
    shop_collaborators_id SERIAL PRIMARY KEY,
    shop_collaborators_shop_id INTEGER NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
    collaborator_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    shop_collaborators_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- active, pending, removed
    shop_collaborators_created_at TIMESTAMP DEFAULT now(),
    UNIQUE(shop_collaborators_shop_id, collaborator_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Posts
CREATE INDEX post_search_idx ON posts USING gin (to_tsvector('simple', post_title));
CREATE INDEX post_category_idx ON posts USING btree (category_id);
CREATE INDEX post_status_idx ON posts USING btree (post_status);

CREATE INDEX post_location_idx ON posts USING btree (post_location);
CREATE INDEX idx_posts_author ON posts(post_author_id);
CREATE INDEX idx_posts_shop ON posts(post_shop_id);
CREATE INDEX idx_posts_published ON posts(post_published);
CREATE INDEX idx_posts_created ON posts(post_created_at);

-- Post Attribute Values
CREATE INDEX attribute_filter_idx ON post_attribute_values USING btree (post_id, attribute_id, attribute_value);

-- Collaborator Services
-- Legacy job indices removed
-- Legacy job contact and deliverable indices removed



-- Shop Collaborators
CREATE INDEX idx_shop_collaborators_shop ON shop_collaborators(shop_collaborators_shop_id);
CREATE INDEX idx_shop_collaborators_user ON shop_collaborators(collaborator_id);



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

-- Transactions & Ledger Indexes
CREATE INDEX idx_transactions_user ON transactions(transaction_user_id);
CREATE INDEX idx_transactions_status ON transactions(transaction_status);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_ref ON transactions(transaction_reference_type, transaction_reference_id);

CREATE INDEX user_posting_plans_user_status_idx
ON user_posting_plans(posting_plan_user_id, posting_plan_status);
CREATE INDEX user_posting_plans_code_status_idx
ON user_posting_plans(posting_plan_code, posting_plan_status);

CREATE INDEX idx_ledgers_user ON ledgers(ledger_user_id);
CREATE INDEX idx_ledgers_type ON ledgers(ledger_type);
CREATE INDEX idx_ledgers_ref ON ledgers(ledger_reference_type, ledger_reference_id);

-- Analytics
CREATE INDEX idx_daily_metrics_date ON daily_placement_metrics(daily_placement_metric_date);
CREATE INDEX idx_daily_metrics_slot ON daily_placement_metrics(daily_placement_metric_slot_id);

-- Event Logs Indexes
CREATE INDEX idx_event_logs_user ON event_logs(event_log_user_id);
CREATE INDEX idx_event_logs_type ON event_logs(event_log_event_type);
CREATE INDEX idx_event_logs_time ON event_logs(event_log_event_time);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_task_replies_task ON task_replies(ticket_id);

-- ============================================================
-- TRIGGERS
-- ============================================================
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
    '["Create and maintain listings", "Manage shop content", "Track approved article income"]'::jsonb,
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
(1, '0978195419', 'Nguyễn Thành Nam', 'nguyenthanhnamidol@gmail.com', 'Yên Phong, Bắc Ninh', 'Marketplace account used for general buyer and seller demo flows.', 'active', 1),
(2, '0982703398', 'Trần Văn Bonsai', 'bonsai.tran@gmail.com', 'Hoàng Mai, Hà Nội', 'Marketplace account used for general buyer and seller demo flows.', 'active', 1),
(3, '0123456789', 'Lê Hoài Nam', 'hoainam.le@gmail.com', 'Nam Trực, Nam Định', 'Marketplace account used for general buyer and seller demo flows.', 'active', 1),
(6, '0935112233', 'Đặng Minh Tuấn', 'tuan.dang@gmail.com', 'Đông Anh, Hà Nội', 'Marketplace account used for general buyer and seller demo flows.', 'active', 1),
(8, '0987654321', 'Người Dùng Test 0987654321', 'test.0987654321@gmail.com', 'Hà Nội', 'Test account for 0987654321', 'active', 1),
(9, '0909000003', 'Collaborator Pro', 'collaborator@greenmarket.local', 'Ha Noi', 'Seed account for collaborator-role API testing and mobile login.', 'active', 3),
(10, '0909000004', 'Manager Pro', 'manager@greenmarket.local', 'Ha Noi', 'Seed account for manager-role API testing and moderation workflows.', 'active', 4),
(136, '0998887776', 'Host Pro', 'host@greenmarket.local', 'Ha Noi', 'Seed account for host-role API testing and content management.', 'active', 2),
(137, '0997776665', 'Operation Pro', 'operation@greenmarket.local', 'Ha Noi', 'Seed account for operations-staff-role testing and task handling.', 'active', 5);

-- Collaborator availability profile (mock)
UPDATE users
SET
    user_availability_status = 'available',
    user_availability_note = 'Available 08:00-18:00, Monday to Saturday.'
WHERE user_id = 9;
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
-- Migrated Collaborator Jobs to Tickets
INSERT INTO tickets (
    ticket_id,
    ticket_type,
    ticket_creator_id,
    ticket_assignee_id,
    ticket_status,
    ticket_title,
    ticket_content,
    ticket_meta_data,
    ticket_created_at,
    ticket_updated_at
) VALUES
(100, 'JOB', 1, NULL, 'open', 'Photo package for bonsai listing', 'Need 12 listing photos for a bonsai package.', '{"category": "Photo", "location": "Long Bien, Ha Noi", "price": 650000, "deadline": "2026-04-22T00:00:00Z", "requirements": ["24MP camera","4:3 ratio","clean background"]}'::jsonb, now() - interval '1 day', now() - interval '1 day'),
(101, 'JOB', 2, 9, 'accepted', 'SEO content for Linh Sam posts', 'Write SEO-ready descriptions for 20 Linh Sam posts.', '{"category": "Content", "location": "Hoang Mai, Ha Noi", "price": 800000, "deadline": "2026-04-20T00:00:00Z", "requirements": ["min 600 words","H2/H3 headings","persuasive tone"]}'::jsonb, now() - interval '2 days', now() - interval '6 hours'),
(102, 'JOB', 1, 9, 'completed', 'Deliver final bonsai album', 'Finalized photo album package for Tung La Han listing.', '{"category": "Photo", "location": "Yen Phong, Bac Ninh", "price": 720000, "deadline": "2026-04-17T00:00:00Z", "requirements": ["20 JPEG photos","3 cover images","source files + web files"]}'::jsonb, now() - interval '4 days', now() - interval '2 days');

-- Migrated Job Contact Requests to Task Replies
INSERT INTO task_replies (
    reply_id,
    ticket_id,
    sender_id,
    message,
    visibility,
    created_at
) VALUES
(100, 101, 9, 'Can you clarify the exact keyword set and tone before delivery?', 'internal', now() - interval '8 hours');

-- Migrated Job Deliverables to Task Replies (as final submissions)
INSERT INTO task_replies (
    reply_id,
    ticket_id,
    sender_id,
    message,
    attachments,
    visibility,
    created_at
) VALUES
(101, 102, 9, 'Uploaded full album and source zip.', '["https://cdn.greenmarket.local/jobs/3/cover-1.jpg","https://cdn.greenmarket.local/jobs/3/album.zip"]'::jsonb, 'internal', now() - interval '2 days');

-- Collaborator Earnings & Payout Requests (Consolidated into ledgers & transactions)
INSERT INTO ledgers (ledger_id, ledger_user_id, ledger_amount, ledger_status, ledger_type, ledger_direction, ledger_reference_type, ledger_reference_id, ledger_created_at) VALUES
(1, 9, 720000.00, 'available', 'job', 'CREDIT', 'ticket', 102, now() - interval '2 days');

INSERT INTO transactions (
    transaction_id,
    transaction_user_id,
    transaction_amount,
    transaction_type,
    transaction_provider,
    transaction_status,
    transaction_meta,
    transaction_created_at
) VALUES
(1, 9, 500000.00,  'payout', 'bank', 'pending', '{"method":"Bank transfer","note":"Weekly payout request (mock)."}', now() - interval '1 day');

-- Host Contents (Mock - Magazine Style)
INSERT INTO host_contents (host_content_id, host_content_author_id, host_content_title, host_content_description, host_content_body, host_content_category, host_content_media_urls, host_content_status, host_content_view_count, host_content_payout_amount) VALUES
(1, 136, 'Top 5 loại Tùng La Hán đẹp nhất 2026', 'Khám phá danh sách những giống Tùng La Hán được giới chơi cây cảnh săn đón nhất.', 'Tùng La Hán từ lâu đã là biểu tượng của sự trường thọ, bền bỉ và khí chất kiên cường trong văn hóa Á Đông. Với dáng vẻ uy nghi, tán lá xanh quanh năm và khả năng sinh trưởng mạnh mẽ trong điều kiện khắc nghiệt, loài cây này không chỉ mang giá trị thẩm mỹ mà còn ẩn chứa chiều sâu triết lý về cuộc sống.

![Vẻ đẹp uy nghi của Tùng La Hán](https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format)

Trong giới chơi cây cảnh, Tùng La Hán – còn được biết đến với tên khoa học Podocarpus macrophyllus – được đánh giá cao bởi vẻ đẹp cổ kính và khả năng tạo hình đa dạng. Từ dáng trực, dáng hoành cho đến những thế bonsai uốn lượn cầu kỳ, mỗi cây đều mang một câu chuyện riêng, phản ánh bàn tay và tâm huyết của người nghệ nhân. Chính vì vậy, giá trị của một cây Tùng La Hán không chỉ nằm ở tuổi đời mà còn ở “thần thái” mà nó thể hiện.

![Nghệ thuật tạo dáng Bonsai Tùng La Hán](https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format)

Không chỉ xuất hiện trong sân vườn hay các khu biệt thự, Tùng La Hán còn là lựa chọn phổ biến trong phong thủy. Theo quan niệm truyền thống, loài cây này mang lại may mắn, tài lộc và sự bình an cho gia chủ. Tán lá dày, xanh mướt tượng trưng cho sức sống dồi dào, trong khi thân cây vững chãi thể hiện sự ổn định và phát triển bền vững.

Bên cạnh đó, Tùng La Hán cũng gắn liền với hình ảnh của sự tĩnh tại và thiền định. Trong nhiều không gian kiến trúc mang phong cách Nhật Bản hay Trung Hoa, cây thường được đặt ở vị trí trung tâm như một điểm nhấn tinh thần, giúp cân bằng cảm xúc và tạo cảm giác an yên.

Ngày nay, khi nhịp sống hiện đại ngày càng hối hả, sự hiện diện của Tùng La Hán như một lời nhắc nhở về giá trị của sự kiên nhẫn và bền bỉ. Đó không chỉ là một loài cây cảnh, mà còn là biểu tượng sống động của thời gian, của sự trưởng thành và của những điều bền vững vượt lên trên mọi biến đổi.', 'Tin tức', '["https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format", "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format"]', 'published', 1250, 300000.00),
(2, 136, 'Mẹo chọn kéo cắt tỉa bonsai cho người mới', 'Hướng dẫn chi tiết cách chọn bộ dụng cụ cắt tỉa phù hợp túi tiền và nhu cầu.', 'Việc chọn kéo rất quan trọng...', 'Tin tức', '["https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format"]', 'published', 890, 300000.00),
(3, 136, 'Triển lãm sinh vật cảnh miền Bắc 2026', 'Thông tin chi tiết về thời gian và địa điểm tổ chức ngày hội cây cảnh lớn nhất năm.', 'Sự kiện sẽ diễn ra tại...', 'Tin tức', '[]', 'published', 450, 300000.00);

INSERT INTO ledgers (
    ledger_id,
    ledger_user_id,
    ledger_amount,
    ledger_type,
    ledger_direction,
    ledger_status,
    ledger_reference_type,
    ledger_reference_id,
    ledger_note,
    ledger_meta,
    ledger_created_at
) VALUES
(2, 136, 300000.00, 'earning', 'CREDIT', 'available', 'host_content', 1, 'Fixed article payout for HostContent #1', '{"type":"article_payout","sourceId":1}'::jsonb, now() - interval '5 days'),
(3, 136, 300000.00, 'earning', 'CREDIT', 'available', 'host_content', 2, 'Fixed article payout for HostContent #2', '{"type":"article_payout","sourceId":2}'::jsonb, now() - interval '4 days'),
(4, 136, 300000.00, 'earning', 'CREDIT', 'available', 'host_content', 3, 'Fixed article payout for HostContent #3', '{"type":"article_payout","sourceId":3}'::jsonb, now() - interval '3 days'),
(5, 136, 120000.00, 'earning', 'CREDIT', 'available', 'host_content', 1, 'Fixed bonus for reaching the view milestone', '{"type":"performance_bonus","sourceId":1,"threshold":1000}'::jsonb, now() - interval '2 days');

-- Shops
INSERT INTO shops (shop_id, shop_name, shop_phone, shop_email, shop_email_verified, shop_location, shop_description, shop_cover_url, shop_status, shop_vip_started_at, shop_vip_expires_at, shop_lat, shop_lng) VALUES
(1, 'Vườn Bonsai Phố Huyện', '0978195419', 'nguyenthanhnamidol@gmail.com', TRUE, '14 Nghiêm Ích Khiêm, Thị trấn Chờ, Yên Phong, Bắc Ninh',
    'Chuyên bonsai mini và tầm trung. Nhận thiết kế, chăm sóc và phối thế bonsai theo yêu cầu. Ship toàn quốc qua Viettel Post.',
    '/uploads/shop/vuon-bonsai-pho-huyen-1.jpg|/uploads/shop/vuon-bonsai-pho-huyen-2.jpg', 'active', now() - interval '30 days', now() + interval '60 days', 21.201262, 105.950174),
(3, 'Nam Định Art Garden', '0123456789', 'hoainam.le@gmail.com', TRUE, 'Nam Trực, Nam Định',
    'Nghệ nhân cây cảnh cổ truyền Nam Điền. Chuyên sanh, si, tùng la hán cốt cách truyền thống. Hơn 20 năm kinh nghiệm.',
    '/uploads/shop/nam-dinh-art-garden.jpg', 'active', NULL, NULL, 20.2506, 106.2355),
(6, 'Thế Giới Cây Kiểng Miền Tây', '0912345678', 'kieng.tran@gmail.com', TRUE, 'Chợ Lách, Bến Tre',
    'Chuyên cung cấp Linh Sam, Mai Chiếu Thủy, bonsai hoa quả số lượng lớn. Bao ship đồng bằng sông Cửu Long.',
    '/uploads/shop/cay-kieng-mien-tay.jpg', 'active', NULL, NULL, 10.2350, 106.1511);

-- ============================================================
-- CATEGORIES
-- Chỉ dùng danh mục Cây Cảnh Bonsai cho luồng đăng bài hiện tại
-- ============================================================
INSERT INTO categories (category_id, category_parent_id, category_title, category_slug, category_published) VALUES
(1,  NULL, 'Cây Cảnh Bonsai',        'cay-canh-bonsai',     true),
(11, 1,    'Bonsai Mini (Mame/Shito)', 'bonsai-mini',       true),
(12, 1,    'Bonsai Tầm Trung',        'bonsai-tam-trung',   true),
(13, 1,    'Bonsai Đại (San Vườn)',    'bonsai-dai',         true),
(14, 1,    'Bonsai Phong Thủy',       'bonsai-phong-thuy',  true),
(15, 1,    'Bonsai Hoa & Quả',        'bonsai-hoa-qua',     true);

-- ============================================================
-- ATTRIBUTES
-- ============================================================
INSERT INTO attributes (attribute_id, attribute_code, attribute_title, attribute_data_type, attribute_options, attribute_published) VALUES
(1, 'dang_cay',   'Dáng Thế',         'enum',   '["Dáng Trực","Dáng Xiên","Dáng Hoành","Dáng Huyền","Dáng Văn Nhân","Dáng Thác Đổ","Dáng Bạt Phong","Dáng Song Thụ"]', true),
(2, 'chieu_cao',  'Chiều cao (cm)',    'number', NULL, true),
(3, 'hoanh_goc',  'Hoành gốc (cm)',   'number', NULL, true),
(4, 'tuoi_cay',   'Tuổi cây (năm)',   'number', NULL, true),
(5, 'nguon_goc',  'Nguồn gốc',        'text',   NULL, true);

-- Category-Attribute Mapping
INSERT INTO category_attributes (
    category_attribute_category_id,
    category_attribute_attribute_id,
    category_attribute_required,
    category_attribute_display_order,
    category_attribute_status
) VALUES
(1,  1, true,  1, 'Active'),
(1,  2, true,  2, 'Active'),
(1,  3, false, 3, 'Active'),
(1,  4, false, 4, 'Active'),
(1,  5, false, 5, 'Active'),
(11, 1, true,  1, 'Active'),
(11, 2, true,  2, 'Active'),
(11, 3, true,  3, 'Active'),
(12, 1, true,  1, 'Active'),
(12, 2, true,  2, 'Active'),
(12, 3, true,  3, 'Active'),
(12, 4, false, 4, 'Active'),
(13, 1, true,  1, 'Active'),
(13, 2, true,  2, 'Active'),
(13, 3, true,  3, 'Active'),
(13, 4, true,  4, 'Active'),
(13, 5, false, 5, 'Active'),
(14, 1, true,  1, 'Active'),
(14, 2, true,  2, 'Active'),
(15, 1, true,  1, 'Active'),
(15, 2, true,  2, 'Active'),
(15, 5, false, 3, 'Active');

-- ============================================================
-- POSTS (16 bài đăng cây cảnh bonsai)
-- ============================================================
INSERT INTO posts (post_id, post_author_id, post_shop_id, category_id, post_title, post_slug, post_location, post_status, post_contact_phone, post_view_count, post_contact_count, post_published, post_submitted_at, post_published_at) VALUES
(1,  1, 1, 11, 'Sanh Nam Điền Mini Dáng Văn Nhân',
    'sanh-nam-dien-mini-dang-van-nhan',
    'Yên Phong, Bắc Ninh', 'approved', '0978195419', 234, 12, true, now() - interval '30 days', now() - interval '29 days'),

(2,  3, 3, 12, 'Tùng La Hán Dáng Trực Cổ Thụ',
    'tung-la-han-dang-truc-co-thu',
    'Nam Trực, Nam Định', 'approved', '0123456789', 1520, 45, true, now() - interval '25 days', now() - interval '24 days'),

(3,  3, 3, 12, 'Linh Sam Sông Hinh Lũa Thép',
    'linh-sam-song-hinh-lua-thep',
    'Chợ Lách, Bến Tre', 'approved', '0912345678', 876, 28, true, now() - interval '20 days', now() - interval '19 days'),

(4,  3, 3, 13, 'Sanh Quê Dáng Làng Đại Thụ',
    'sanh-que-dang-lang-dai-thu',
    'Nam Trực, Nam Định', 'approved', '0123456789', 432, 15, true, now() - interval '18 days', now() - interval '17 days'),

(5,  3, 3, 11, 'Mai Chiếu Thủy Nu Gò Công Mini',
    'mai-chieu-thuy-nu-go-cong-mini',
    'Chợ Lách, Bến Tre', 'approved', '0912345678', 567, 19, true, now() - interval '15 days', now() - interval '14 days'),

(6,  2, NULL, 12, 'Thông Đen Nhật Bản Thành Thẩm',
    'thong-den-nhat-ban-thanh-tham',
    'Hoàng Mai, Hà Nội', 'approved', '0982703398', 345, 8, true, now() - interval '12 days', now() - interval '11 days'),

(7,  1, 1, 14, 'Si Bonsai Phong Thủy Tài Lộc',
    'si-bonsai-phong-thuy-tai-loc',
    'Yên Phong, Bắc Ninh', 'approved', '0978195419', 189, 7, true, now() - interval '10 days', now() - interval '9 days'),

(8,  3, 3, 15, 'Mai Vàng Bonsai Nghệ Thuật',
    'mai-vang-bonsai-nghe-thuat',
    'Chợ Lách, Bến Tre', 'approved', '0912345678', 723, 31, true, now() - interval '8 days', now() - interval '7 days'),

(9,  3, 3, 11, 'Tùng Bách Tán Lùn Nhật Mini',
    'tung-bach-tan-lun-nhat-mini',
    'Nam Trực, Nam Định', 'approved', '0123456789', 298, 11, true, now() - interval '5 days', now() - interval '4 days'),

(10, 1, 1, 11, 'Kim Quýt Bonsai Mini Sai Quả',
    'kim-quyt-bonsai-mini-sai-qua',
    'Yên Phong, Bắc Ninh', 'approved', '0978195419', 156, 22, true, now() - interval '28 days', now() - interval '27 days'),

(11, 6, 6, 12, 'Mai Chiếu Thủy Dáng Bay Gò Công',
    'mai-chieu-thuy-dang-bay-go-cong',
    'Chợ Lách, Bến Tre', 'approved', '0935112233', 412, 35, true, now() - interval '22 days', now() - interval '21 days'),

(12, 6, 6, 12, 'Duối Cổ Bonsai Dáng Xiên',
    'duoi-co-bonsai-dang-xien',
    'Chợ Lách, Bến Tre', 'approved', '0935112233', 534, 48, true, now() - interval '26 days', now() - interval '25 days'),

(13, 6, 6, 13, 'Sanh Cổ Tán Rơi Sân Vườn',
    'sanh-co-tan-roi-san-vuon',
    'Chợ Lách, Bến Tre', 'approved', '0935112233', 267, 16, true, now() - interval '16 days', now() - interval '15 days'),

(14, 6, 6, 14, 'Lộc Vừng Phong Thủy Dáng Huyền',
    'loc-vung-phong-thuy-dang-huyen',
    'Chợ Lách, Bến Tre', 'approved', '0935112233', 189, 27, true, now() - interval '14 days', now() - interval '13 days'),

(15, 1, 1, 15, 'Ổi Bonsai Sai Quả Dáng Hoành',
    'oi-bonsai-sai-qua-dang-hoanh',
    'Yên Phong, Bắc Ninh', 'approved', '0978195419', 123, 9, true, now() - interval '7 days', now() - interval '6 days'),

(16, 8, NULL, 11, 'Lộc Vừng Mini',
    'loc-vung-mini',
    'Hà Nội', 'approved', '0987654321', 10, 2, true, now() - interval '1 days', now() - interval '1 days');

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
-- Post 10: Kim Quýt Mini
(10, 1, 'Dáng Trực'),     (10, 2, '32'),  (10, 3, '10'),  (10, 4, '6'),  (10, 5, 'Vườn giống Bắc Ninh'),
-- Post 11: Mai Chiếu Thủy Dáng Bay
(11, 1, 'Dáng Xiên'),     (11, 2, '58'),  (11, 3, '24'),  (11, 4, '9'),  (11, 5, 'Gò Công, Tiền Giang'),
-- Post 12: Duối Cổ
(12, 1, 'Dáng Xiên'),     (12, 2, '76'),  (12, 3, '30'),  (12, 4, '14'), (12, 5, 'Miền Tây tuyển chọn'),
-- Post 13: Sanh Cổ Tán Rơi
(13, 1, 'Dáng Hoành'),    (13, 2, '155'), (13, 3, '58'),  (13, 4, '18'), (13, 5, 'Nam Định'),
-- Post 14: Lộc Vừng Phong Thủy
(14, 1, 'Dáng Huyền'),    (14, 2, '72'),  (14, 3, '22'),  (14, 5, 'Bến Tre'),
-- Post 15: Ổi Bonsai
(15, 1, 'Dáng Hoành'),    (15, 2, '48'),  (15, 3, '18'),  (15, 4, '7'),  (15, 5, 'Bắc Ninh'),
-- Post 16: Lộc Vừng Mini
(16, 1, 'Dáng Trực'),     (16, 2, '35'),  (16, 3, '20'),  (16, 4, '5'),  (16, 5, 'Hà Nội');

-- Media Assets Seed Data
INSERT INTO media_assets (target_type, target_id, media_type, url, sort_order) VALUES
-- Post 1: Sanh Nam Điền Mini
('post', 1, 'image', '/uploads/sanh-nam-dien-mini-1.jpg', 0),
('post', 1, 'image', '/uploads/sanh-nam-dien-mini-2.jpg', 1),
('post', 1, 'image', '/uploads/sanh-nam-dien-mini-3.jpg', 2),
-- Post 2: Tùng La Hán
('post', 2, 'image', '/uploads/tung-la-han-1.jpg', 0),
('post', 2, 'image', '/uploads/tung-la-han-2.jpg', 1),
-- Post 3: Linh Sam
('post', 3, 'image', '/uploads/linh-sam-1.jpg', 0),
('post', 3, 'image', '/uploads/linh-sam-2.jpg', 1),
-- Post 4: Sanh Quê Đại
('post', 4, 'image', '/uploads/sanh-que-dai-1.jpg', 0),
-- Post 5: MCT Mini
('post', 5, 'image', '/uploads/mct-mini-1.jpg', 0),
('post', 5, 'image', '/uploads/mct-mini-2.jpg', 1),
-- Post 6: Thông Đen
('post', 6, 'image', '/uploads/thong-den-1.jpg', 0),
-- Post 7: Si Phong Thủy
('post', 7, 'image', '/uploads/si-phong-thuy-1.jpg', 0),
-- Post 8: Mai Vàng
('post', 8, 'image', '/uploads/mai-vang-1.jpg', 0),
('post', 8, 'image', '/uploads/mai-vang-2.jpg', 1),
-- Post 9: Tùng Bách Tán
('post', 9, 'image', '/uploads/tung-bach-tan-1.jpg', 0),
-- Post 10: Kim Quýt Mini
('post', 10, 'image', '/uploads/kim-quyt-mini-1.jpg', 0),
-- Post 11: Mai Chiếu Thủy Dáng Bay
('post', 11, 'image', '/uploads/mai-chieu-thuy-bay-1.jpg', 0),
('post', 11, 'image', '/uploads/mai-chieu-thuy-bay-2.jpg', 1),
-- Post 12: Duối Cổ
('post', 12, 'image', '/uploads/duoi-co-xien-1.jpg', 0),
-- Post 13: Sanh Cổ Tán Rơi
('post', 13, 'image', '/uploads/sanh-co-tan-roi-1.jpg', 0),
('post', 13, 'image', '/uploads/sanh-co-tan-roi-2.jpg', 1),
-- Post 14: Lộc Vừng Phong Thủy
('post', 14, 'image', '/uploads/loc-vung-huyen-1.jpg', 0),
-- Post 15: Ổi Bonsai
('post', 15, 'image', '/uploads/oi-bonsai-sai-qua-1.jpg', 0),
-- Post 16: Lộc Vừng Mini
('post', 16, 'image', '/uploads/loc-vung-mini-1.jpg', 0),
('post', 16, 'image', '/uploads/loc-vung-mini-2.jpg', 1);

-- Favorite Posts (Bookmarks)
-- User Favorites (Mock - Posts & Contents)
INSERT INTO user_favorites (user_id, target_id, target_type, created_at) VALUES
(1, 1, 'post', now() - interval '20 days'),
(1, 3, 'post', now() - interval '15 days'),
(1, 8, 'post', now() - interval '5 days'),
(8, 2, 'post', now() - interval '18 days'),
(8, 5, 'post', now() - interval '10 days'),
(8, 13, 'post', now() - interval '8 days'),
(2, 9, 'post', now() - interval '3 days');

-- ============================================================
-- PLACEMENT SLOTS & PROMOTION PACKAGES
-- ============================================================
INSERT INTO placement_slots (placement_slot_id, placement_slot_code, placement_slot_title, placement_slot_capacity, placement_slot_rules, placement_slot_published) VALUES
(1, 'BOOST_POST', 'Vị trí 1 trang chủ', 1, '{"scope": "Homepage", "displayRule": "Priority Score", "priority": 1, "notes": "Vị trí đầu tiên dành cho bài đẩy trên trang chủ."}', true),
(2, 'SHOP_VIP', 'Gói tài khoản', 10, '{"audience": "active-shop", "target": "shop-list", "priority": 1, "notes": "Dùng cho gói tài khoản / shop và ưu tiên hiển thị ở danh sách nhà vườn."}', true),
(3, 'BOOST_POST_2', 'Vị trí 2 trang chủ', 1, '{"scope": "Homepage", "displayRule": "Priority Score", "priority": 2, "notes": "Vị trí thứ hai dành cho bài đẩy trên trang chủ."}', true),
(4, 'BOOST_POST_3', 'Vị trí 3 trang chủ', 1, '{"scope": "Homepage", "displayRule": "Priority Score", "priority": 3, "notes": "Vị trí thứ ba dành cho bài đẩy trên trang chủ."}', true),
(5, 'SHOP_REGISTRATION', 'Đăng ký nhà vườn', 0, NULL, true),
(6, 'PERSONAL_PLAN', 'Nâng cấp cá nhân tháng', 0, NULL, true);

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
(1, 3, 'Gói đẩy bài theo tuần vị trí 2 trang chủ', 7, 1, 35000, 'Ưu tiên hiển thị bài đăng trong 7 ngày ở vị trí 2 trang chủ.', true),
(2, 1, 'Gói đẩy bài theo tuần vị trí 1 trang chủ', 7, 1, 180000, 'Ưu tiên hiển thị bài đăng trong 7 ngày ở vị trí 1 trang chủ.', true),
(3, 2, 'Gói nhà vườn VIP (3 tháng)', 90, 0, 0, 'Ưu tiên shop lên đầu danh sách nhà vườn và tăng nhận diện VIP trong 90 ngày.', true),
(4, 4, 'Gói đẩy bài theo tuần vị trí 3 trang chủ', 7, 1, 5000, 'Ưu tiên hiển thị bài đăng trong 7 ngày ở vị trí 3 trang chủ.', true),
(5, 5, 'Gói Lên Nhà Vườn (Vĩnh viễn)', 36500, 0, 0, 'Nâng cấp tài khoản cá nhân lên tài khoản nhà vườn chuyên nghiệp.', true),
(6, 6, 'Gói Cá Nhân (30 ngày)', 30, 0, 0, 'Gói đăng tin ưu tiên cho cá nhân trong 30 ngày.', true);

-- Promotion Package Prices
INSERT INTO promotion_package_prices (price_id, package_id, price, effective_from, effective_to, note, created_by) VALUES
(1, 1, 99000, now() - interval '45 days', NULL, 'Giá hiện hành của gói vị trí 2 trang chủ.', 1),
(2, 2, 299000, now() - interval '45 days', NULL, 'Giá hiện hành của gói vị trí 1 trang chủ.', 1),
(3, 3, 499000, now() - interval '45 days', NULL, 'Giá hiện hành của gói VIP 3 tháng.', 1),
(4, 4, 29000, now() - interval '45 days', NULL, 'Giá hiện hành của gói vị trí 3 trang chủ.', 1),
(5, 5, 250000, now() - interval '45 days', NULL, 'Giá chuẩn cho đăng ký nhà vườn.', 1),
(6, 6, 30000, now() - interval '45 days', NULL, 'Giá chuẩn cho gói cá nhân tháng.', 1);

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
(1, 1, 'GARDEN_OWNER_LIFETIME', 'Gói chủ vườn vĩnh viễn', 'lifetime', 'active', true, 20, 20000, 4, 5000, now() - interval '120 days', NULL, now() - interval '120 days', now() - interval '120 days'),
(2, 2, 'PERSONAL_MONTHLY',      'Gói cá nhân theo tháng', 'monthly',  'active', true, 20,     0, 4, 5000, now() - interval '12 days',  now() + interval '18 days', now() - interval '12 days', now() - interval '12 days'),
(3, 3, 'PERSONAL_MONTHLY',      'Gói cá nhân theo tháng', 'monthly',  'expired', true, 20,    0, 4, 5000, now() - interval '65 days', now() - interval '35 days', now() - interval '65 days', now() - interval '35 days');

-- Fee ledger demo for posting-plan billing (tracking only)
-- Fee ledger demo for posting-plan billing (tracking only)
INSERT INTO ledgers (
    ledger_id,
    ledger_user_id,
    ledger_amount,
    ledger_type,
    ledger_direction,
    ledger_status,
    ledger_reference_type,
    ledger_reference_id,
    ledger_note,
    ledger_created_at
) VALUES
(100, 1, 20000, 'POST_CREATE', 'DEBIT', 'available', 'post', 15, 'Owner plan create-post fee tracking.', now() - interval '7 days'),
(101, 3, 20000, 'POST_CREATE', 'DEBIT', 'available', 'post', 9,  'Owner plan create-post fee tracking.', now() - interval '5 days'),
(102, 1, 5000,  'POST_EDIT',   'DEBIT', 'available', 'post', 7,  'Charged after free edit quota was exhausted.', now() - interval '2 days'),
(103, 2, 5000,  'POST_EDIT',   'DEBIT', 'available', 'post', 6,  'Monthly personal plan paid edit beyond free quota.', now() - interval '1 day');

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
('site_description', 'Sàn mua bán cây cảnh bonsai hàng đầu Việt Nam', 1),
('max_images_per_post', '10', 1),
('max_video_per_post', '2', 1),
('post_auto_approve', 'false', 1),
('otp_expire_minutes', '10', 1),
('vnpay_sandbox', 'true', 1),
('contact_email', 'support@greenmarket.com', 1),
('contact_phone', '1900-xxxx', 1),
('shop_registration_price', '250000', 1),
('personal_monthly_price', '30000', 1),
('owner_posting_policy', '{"planTitle": "Gói Chủ Vườn Vĩnh Viễn", "autoApprove": true, "dailyPostLimit": 20, "postFeeAmount": 20000, "freeEditQuota": 4, "editFeeAmount": 5000, "features": ["Đăng bài ngay, không qua chờ duyệt", "Giới hạn 20 bài viết mỗi ngày", "4 lượt sửa bài miễn phí", "Phí đăng tin lẻ cực thấp"]}', 1),
('personal_posting_policy', '{"planTitle": "Gói Cá Nhân Theo Tháng", "autoApprove": true, "dailyPostLimit": 20, "postFeeAmount": 0, "freeEditQuota": 4, "editFeeAmount": 5000, "features": ["Dành cho người chơi nhỏ lẻ", "Đăng bài tự động duyệt trong chu kỳ", "Giới hạn 20 bài viết mỗi ngày", "4 lượt sửa bài miễn phí mỗi tháng"]}', 1),
('shop_vip_policy', '{"planTitle": "Gói Nhà Vườn VIP", "features": ["Xếp đầu danh sách nhà vườn", "Gắn nhãn VIP nổi bật trong danh sách nhà vườn", "Hiển thị viền vàng sang trọng cho shop", "Ưu tiên hỗ trợ từ đội ngũ vận hành"]}', 1),
('admin_web_settings', '{"general":{"platformName":"GreenMarket","supportEmail":"support@greenmarket.vn","defaultLanguage":"Vietnamese"},"moderation":{"autoModeration":true,"bannedKeywordFilter":true,"reportLimit":5},"postLifecycle":{"postExpiryDays":30,"restoreWindowDays":7,"allowAutoExpire":true},"media":{"maxImagesPerPost":10,"maxFileSizeMb":5,"enableImageCompression":true},"hostIncome":{"articlePayoutAmount":300000,"viewBonusThreshold":1000,"viewBonusAmount":120000}}', 1),
('admin_template_builder_config', '{"templateName":"Mẫu đăng tin cây cảnh","categoryName":"Cây cảnh & Bonsai","usageNote":"Dùng để xem trước bố cục form đăng tin cho ngành cây cảnh trước khi đưa vào vận hành.","previewTitlePlaceholder":"Ví dụ: Sanh mini 8 năm tuổi, dáng trực","submitLabel":"Đăng tin cây cảnh (Xem trước)","fields":[{"id":"bonsai-style","type":"select","label":"Dáng cây (Thế cây)","placeholder":"Chọn dáng cây","helperText":"Giúp người đăng mô tả bố cục bonsai theo đúng cách gọi phổ biến.","required":true,"options":["Trực","Xiêu","Huyền","Hoành","Văn nhân"]},{"id":"pot-type","type":"select","label":"Loại chậu đi kèm","placeholder":"Chọn loại chậu","helperText":"Thể hiện tình trạng đi kèm chậu để người mua định giá rõ hơn.","required":true,"options":["Chậu gốm","Chậu đá","Bầu đất / túi ươm"]},{"id":"tree-age","type":"number","label":"Tuổi cây (ước lượng)","placeholder":"Ví dụ: 8","helperText":"Dùng để ước lượng độ trưởng thành của cây, hỗ trợ so sánh giá trị.","required":false,"options":[]}]}', 1),
('admin_ai_insight_settings', '{"autoDailySummary":true,"anomalyAlerts":true,"operatorDigest":false,"recommendationTone":"Balanced","confidenceThreshold":78,"promptVersion":"gm-admin-v1.4","reviewMode":"Required"}', 1);


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
(1, 'Post Rejection - Invalid Content', 'Rejection Reason', 'Bài đăng của bạn vi phạm chính sách nội dung của GreenMarket vì hình ảnh hoặc video tải lên không khớp với thông tin niêm yết. Vui lòng chỉnh sửa nội dung rồi gửi lại.', 'Active', 1, '2026-03-10 09:00:00', 1, '2026-03-14 10:15:00'),
(2, 'Post Rejection - Missing Information', 'Rejection Reason', 'Bài đăng của bạn đang thiếu thông tin bắt buộc như hướng dẫn chăm sóc, kích thước sản phẩm hoặc giá bán chính xác. Vui lòng bổ sung đầy đủ trước khi gửi lại.', 'Active', 1, '2026-03-11 09:20:00', 1, '2026-03-13 08:30:00'),
(3, 'Report Reason - Spam Content', 'Report Reason', 'Bài đăng này có dấu hiệu lặp lại nội dung quảng bá, chèn thông tin liên hệ ngoài hệ thống hoặc sử dụng câu chữ gây hiểu nhầm để thu hút chú ý.', 'Active', 1, '2026-03-08 13:00:00', 1, '2026-03-12 14:10:00'),
(4, 'Report Reason - Suspicious Pricing', 'Report Reason', 'Mức giá của bài đăng này chênh lệch đáng kể so với các bài tương tự trên sàn và cần được đội kiểm duyệt xem xét thủ công.', 'Active', 1, '2026-03-09 11:10:00', 1, '2026-03-12 16:05:00'),
(5, 'Notification - Payment Verification', 'Notification', 'GreenMarket đã nhận xác nhận chuyển khoản. Quản trị viên đang kiểm tra thanh toán trước khi mở lại hoặc cập nhật gói quảng bá của bạn.', 'Active', 1, '2026-03-15 10:00:00', 1, '2026-03-18 09:30:00'),
(6, 'Notification - Promotion Reopened', 'Notification', 'Chiến dịch đã hết hạn của bạn đã được mở lại sau khi thanh toán được xác minh. Việc phân phối sẽ tiếp tục ngay ở vị trí hiển thị đã gán.', 'Active', 1, '2026-03-16 14:00:00', 1, '2026-03-18 15:20:00'),
(7, 'Notification - Export Completed', 'Notification', 'Yêu cầu xuất dữ liệu quản trị đã hoàn tất thành công. Hãy tải báo cáo tại màn lịch sử xuất dữ liệu.', 'Active', 1, '2026-03-17 08:00:00', 1, '2026-03-17 08:05:00'),
(8, 'Internal Moderation Escalation', 'Notification', 'Trường hợp này đã được chuyển lên đầu mối kiểm duyệt để rà soát thủ công vì ảnh hưởng đến chất lượng phân phối quảng bá hoặc mức độ an toàn của sàn.', 'Disabled', 1, '2026-03-18 09:45:00', 1, '2026-03-25 10:00:00');

-- ============================================================
-- POST PROMOTIONS / BOOSTED CAMPAIGNS
-- ============================================================
INSERT INTO post_promotions (
    post_promotion_id,
    post_promotion_post_id,
    post_promotion_buyer_id,
    post_promotion_package_id,
    post_promotion_slot_id,
    post_promotion_snapshot_title,
    post_promotion_snapshot_priority,
    post_promotion_start_at,
    post_promotion_end_at,
    post_promotion_status,
    post_promotion_created_at
) VALUES
(1, 1, 1, 2, 1, 'Gói đẩy bài theo tháng vị trí 1 trang chủ', 1, '2026-03-05 08:00:00', '2026-04-03 23:59:00', 'expired',  '2026-03-04 16:00:00'),
(2, 4, 3, 1, 3, 'Gói đẩy bài theo tháng vị trí 2 trang chủ', 2, '2026-03-12 08:00:00', '2026-04-10 23:59:00', 'expired',  '2026-03-11 14:20:00'),
(3, 2, 3, 4, 4, 'Gói đẩy bài theo tháng vị trí 3 trang chủ', 3, '2026-03-08 08:00:00', '2026-04-06 23:59:00', 'expired',  '2026-03-07 17:30:00'),
(5, 12, 6, 1, 3, 'Gói đẩy bài theo tháng vị trí 2 trang chủ', 2, '2026-03-28 08:00:00', '2026-04-26 23:59:00', 'paused',   '2026-03-27 15:10:00'),
(6, 9, 3, 2, 1, 'Gói đẩy bài theo tháng vị trí 1 trang chủ', 1, '2026-04-11 08:00:00', '2026-05-10 23:59:00', 'scheduled','2026-04-09 08:30:00'),
(7, 15, 1, 2, 1, 'Gói đẩy bài theo tháng vị trí 1 trang chủ', 1, '2026-04-16 08:00:00', '2026-05-15 23:59:00', 'active',   '2026-04-16 07:40:00'),
(8, 7, 1, 1, 3, 'Gói đẩy bài theo tháng vị trí 2 trang chủ', 2, '2026-04-16 08:05:00', '2026-05-15 23:59:00', 'active',   '2026-04-16 07:45:00');

-- ============================================================
-- PAYMENT TRANSACTIONS
-- ============================================================
-- Seed Transactions (Previously payment_txn)
INSERT INTO transactions (
    transaction_id,
    transaction_user_id,
    transaction_amount,
    transaction_type,
    transaction_provider,
    transaction_provider_txn_id,
    transaction_status,
    transaction_reference_type,
    transaction_reference_id,
    transaction_created_at
) VALUES
(10, 1, 250000, 'payment', 'bank_transfer', 'GM-TXN-20260101-001', 'success', 'plan', null, '2026-01-01 09:00:00'),
(11, 3, 250000, 'payment', 'bank_transfer', 'GM-TXN-20260103-002', 'success', 'plan', null, '2026-01-03 10:00:00'),
(12, 9, 250000, 'payment', 'bank_transfer', 'GM-TXN-20260105-003', 'success', 'plan', null, '2026-01-05 11:00:00'),
(13, 6, 250000, 'payment', 'bank_transfer', 'GM-TXN-20260107-004', 'success', 'plan', null, '2026-01-07 11:30:00'),
(14, 2, 30000,  'payment', 'bank_transfer', 'GM-TXN-20260403-005', 'success', 'plan', null, '2026-04-03 18:58:00'),
(15, 1, 499000, 'payment', 'bank_transfer', 'GM-TXN-20260316-006', 'success', 'package', 3, '2026-03-16 18:58:00'),
(16, 1, 299000, 'payment', 'bank_transfer', 'GM-TXN-20260304-007', 'success', 'package', 2, '2026-03-04 15:30:00'),
(17, 3, 99000,  'payment', 'bank_transfer', 'GM-TXN-20260311-008', 'success', 'package', 1, '2026-03-11 13:40:00'),
(18, 3, 299000, 'payment', 'bank_transfer', 'GM-TXN-20260409-009', 'success', 'package', 2, '2026-04-09 08:50:00'),
(19, 6, 99000,  'payment', 'bank_transfer', 'GM-TXN-20260327-010', 'success', 'package', 1, '2026-03-27 15:10:00'),
(20, 1, 299000, 'payment', 'bank_transfer', 'GM-TXN-20260416-011', 'success', 'package', 2, '2026-04-16 07:40:00'),
(21, 1, 99000,  'payment', 'bank_transfer', 'GM-TXN-20260416-012', 'success', 'package', 1, '2026-04-16 07:45:00');

-- Tickets Seed Data (Reports migrated)
INSERT INTO tickets (ticket_id, ticket_type, ticket_creator_id, ticket_target_type, ticket_target_id, ticket_title, ticket_content, ticket_status, ticket_resolution_note, ticket_meta_data, ticket_created_at, ticket_updated_at) VALUES
(1, 'REPORT', 10, 'post', 1, 'Báo cáo bài đăng #1', 'Post title and product details are not consistent with the attached listing photos.', 'open', NULL, '{"reason_code": "MISLEADING_INFO", "note": "The seller describes a different bonsai shape in the text than in the gallery."}', '2026-03-29 09:15:00', '2026-03-29 09:15:00'),
(2, 'REPORT', 10, 'post', 2, 'Báo cáo bài đăng #2', 'The post content repeats promotional text and external contact instructions too aggressively.', 'resolved', 'Seller was instructed to remove repeated off-platform promotion text before republishing.', '{"reason_code": "SPAM_PROMOTION", "note": "Please review whether this listing should stay visible or be rewritten."}', '2026-03-28 15:42:00', '2026-03-29 10:05:00'),
(3, 'REPORT', 10, 'post', 6, 'Báo cáo bài đăng #6', 'The listed price looks abnormal compared with similar ornamental plant posts in the same category.', 'closed', 'Pricing was verified with the shop and no policy breach was found.', '{"reason_code": "SUSPICIOUS_PRICING", "note": "Potential bait pricing. Needs manual moderation follow-up."}', '2026-03-27 11:20:00', '2026-03-28 08:40:00'),
(4, 'REPORT', 8, 'post', 3, 'Báo cáo bài đăng #3', 'Listing photos appear copied from another marketplace source.', 'open', NULL, '{"reason_code": "COPYRIGHT_MEDIA", "note": "Image set looks duplicated from a third-party seller page."}', '2026-03-26 14:05:00', '2026-03-26 14:05:00'),
(5, 'REPORT', 2, 'post', 4, 'Báo cáo bài đăng #4', 'Seller requests direct contact outside GreenMarket before checkout.', 'resolved', 'Content was edited and compliant version was republished.', '{"reason_code": "OFF_PLATFORM_CONTACT", "note": "Contains messaging that bypasses marketplace payment flow."}', '2026-03-25 16:25:00', '2026-03-26 10:10:00'),
(6, 'REPORT', 9, 'post', 8, 'Báo cáo bài đăng #8', 'The post was published under the wrong category and disrupts category relevance.', 'closed', 'Category was acceptable after manual review.', '{"reason_code": "WRONG_CATEGORY", "note": "Needs category correction and listing clean-up."}', '2026-03-24 09:30:00', '2026-03-24 17:20:00'),
(7, 'REPORT', 10, 'post', 9, 'Báo cáo bài đăng #9', 'The post description overstates the maturity and shape training of the tree.', 'open', NULL, '{"reason_code": "MISLEADING_INFO", "note": "Customer noted mismatch between wording and actual plant size."}', '2026-03-23 13:15:00', '2026-03-23 13:15:00'),
(8, 'REPORT', 8, 'post', 13, 'Báo cáo bài đăng #13', 'Repeated marketing text is making the listing difficult to review.', 'resolved', 'Seller removed duplicated promotional slogans and listing stayed visible.', '{"reason_code": "SPAM_PROMOTION", "note": "Needs moderation note and content clean-up."}', '2026-03-22 10:45:00', '2026-03-22 15:40:00'),
(9, 'REPORT', 2, 'post', 15, 'Báo cáo bài đăng #15', 'The reported price looks too low compared with product material quality.', 'open', NULL, '{"reason_code": "SUSPICIOUS_PRICING", "note": "Possible bait price to attract off-platform contact."}', '2026-03-21 11:05:00', '2026-03-21 11:05:00');

-- ============================================================
-- EVENT LOGS / EXPORT HISTORY / ACTIVITY LOG
-- ============================================================
-- Event Logs / Activity Log Seed Data
INSERT INTO event_logs (
    event_log_id,
    event_log_user_id,
    event_log_target_type,
    event_log_target_id,
    event_log_event_type,
    event_log_event_time,
    event_log_meta
) VALUES
(1, 6, 'system', NULL, 'admin_login',        '2026-03-29 08:00:00', '{"action":"Đăng nhập trang quản trị","detail":"Phiên đăng nhập trang quản trị đã được khởi tạo thành công.","performedBy":"Quản trị viên hệ thống"}'),
(2, 3, 'user', 3, 'role_assigned',      '2026-03-29 08:35:00', '{"action":"Gán vai trò","detail":"Đã gán vai trò: Nhân viên vận hành.","performedBy":"Quản trị viên hệ thống"}'),
(3, 9, 'user', 9, 'account_locked',     '2026-03-29 09:10:00', '{"action":"Khóa tài khoản","detail":"Quyền truy cập của người dùng đã bị hạn chế sau bước rà soát kiểm duyệt.","performedBy":"Quản trị viên hệ thống"}'),
(4, 9, 'user', 9, 'account_unlocked',   '2026-03-29 11:05:00', '{"action":"Mở khóa tài khoản","detail":"Quyền truy cập của người dùng đã được khôi phục sau khi xác minh.","performedBy":"Quản trị viên hệ thống"}'),
(5, 1, 'system', NULL, 'admin_export',       '2026-03-29 12:00:00', '{"action":"Tạo tệp xuất","detail":"Đã hoàn tất xuất CSV danh sách người dùng.","generatedBy":"Quản trị viên hệ thống","reportName":"Xuất danh sách người dùng - 2026-03-29","status":"Completed"}'),
(6, 1, 'system', NULL, 'admin_export',       '2026-03-29 12:08:00', '{"action":"Tạo tệp xuất","detail":"Đã hoàn tất xuất CSV tổng quan doanh thu.","generatedBy":"Quản trị viên hệ thống","reportName":"Tổng quan doanh thu - 2026-03-29","status":"Completed"}'),
(7, 1, 'system', NULL, 'admin_export',       '2026-03-29 12:16:00', '{"action":"Tạo tệp xuất","detail":"Đã hoàn tất xuất CSV chi tiêu khách hàng.","generatedBy":"Quản trị viên hệ thống","reportName":"Chi tiêu khách hàng - 2026-03-29","status":"Completed"}'),
(8, 1, 'system', NULL, 'admin_export',       '2026-03-29 12:25:00', '{"action":"Tạo tệp xuất","detail":"Đã hoàn tất xuất CSV tổng quan phân tích.","generatedBy":"Quản trị viên hệ thống","reportName":"Tổng quan phân tích - 2026-03-29","status":"Completed"}'),
(9, 1, 'system', NULL, 'admin_export',       '2026-03-29 12:33:00', '{"action":"Tạo tệp xuất","detail":"Đã hoàn tất xuất CSV vận hành khuyến mãi.","generatedBy":"Quản trị viên hệ thống","reportName":"Vận hành khuyến mãi - 2026-03-29","status":"Completed"}'),
(10, 1, 'system', NULL, 'admin_export',      '2026-03-29 12:44:00', '{"action":"Tạo tệp xuất","detail":"Đã hoàn tất xuất CSV bài đang quảng bá.","generatedBy":"Quản trị viên hệ thống","reportName":"Bài đang quảng bá - 2026-03-29","status":"Completed"}'),
(11, 2, 'post', 2, 'promotion_resumed',            '2026-03-30 09:20:00', '{"action":"Tiếp tục chiến dịch quảng bá","detail":"Chiến dịch vị trí 2 trang chủ đã được tiếp tục sau khi cập nhật nội dung.","performedBy":"Quản trị viên hệ thống"}'),
(12, 1, 'post', 3, 'promotion_reopened',           '2026-03-30 15:10:00', '{"action":"Mở lại chiến dịch quảng bá","detail":"Chiến dịch vị trí 3 trang chủ đã hết hạn được mở lại sau khi xác nhận thanh toán.","performedBy":"Quản trị viên hệ thống"}');

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
(4,  '2026-03-08', 3, 11, 1800, 37, 18, 4, 2.06, '2026-03-08 23:59:00'),
(5,  '2026-03-09', 3, 11, 1850, 39, 19, 4, 2.11, '2026-03-09 23:59:00'),
(6,  '2026-03-10', 1, 11, 3200, 95, 40, 9, 2.97, '2026-03-10 23:59:00'),
(7,  '2026-03-11', 1, 11, 3350, 98, 42, 9, 2.93, '2026-03-11 23:59:00'),
(8,  '2026-03-12', 1, 11, 3450, 103, 46, 10, 2.99, '2026-03-12 23:59:00'),
(9,  '2026-03-13', 1, 11, 3600, 108, 48, 11, 3.00, '2026-03-13 23:59:00'),
(10, '2026-03-14', 4, 11, 1900, 41, 20, 5, 2.16, '2026-03-14 23:59:00'),
(11, '2026-03-20', 1, 12, 7200, 104, 51, 13, 1.44, '2026-03-20 23:59:00'),
(12, '2026-03-21', 1, 12, 7100, 102, 50, 12, 1.44, '2026-03-21 23:59:00'),
(13, '2026-03-22', 1, 12, 7250, 108, 53, 14, 1.49, '2026-03-22 23:59:00'),
(14, '2026-03-23', 1, 12, 7050, 101, 49, 12, 1.43, '2026-03-23 23:59:00'),
(15, '2026-03-24', 1, 12, 7300, 111, 55, 14, 1.52, '2026-03-24 23:59:00'),
(16, '2026-03-25', 3, 11, 7600, 182, 88, 20, 2.39, '2026-03-25 23:59:00'),
(17, '2026-03-26', 1, 12, 7400, 106, 54, 13, 1.43, '2026-03-26 23:59:00'),
(18, '2026-03-27', 3, 11, 7550, 180, 86, 20, 2.38, '2026-03-27 23:59:00'),
(19, '2026-03-28', 3, 11, 7480, 177, 85, 19, 2.37, '2026-03-28 23:59:00'),
(20, '2026-03-29', 3, 11, 7620, 183, 89, 20, 2.40, '2026-03-29 23:59:00'),
(21, '2026-03-30', 4, 11, 7500, 181, 87, 19, 2.41, '2026-03-30 23:59:00'),
(22, '2026-03-31', 4, 11, 7580, 184, 90, 21, 2.43, '2026-03-31 23:59:00');

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
(2,  '2026-03-08', 3, 68.0, '{"traffic":64,"revenue":66,"operations":74}', '2026-03-08 23:59:00'),
(3,  '2026-03-11', 1, 84.0, '{"traffic":83,"revenue":79,"operations":86}', '2026-03-11 23:59:00'),
(4,  '2026-03-14', 4, 71.0, '{"traffic":69,"revenue":67,"operations":77}', '2026-03-14 23:59:00'),
(5,  '2026-03-20', 1, 63.0, '{"traffic":61,"revenue":65,"operations":63}', '2026-03-20 23:59:00'),
(6,  '2026-03-22', 1, 66.0, '{"traffic":64,"revenue":68,"operations":66}', '2026-03-22 23:59:00'),
(7,  '2026-03-25', 3, 87.0, '{"traffic":88,"revenue":83,"operations":90}', '2026-03-25 23:59:00'),
(8,  '2026-03-27', 1, 72.0, '{"traffic":70,"revenue":73,"operations":73}', '2026-03-27 23:59:00'),
(9,  '2026-03-29', 4, 89.0, '{"traffic":90,"revenue":86,"operations":91}', '2026-03-29 23:59:00'),
(10, '2026-03-31', 1, 74.0, '{"traffic":72,"revenue":75,"operations":75}', '2026-03-31 23:59:00');

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
(1, 1, 'Placement Performance', '{"title":"Tóm tắt hiệu quả vị trí hiển thị","focus":"Placement Performance","status":"Generated","generatedBy":"Quản trị viên hệ thống","model":"Gemini gemini-2.0-flash"}', 'Lưu lượng trang chủ giữ ở mức ổn định, trong khi vị trí 2 trang chủ vượt kỳ vọng doanh thu ở tuần cuối tháng 3. Nên tiếp tục duy trì slot vị trí 2 vì đây là điểm chuyển đổi tốt trong nhóm bài đẩy đang hoạt động.', 'Gemini gemini-2.0-flash', '2026-03-25 10:00:00'),
(2, 1, 'Promotion Watchlist',   '{"title":"Tóm tắt khuyến mãi cần theo dõi","focus":"Promotion Watchlist","status":"Needs Review","generatedBy":"Quản trị viên hệ thống","model":"Gemini gemini-2.0-flash"}', 'Các chiến dịch vị trí 3 trang chủ hết hạn vào ngày 2026-03-26 vẫn cho thấy tín hiệu nhu cầu. Cần rà soát xem trường hợp nào đủ điều kiện để mở lại sau khi xác nhận thanh toán.', 'Gemini gemini-2.0-flash', '2026-03-26 09:45:00'),
(3, 1, 'Revenue Signals',       '{"title":"Tóm tắt tín hiệu doanh thu","focus":"Revenue Signals","status":"Generated","generatedBy":"Quản trị viên hệ thống","model":"Gemini gemini-2.0-flash"}', 'Doanh thu tháng 3 tập trung chủ yếu ở các gói vị trí 1 và vị trí 2 trang chủ. Gói vị trí 3 tăng về số lượng ở cuối tháng nhưng đóng góp doanh thu vẫn thấp hơn các vị trí cao cấp.', 'Gemini gemini-2.0-flash', '2026-03-27 14:15:00'),
(4, 1, 'Operator Load',         '{"title":"Tóm tắt khối lượng vận hành","focus":"Operator Load","status":"Generated","generatedBy":"Quản trị viên hệ thống","model":"Gemini gemini-2.0-flash"}', 'Nhóm vận hành B đang xử lý nhiều chiến dịch vị trí 2 nhất. Khối lượng hiện tại vẫn trong ngưỡng chấp nhận, nhưng các ca leo thang mới nên được phân bổ thêm cho Nhóm vận hành A ở chu kỳ tiếp theo.', 'Gemini gemini-2.0-flash', '2026-03-28 08:40:00'),
(5, 1, 'Placement Performance', '{"title":"Tóm tắt hiệu quả vị trí hiển thị","focus":"Placement Performance","status":"Archived","generatedBy":"Quản trị viên hệ thống","model":"Gemini gemini-2.0-flash"}', 'Lượt hiển thị trang chủ đầu tháng 3 ở mức tốt nhưng giảm dần trước khi gói cao cấp 30 ngày được kích hoạt. Cần rà soát lại độ mới của nội dung quảng bá dành cho khách mua vị trí trang chủ.', 'Gemini gemini-2.0-flash', '2026-03-29 16:25:00'),
(6, 1, 'Revenue Signals',       '{"title":"Tóm tắt tín hiệu doanh thu","focus":"Revenue Signals","status":"Needs Review","generatedBy":"Quản trị viên hệ thống","model":"Gemini gemini-2.0-flash"}', 'Giá trị đơn hàng trung bình hiện được giữ bởi các gói vị trí 1 trang chủ, trong khi các gói vị trí 3 đang kéo số lượng đơn. Nên tiếp tục theo dõi đồng thời cả hai tầng gói trong phân tích giá.', 'Gemini gemini-2.0-flash', '2026-03-30 11:10:00');


-- ============================================================
-- RESET SEQUENCES
-- ============================================================

-- ============================================================
-- OPERATIONS & MANAGER DATA
-- ============================================================

-- Tickets Seed Data (Support & Escalations migrated)
INSERT INTO tickets (ticket_id, ticket_type, ticket_creator_id, ticket_assignee_id, ticket_status, ticket_priority, ticket_title, ticket_content, ticket_target_type, ticket_target_id, ticket_created_at, ticket_updated_at) VALUES
(10, 'SUPPORT', 2, 6, 'in_progress', 'medium', 'Hỗ trợ đổi email shop', 'Khách hàng gặp lỗi OTP khi đổi email.', NULL, NULL, now() - interval '2 days', now() - interval '1 day'),
(11, 'REPORT', 8, 6, 'open', 'high', 'Xác minh báo cáo spam', 'Report #2 cần tra xét IP.', 'post', 2, now() - interval '1 day', now() - interval '1 day'),
(12, 'SUPPORT', 1, 6, 'resolved', 'high', 'Cấp lại quyền đăng bài', 'Đã mở khóa.', NULL, NULL, now() - interval '5 days', now() - interval '4 days'),
(13, 'ESCALATION', 6, 10, 'open', 'high', 'Leo thang xử lý shop vi phạm', 'Shop này vi phạm nhiều lần, vượt quyền hạn của Operation Staff.', 'shop', 1, now() - interval '12 hours', now() - interval '12 hours');

-- Task/Ticket Replies
INSERT INTO task_replies (reply_id, ticket_id, sender_id, message, visibility, created_at) VALUES
(1, 10, 6, 'Tôi đang kiểm tra hệ thống SMS provider.', 'internal', now() - interval '1 day'),
(2, 11, 6, 'Khách này có dấu hiệu spam thực sự. Sẽ báo cấp trên.', 'internal', now() - interval '12 hours');

-- Seq
SELECT setval('tickets_ticket_id_seq', (SELECT COALESCE(MAX(ticket_id), 1) FROM tickets));
SELECT setval('task_replies_reply_id_seq', (SELECT COALESCE(MAX(reply_id), 1) FROM task_replies));


SELECT setval('users_user_id_seq', (SELECT COALESCE(MAX(user_id), 1) FROM users));
SELECT setval('admins_admin_id_seq', (SELECT COALESCE(MAX(admin_id), 1) FROM admins));
SELECT setval('roles_role_id_seq', (SELECT COALESCE(MAX(role_id), 1) FROM roles));
SELECT setval('business_roles_business_role_id_seq', (SELECT COALESCE(MAX(business_role_id), 1) FROM business_roles));
SELECT setval('categories_category_id_seq', (SELECT COALESCE(MAX(category_id), 1) FROM categories));
SELECT setval('attributes_attribute_id_seq', (SELECT COALESCE(MAX(attribute_id), 1) FROM attributes));
SELECT setval('posts_post_id_seq', (SELECT COALESCE(MAX(post_id), 1) FROM posts));
SELECT setval('media_assets_asset_id_seq', (SELECT COALESCE(MAX(asset_id), 1) FROM media_assets));
SELECT setval('post_attribute_values_value_id_seq', (SELECT COALESCE(MAX(value_id), 1) FROM post_attribute_values));
-- Job sequences removed (consolidated into tickets)
SELECT setval('ledgers_ledger_id_seq', (SELECT COALESCE(MAX(ledger_id), 1) FROM ledgers));
SELECT setval('transactions_transaction_id_seq', (SELECT COALESCE(MAX(transaction_id), 1) FROM transactions));
SELECT setval('placement_slots_placement_slot_id_seq', (SELECT COALESCE(MAX(placement_slot_id), 1) FROM placement_slots));
SELECT setval('promotion_packages_promotion_package_id_seq', (SELECT COALESCE(MAX(promotion_package_id), 1) FROM promotion_packages));
SELECT setval('promotion_package_prices_price_id_seq',          (SELECT COALESCE(MAX(price_id),              1) FROM promotion_package_prices));
SELECT setval('user_posting_plans_posting_plan_id_seq',          (SELECT COALESCE(MAX(posting_plan_id),       1) FROM user_posting_plans));
SELECT setval('banned_keywords_banned_keyword_id_seq', (SELECT COALESCE(MAX(banned_keyword_id), 1) FROM banned_keywords));
SELECT setval('system_settings_system_setting_id_seq', (SELECT COALESCE(MAX(system_setting_id), 1) FROM system_settings));
SELECT setval('admin_templates_template_id_seq', (SELECT COALESCE(MAX(template_id), 1) FROM admin_templates));
SELECT setval('post_promotions_post_promotion_id_seq', (SELECT COALESCE(MAX(post_promotion_id), 1) FROM post_promotions));
SELECT setval('event_logs_event_log_id_seq', (SELECT COALESCE(MAX(event_log_id), 1) FROM event_logs));
SELECT setval('daily_placement_metrics_daily_placement_metric_id_seq', (SELECT COALESCE(MAX(daily_placement_metric_id), 1) FROM daily_placement_metrics));
SELECT setval('trend_scores_trend_score_id_seq', (SELECT COALESCE(MAX(trend_score_id), 1) FROM trend_scores));
SELECT setval('ai_insights_ai_insight_id_seq', (SELECT COALESCE(MAX(ai_insight_id), 1) FROM ai_insights));


-- ============================================================
-- FINAL TRIGGER SETUP
-- Chỉ khởi tạo Trigger SAU KHI đã nạp xong Seed Data
-- Tránh Trigger chạy đè khi đang INSERT dữ liệu mẫu gây lỗi PKEY
-- ============================================================

-- Timestamps Triggers
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();
CREATE TRIGGER update_business_roles_updated_at BEFORE UPDATE ON business_roles FOR EACH ROW EXECUTE FUNCTION update_business_role_updated_at();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_category_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_user_updated_at();
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION update_shop_updated_at();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_post_updated_at();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_system_setting_updated_at();

-- Audit Triggers (Polymorphic Event Logs)
CREATE TRIGGER trg_audit_promotion_packages
    AFTER INSERT OR UPDATE ON promotion_packages
    FOR EACH ROW EXECUTE FUNCTION log_promotion_package_changes();

CREATE TRIGGER trg_audit_promotion_prices
    AFTER INSERT OR UPDATE ON promotion_package_prices
    FOR EACH ROW EXECUTE FUNCTION log_promotion_price_changes();

-- Sync Triggers
CREATE TRIGGER trg_sync_shop_to_user_email
    AFTER UPDATE OF shop_email ON shops
    FOR EACH ROW
    EXECUTE FUNCTION sync_shop_to_user_email();

