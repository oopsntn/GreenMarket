-- ============================================================
-- GreenMarket Database Backup (Full Schema)
-- PostgreSQL 18.x | Generated: 2026-04-01
-- Tables: 31 | Synced from Drizzle ORM schema
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

-- Users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    user_mobile VARCHAR(15) NOT NULL UNIQUE,
    user_display_name VARCHAR(80),
    user_avatar_url VARCHAR(255),
    user_email VARCHAR(255),
    user_status VARCHAR(20) DEFAULT 'active',
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
    admin_avatar_url VARCHAR(255),
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
    shop_logo_url VARCHAR(255),
    shop_cover_url VARCHAR(255),
    shop_status VARCHAR(20) DEFAULT 'pending',
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
    post_content TEXT,
    post_price NUMERIC(12,2),
    post_location VARCHAR(255),
    post_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    post_rejected_reason TEXT,
    post_contact_phone VARCHAR(20),
    post_view_count INTEGER DEFAULT 0,
    post_contact_count INTEGER DEFAULT 0,
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
    image_url VARCHAR(500) NOT NULL,
    image_sort_order INTEGER DEFAULT 0,
    image_created_at TIMESTAMP DEFAULT now()
);

-- Post Videos
CREATE TABLE post_videos (
    post_video_id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    video_url VARCHAR(255) NOT NULL,
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
    report_evidence_url VARCHAR(255),
    report_evidence_created_at TIMESTAMP DEFAULT now()
);

-- Moderation Actions
CREATE TABLE moderation_actions (
    moderation_action_id SERIAL PRIMARY KEY,
    moderation_action_action_by INTEGER NOT NULL REFERENCES admins(admin_id) ON DELETE CASCADE,
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
    promotion_package_price DECIMAL(15, 2),
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

-- ============================================================
-- INDEXES
-- ============================================================

-- Posts
CREATE INDEX post_search_idx ON posts USING gin (to_tsvector('simple', post_title || ' ' || COALESCE(post_content, '')));
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

-- Admins
CREATE INDEX idx_admins_email ON admins(admin_email);
CREATE INDEX idx_admins_username ON admins(admin_username);
CREATE INDEX idx_admins_status ON admins(admin_status);

-- Shops
CREATE INDEX idx_shops_owner ON shops(shop_owner_id);
CREATE INDEX idx_shops_status ON shops(shop_status);

-- Categories
CREATE INDEX idx_categories_parent ON categories(category_parent_id);
CREATE INDEX idx_categories_slug ON categories(category_slug);

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

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();
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
(1, 'ROLE_ADMIN', 'Super Administrator'),
(2, 'ROLE_MODERATOR', 'Content Moderator');

-- Admins (Password hash cho '123456' - demo only)
INSERT INTO admins (admin_id, admin_email, admin_username, admin_password_hash, admin_full_name, admin_status) VALUES
(1, 'admin@greenmarket.com', 'admin', '$2b$10$wE0vD8A5q0oR9.wR1mD3AeS6A0s6yD0R1D.R.R.R.R.R.R.R', 'Hệ Thống Admin', 'active'),
(2, 'mod@greenmarket.com', 'moderator', '$2b$10$wE0vD8A5q0oR9.wR1mD3AeS6A0s6yD0R1D.R.R.R.R.R.R.R', 'Kiểm Duyệt Viên', 'active');

-- Mapping Admin-Roles
INSERT INTO admin_roles (admin_role_admin_id, admin_role_role_id) VALUES
(1, 1),
(2, 2);

-- Users
INSERT INTO users (user_id, user_mobile, user_display_name, user_email, user_status) VALUES
(1, '0978195419', 'Nguyễn Thành Nam', 'nam.nguyen@gmail.com', 'active'),
(2, '0982703398', 'Trần Văn Bonsai', 'bonsai.tran@gmail.com', 'active'),
(3, '0123456789', 'Lê Hoài Nam', 'hoainam.le@gmail.com', 'active'),
(4, '0912345678', 'Trần Thị Kiểng', 'kieng.tran@gmail.com', 'active'),
(5, '0966778899', 'Phạm Quốc Huy', 'huy.pham@gmail.com', 'active'),
(6, '0935112233', 'Đặng Minh Tuấn', 'tuan.dang@gmail.com', 'active'),
(7, '0901223344', 'Võ Thị Lan', 'lan.vo@gmail.com', 'active');

-- Shops
INSERT INTO shops (shop_id, shop_name, shop_phone, shop_location, shop_description, shop_cover_url, shop_status, shop_lat, shop_lng) VALUES
(1, 'Vườn Bonsai Phố Huyện', '0978195419', 'Yên Phong, Bắc Ninh',
    'Chuyên bonsai mini và tầm trung. Nhận thiết kế, chăm sóc và phối thế bonsai theo yêu cầu. Ship toàn quốc qua Viettel Post.',
    'http://localhost:5000/uploads/shop/vuon-bonsai-pho-huyen-1.jpg|http://localhost:5000/uploads/shop/vuon-bonsai-pho-huyen-2.jpg', 'active', 21.1863, 106.0734),
(3, 'Nam Định Art Garden', '0123456789', 'Nam Trực, Nam Định',
    'Nghệ nhân cây cảnh cổ truyền Nam Điền. Chuyên sanh, si, tùng la hán cốt cách truyền thống. Hơn 20 năm kinh nghiệm.',
    'http://localhost:5000/uploads/shop/nam-dinh-art-garden.jpg', 'active', 20.2506, 106.2355),
(4, 'Thế Giới Cây Kiểng Miền Tây', '0912345678', 'Chợ Lách, Bến Tre',
    'Chuyên cung cấp Linh Sam, Mai Chiếu Thủy, bonsai hoa quả số lượng lớn. Bao ship đồng bằng sông Cửu Long.',
    'http://localhost:5000/uploads/shop/cay-kieng-mien-tay.jpg', 'active', 10.2350, 106.1511),
(6, 'Dụng Cụ Bonsai Pro', '0935112233', 'Đông Anh, Hà Nội',
    'Nhập khẩu và phân phối dụng cụ bonsai chính hãng Nhật Bản: kéo Kaneshin, kìm Masakuni, đất Akadama, chậu Tokoname.',
    'http://localhost:5000/uploads/shop/dung-cu-bonsai-pro.jpg', 'active', 21.1395, 105.8544);

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
INSERT INTO category_attributes (category_attribute_category_id, category_attribute_attribute_id, category_attribute_required) VALUES
-- Cây Cảnh Bonsai (gốc) → kế thừa cho tất cả sub
(1,  1, true),  (1,  2, true),  (1,  3, false), (1,  4, false), (1,  5, false),
-- Bonsai Mini
(11, 1, true),  (11, 2, true),  (11, 3, true),
-- Bonsai Tầm Trung
(12, 1, true),  (12, 2, true),  (12, 3, true),  (12, 4, false),
-- Bonsai Đại
(13, 1, true),  (13, 2, true),  (13, 3, true),  (13, 4, true),  (13, 5, false),
-- Bonsai Phong Thủy
(14, 1, true),  (14, 2, true),
-- Bonsai Hoa & Quả
(15, 1, true),  (15, 2, true),  (15, 5, false),
-- Dụng Cụ Làm Vườn (gốc)
(2,  6, true),  (2,  7, false), (2,  8, false),
-- Kéo Tỉa & Kìm Cạp
(21, 6, true),  (21, 7, true),  (21, 8, true),
-- Đất & Giá Thể
(22, 7, false), (22, 8, true),
-- Chậu & Khay Bonsai
(23, 6, true),  (23, 7, false), (23, 8, true),
-- Dây Buộc & Phụ Kiện Uốn
(24, 6, true),  (24, 8, false),
-- Bình Tưới & Phun Sương
(25, 6, true),  (25, 7, false), (25, 8, false);

-- ============================================================
-- POSTS (15 bài đăng: 9 bonsai + 6 dụng cụ)
-- ============================================================
INSERT INTO posts (post_id, post_author_id, post_shop_id, category_id, post_title, post_slug, post_content, post_price, post_location, post_status, post_contact_phone, post_view_count, post_contact_count, post_published, post_submitted_at, post_published_at) VALUES
-- === CÂY CẢNH BONSAI ===
(1,  1, 1, 11, 'Sanh Nam Điền Mini Dáng Văn Nhân',
    'sanh-nam-dien-mini-dang-van-nhan',
    'Cây Sanh Nam Điền già, u nần, cốt cách thanh thoát. Lá đã thu nhỏ hoàn thiện. Phôi gốc 15 năm, tạo tác 5 năm. Phù hợp để bàn làm việc hoặc bàn trà.',
    2500000, 'Yên Phong, Bắc Ninh', 'approved', '0978195419', 234, 12, true, now() - interval '30 days', now() - interval '29 days'),

(2,  3, 2, 12, 'Tùng La Hán Dáng Trực Cổ Thụ',
    'tung-la-han-dang-truc-co-thu',
    'Siêu phẩm Tùng La Hán cốt cách Nam Định, tay cành hoàn thiện 4 tầng tán. Gốc hoành 85cm, thân xù xì cổ kính. Đã đạt giải nhì triển lãm SVC 2025.',
    150000000, 'Nam Trực, Nam Định', 'approved', '0123456789', 1520, 45, true, now() - interval '25 days', now() - interval '24 days'),

(3,  4, 3, 12, 'Linh Sam Sông Hinh Lũa Thép',
    'linh-sam-song-hinh-lua-thep',
    'Cây Linh Sam lũa tự nhiên cực đẹp, hoa tím thơm quanh năm. Gốc từ Sông Hinh, Phú Yên. Lũa trắng, thân cứng như thép. Nuôi chậu 8 năm, tán đã ổn định.',
    8500000, 'Chợ Lách, Bến Tre', 'approved', '0912345678', 876, 28, true, now() - interval '20 days', now() - interval '19 days'),

(4,  3, 2, 13, 'Sanh Quê Dáng Làng Đại Thụ',
    'sanh-que-dang-lang-dai-thu',
    'Cây sanh quê bóng mát rộng 3m, thích hợp sân vườn biệt thự hoặc quán cà phê. Phôi 30 năm, dáng cây làng quê Bắc Bộ. Giao cây tận nơi bằng xe tải.',
    45000000, 'Nam Trực, Nam Định', 'approved', '0123456789', 432, 15, true, now() - interval '18 days', now() - interval '17 days'),

(5,  4, 3, 11, 'Mai Chiếu Thủy Nu Gò Công Mini',
    'mai-chieu-thuy-nu-go-cong-mini',
    'Cây MCT mini bỏ túi, nu mặt quỷ cực già, gốc từ Gò Công, Tiền Giang. Hoa trắng thơm ngát. Kích thước 15cm, phù hợp bàn làm việc.',
    3500000, 'Chợ Lách, Bến Tre', 'approved', '0912345678', 567, 19, true, now() - interval '15 days', now() - interval '14 days'),

(6,  2, NULL, 12, 'Thông Đen Nhật Bản Thành Thẩm',
    'thong-den-nhat-ban-thanh-tham',
    'Cây thông đen (Pinus thunbergii) nuôi 10 năm từ hạt nhập khẩu Nhật. Dáng trực quân tử, vỏ nứt đẹp. Lá kim dày, khỏe. Chậu Tokoname men nâu đi kèm.',
    25000000, 'Hoàng Mai, Hà Nội', 'approved', '0982703398', 345, 8, true, now() - interval '12 days', now() - interval '11 days'),

(7,  1, 1, 14, 'Si Bonsai Phong Thủy Tài Lộc',
    'si-bonsai-phong-thuy-tai-loc',
    'Cây Si bonsai dáng trực, rễ khí buông dày tượng trưng mưa thuận gió hòa, tài lộc. Phù hợp đặt phòng khách, quầy thu ngân. Kèm chậu sứ Bát Tràng.',
    4200000, 'Yên Phong, Bắc Ninh', 'approved', '0978195419', 189, 7, true, now() - interval '10 days', now() - interval '9 days'),

(8,  4, 3, 15, 'Mai Vàng Bonsai Nghệ Thuật',
    'mai-vang-bonsai-nghe-thuat',
    'Mai vàng 5 cánh Bến Tre, phôi 12 năm, dáng hoành ấn tượng. Nở hoa vàng rực mỗi dịp Tết. Đã xử lý cho ra hoa đúng mùa. Giao hàng cẩn thận, bảo hành sống.',
    12000000, 'Chợ Lách, Bến Tre', 'approved', '0912345678', 723, 31, true, now() - interval '8 days', now() - interval '7 days'),

(9,  3, 2, 11, 'Tùng Bách Tán Lùn Nhật Mini',
    'tung-bach-tan-lun-nhat-mini',
    'Tùng Bách Tán lùn (Pinus parviflora) nhập giống Nhật. Lá ngắn xanh bạc, dáng xiên gió thổi. Chậu men xanh ngọc Tokoname. Kích thước 20cm, rất dễ chăm.',
    6800000, 'Nam Trực, Nam Định', 'approved', '0123456789', 298, 11, true, now() - interval '5 days', now() - interval '4 days'),

-- === DỤNG CỤ LÀM VƯỜN ===
(10, 1, 1, 21, 'Kìm Cạp Xéo Thép Đen Nhật Bản Kaneshin',
    'kim-cap-xeo-thep-den-kaneshin',
    'Kìm cạp xéo (concave cutter) Kaneshin No.3, thép carbon rèn thủ công. Cắt sát gốc, vết cắt liền sẹo nhanh. Kèm bao da bảo quản. Hàng auth có tem.',
    1200000, 'Đông Anh, Hà Nội', 'approved', '0935112233', 156, 22, true, now() - interval '28 days', now() - interval '27 days'),

(11, 6, 4, 21, 'Bộ Kéo Tỉa Bonsai Cao Cấp 5 Món',
    'bo-keo-tia-bonsai-cao-cap-5-mon',
    'Bộ 5 dụng cụ bonsai chuyên nghiệp: kéo lá, kéo cành, kìm cạp lõm, kìm bấm dây, cào rễ. Thép không gỉ, tay cầm cao su chống trượt. Hộp gỗ sang trọng.',
    2850000, 'Đông Anh, Hà Nội', 'approved', '0935112233', 412, 35, true, now() - interval '22 days', now() - interval '21 days'),

(12, 6, 4, 22, 'Đất Akadama Nhật Bản Túi 14L',
    'dat-akadama-nhat-ban-14l',
    'Đất Akadama hạt trung (medium grain) nhập khẩu trực tiếp từ Ibaraki, Nhật Bản. Thoát nước tuyệt vời, giữ ẩm vừa phải. Chuyên dùng cho bonsai cao cấp. Còn hàng 50+ túi.',
    320000, 'Đông Anh, Hà Nội', 'approved', '0935112233', 534, 48, true, now() - interval '26 days', now() - interval '25 days'),

(13, 6, 4, 23, 'Chậu Tokoname Men Xanh Ngọc Nhật Bản',
    'chau-tokoname-men-xanh-ngoc',
    'Chậu bonsai Tokoname chính hãng, men xanh ngọc bích. Kích thước 30x22x8cm, hình chữ nhật bo góc. Lỗ thoát nước đáy. Phù hợp bonsai tầm trung dáng hoành.',
    850000, 'Đông Anh, Hà Nội', 'approved', '0935112233', 267, 16, true, now() - interval '16 days', now() - interval '15 days'),

(14, 6, 4, 24, 'Bộ Dây Nhôm Uốn Cành 6 Size',
    'bo-day-nhom-uon-canh-6-size',
    'Bộ 6 cuộn dây nhôm anodized chuyên uốn bonsai: 1mm, 1.5mm, 2mm, 2.5mm, 3mm, 4mm. Mỗi cuộn 100g. Màu nâu đồng, mềm dẻo, không gỉ, không gây thương cành.',
    280000, 'Đông Anh, Hà Nội', 'approved', '0935112233', 189, 27, true, now() - interval '14 days', now() - interval '13 days'),

(15, 1, 1, 25, 'Bình Phun Sương Đồng Thau Kiểu Nhật',
    'binh-phun-suong-dong-thau-kieu-nhat',
    'Bình phun sương đồng thau 300ml, thiết kế kiểu Nhật truyền thống. Phun sương mịn đều, không đọng giọt. Dùng tưới lá bonsai, rêu, cỏ phủ chậu. Tặng kèm đầu phun thay thế.',
    450000, 'Yên Phong, Bắc Ninh', 'approved', '0978195419', 123, 9, true, now() - interval '7 days', now() - interval '6 days');

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
(1,  'http://localhost:5000/uploads/sanh-nam-dien-mini-1.jpg', 0),
(1,  'http://localhost:5000/uploads/sanh-nam-dien-mini-2.jpg', 1),
(1,  'http://localhost:5000/uploads/sanh-nam-dien-mini-3.jpg', 2),
(2,  'http://localhost:5000/uploads/tung-la-han-1.jpg', 0),
(2,  'http://localhost:5000/uploads/tung-la-han-2.jpg', 1),
(3,  'http://localhost:5000/uploads/linh-sam-1.jpg', 0),
(3,  'http://localhost:5000/uploads/linh-sam-2.jpg', 1),
(4,  'http://localhost:5000/uploads/sanh-que-dai-1.jpg', 0),
(5,  'http://localhost:5000/uploads/mct-mini-1.jpg', 0),
(5,  'http://localhost:5000/uploads/mct-mini-2.jpg', 1),
(6,  'http://localhost:5000/uploads/thong-den-1.jpg', 0),
(7,  'http://localhost:5000/uploads/si-phong-thuy-1.jpg', 0),
(8,  'http://localhost:5000/uploads/mai-vang-1.jpg', 0),
(8,  'http://localhost:5000/uploads/mai-vang-2.jpg', 1),
(9,  'http://localhost:5000/uploads/tung-bach-tan-1.jpg', 0),
(10, 'http://localhost:5000/uploads/kim-cap-kaneshin-1.jpg', 0),
(11, 'http://localhost:5000/uploads/bo-keo-5-mon-1.jpg', 0),
(11, 'http://localhost:5000/uploads/bo-keo-5-mon-2.jpg', 1),
(12, 'http://localhost:5000/uploads/dat-akadama-1.jpg', 0),
(13, 'http://localhost:5000/uploads/chau-tokoname-1.jpg', 0),
(13, 'http://localhost:5000/uploads/chau-tokoname-2.jpg', 1),
(14, 'http://localhost:5000/uploads/day-nhom-uon-1.jpg', 0),
(15, 'http://localhost:5000/uploads/binh-phun-suong-1.jpg', 0);

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
(1, 'HOMEPAGE_BANNER',  'Banner Trang Chủ',          5,  '{"max_per_shop": 1, "min_post_status": "approved"}', true),
(2, 'CATEGORY_TOP',     'Đầu Trang Danh Mục',        10, '{"max_per_shop": 2, "min_post_status": "approved"}', true),
(3, 'SEARCH_HIGHLIGHT', 'Nổi Bật Trong Tìm Kiếm',    20, '{"max_per_shop": 3, "min_post_status": "approved"}', true);

INSERT INTO promotion_packages (
    promotion_package_id,
    promotion_package_slot_id,
    promotion_package_title,
    promotion_package_duration_days,
    promotion_package_price,
    promotion_package_max_posts,
    promotion_package_display_quota,
    promotion_package_description,
    promotion_package_published
) VALUES
(1, 1, 'Banner Trang Chủ - 7 ngày',   7,  180000, 1, 50000,  'Ưu tiên hiển thị trên trang chủ trong 7 ngày.', true),
(2, 1, 'Banner Trang Chủ - 30 ngày',  30, 500000, 3, 200000, 'Ưu tiên hiển thị trên trang chủ trong 30 ngày.', true),
(3, 2, 'Đầu Danh Mục - 7 ngày',       7,  95000,  1, 30000,  'Nổi bật ở đầu danh mục trong 7 ngày.', true),
(4, 2, 'Đầu Danh Mục - 30 ngày',      30, 250000, 3, 120000, 'Nổi bật ở đầu danh mục trong 30 ngày.', true),
(5, 3, 'Nổi Bật Tìm Kiếm - 7 ngày',   7,  50000,  1, 15000,  'Ưu tiên hiển thị trong kết quả tìm kiếm trong 7 ngày.', true),
(6, 3, 'Nổi Bật Tìm Kiếm - 30 ngày',  30, 150000, 3, 70000,  'Ưu tiên hiển thị trong kết quả tìm kiếm trong 30 ngày.', true);

-- Promotion Package Prices (giá khởi tạo + ví dụ lên lịch tăng giá tương lai)
INSERT INTO promotion_package_prices (package_id, price, effective_from, effective_to, note, created_by) VALUES
-- Gói 1: Banner 7 ngày — giá gốc, sau đó tăng (effective_to đóng lại), rồi lên lịch giá mới
(1, 150000, now() - interval '90 days', now() - interval '10 days', 'Giá khởi tạo ban đầu',          1),
(1, 180000, now() - interval '10 days', NULL,                         'Điều chỉnh giá tháng 3/2026',   1),
-- Gói 2: Banner 30 ngày — giá ổn định
(2, 500000, now() - interval '90 days', NULL,                         'Giá khởi tạo ban đầu',          1),
-- Gói 3: Đầu Danh Mục 7 ngày — hiện tại + lên lịch tăng giá từ 15/4/2026
(3, 80000,  now() - interval '90 days', '2026-04-15 00:00:00',        'Giá khởi tạo ban đầu',          1),
(3, 95000,  '2026-04-15 00:00:00',     NULL,                          'Lên lịch tăng giá từ 15/4',     1),
-- Gói 4: Đầu Danh Mục 30 ngày
(4, 250000, now() - interval '90 days', NULL,                         'Giá khởi tạo ban đầu',          1),
-- Gói 5: Nổi Bật Tìm Kiếm 7 ngày
(5, 50000,  now() - interval '90 days', NULL,                         'Giá khởi tạo ban đầu',          1),
-- Gói 6: Nổi Bật Tìm Kiếm 30 ngày
(6, 150000, now() - interval '90 days', NULL,                         'Giá khởi tạo ban đầu',          1);

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
('contact_phone', '1900-xxxx', 1);

-- OTP Requests (Sample)
INSERT INTO otp_requests (otp_request_mobile, otp_request_otp_code, otp_request_expire_at, otp_request_status) VALUES
('0978195419', '123456', now() + interval '10 minutes', 'verified'),
('0982703398', '654321', now() + interval '10 minutes', 'pending');

-- ============================================================
-- RESET SEQUENCES
-- ============================================================
INSERT INTO reports (report_id, reporter_id, post_id, report_shop_id, report_reason_code, report_reason, report_note, report_status, admin_note, report_created_at, report_updated_at) VALUES
(1, 5, 1, 1, 'MISLEADING_INFO', 'Post title and product details are not consistent with the attached listing photos.', 'The seller describes a different bonsai shape in the text than in the gallery.', 'pending', NULL, '2026-03-29 09:15:00', '2026-03-29 09:15:00'),
(2, 5, 2, 2, 'SPAM_PROMOTION', 'The post content repeats promotional text and external contact instructions too aggressively.', 'Please review whether this listing should stay visible or be rewritten.', 'resolved', 'Seller was instructed to remove repeated off-platform promotion text before republishing.', '2026-03-28 15:42:00', '2026-03-29 10:05:00'),
(3, 5, 6, 3, 'SUSPICIOUS_PRICING', 'The listed price looks abnormal compared with similar ornamental plant posts in the same category.', 'Potential bait pricing. Needs manual moderation follow-up.', 'dismissed', 'Pricing was verified with the shop and no policy breach was found.', '2026-03-27 11:20:00', '2026-03-28 08:40:00');

SELECT setval('users_user_id_seq', (SELECT COALESCE(MAX(user_id), 1) FROM users));
SELECT setval('admins_admin_id_seq', (SELECT COALESCE(MAX(admin_id), 1) FROM admins));
SELECT setval('roles_role_id_seq', (SELECT COALESCE(MAX(role_id), 1) FROM roles));
SELECT setval('otp_requests_otp_request_id_seq', (SELECT COALESCE(MAX(otp_request_id), 1) FROM otp_requests));
SELECT setval('categories_category_id_seq', (SELECT COALESCE(MAX(category_id), 1) FROM categories));
SELECT setval('attributes_attribute_id_seq', (SELECT COALESCE(MAX(attribute_id), 1) FROM attributes));
SELECT setval('shops_shop_id_seq', (SELECT COALESCE(MAX(shop_id), 1) FROM shops));
SELECT setval('posts_post_id_seq', (SELECT COALESCE(MAX(post_id), 1) FROM posts));
SELECT setval('post_images_image_id_seq', (SELECT COALESCE(MAX(image_id), 1) FROM post_images));
SELECT setval('post_videos_post_video_id_seq', (SELECT COALESCE(MAX(post_video_id), 1) FROM post_videos));
SELECT setval('post_attribute_values_value_id_seq', (SELECT COALESCE(MAX(value_id), 1) FROM post_attribute_values));
SELECT setval('reports_report_id_seq', (SELECT COALESCE(MAX(report_id), 1) FROM reports), false);
SELECT setval('placement_slots_placement_slot_id_seq', (SELECT COALESCE(MAX(placement_slot_id), 1) FROM placement_slots));
SELECT setval('promotion_packages_promotion_package_id_seq', (SELECT COALESCE(MAX(promotion_package_id), 1) FROM promotion_packages));
SELECT setval('promotion_package_prices_price_id_seq',          (SELECT COALESCE(MAX(price_id),              1) FROM promotion_package_prices));
SELECT setval('promotion_package_audit_log_audit_id_seq',        (SELECT COALESCE(MAX(audit_id),              1) FROM promotion_package_audit_log));
SELECT setval('banned_keywords_banned_keyword_id_seq', (SELECT COALESCE(MAX(banned_keyword_id), 1) FROM banned_keywords));
SELECT setval('system_settings_system_setting_id_seq', (SELECT COALESCE(MAX(system_setting_id), 1) FROM system_settings));
