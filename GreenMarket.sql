-- ============================================================
-- GreenMarket Database Backup (Full Schema)
-- PostgreSQL 18.x | Generated: 2026-03-20
-- Tables: 31 | Synced from Drizzle ORM schema
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
    user_location VARCHAR(255),
    user_bio TEXT,
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

-- OTP Requests
CREATE TABLE otp_requests (
    otp_request_id SERIAL PRIMARY KEY,
    otp_request_mobile VARCHAR(15),
    otp_request_otp_code VARCHAR(20),
    otp_request_expire_at TIMESTAMP,
    otp_request_status VARCHAR(20),
    otp_request_created_at TIMESTAMP DEFAULT now()
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
    shop_id SERIAL PRIMARY KEY,
    shop_owner_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE UNIQUE,
    shop_name VARCHAR(150) NOT NULL,
    shop_phone VARCHAR(20),
    shop_location VARCHAR(255),
    shop_description TEXT,
    shop_status VARCHAR(20) DEFAULT 'pending',
    shop_lat DECIMAL(10, 8),
    shop_lng DECIMAL(11, 8),
    shop_created_at TIMESTAMP DEFAULT now(),
    shop_updated_at TIMESTAMP DEFAULT now()
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
    promotion_package_id SERIAL PRIMARY KEY,
    promotion_package_slot_id INTEGER NOT NULL REFERENCES placement_slots(placement_slot_id) ON DELETE CASCADE,
    promotion_package_title VARCHAR(150),
    promotion_package_duration_days INTEGER,
    promotion_package_price DECIMAL(15, 2),
    promotion_package_published BOOLEAN DEFAULT FALSE,
    promotion_package_created_at TIMESTAMP DEFAULT now()
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
    payment_txn_id SERIAL PRIMARY KEY,
    payment_txn_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    payment_txn_package_id INTEGER NOT NULL REFERENCES promotion_packages(promotion_package_id) ON DELETE CASCADE,
    payment_txn_amount DECIMAL(15, 2),
    payment_txn_provider VARCHAR(50),
    payment_txn_provider_txn_id VARCHAR(100) UNIQUE,
    payment_txn_status VARCHAR(20),
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

-- Payments
CREATE INDEX idx_payment_txn_user ON payment_txn(payment_txn_user_id);
CREATE INDEX idx_payment_txn_status ON payment_txn(payment_txn_status);

-- Analytics
CREATE INDEX idx_daily_metrics_date ON daily_placement_metrics(daily_placement_metric_date);
CREATE INDEX idx_daily_metrics_slot ON daily_placement_metrics(daily_placement_metric_slot_id);

-- Event Logs
CREATE INDEX idx_event_logs_user ON event_logs(event_log_user_id);
CREATE INDEX idx_event_logs_type ON event_logs(event_log_event_type);
CREATE INDEX idx_event_logs_time ON event_logs(event_log_event_time);

-- OTP
CREATE INDEX idx_otp_requests_mobile_code ON otp_requests(otp_request_mobile, otp_request_otp_code);

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
INSERT INTO users (user_id, user_mobile, user_display_name, user_status) VALUES
(1, '0978195419', 'Nguyễn Thành Nam', 'active'),
(2, '0982703398', 'Trần Văn Bonsai', 'active'),
(3, '0123456789', 'Lê Hoài Nam (Nghệ Nhân)', 'active'),
(4, '0912345678', 'Vườn Kiểng Bến Tre', 'active'),
(5, '0966778899', 'Người Mua Cây Cảnh', 'active');

-- Shops
INSERT INTO shops (shop_id, shop_owner_id, shop_name, shop_phone, shop_location, shop_description, shop_status) VALUES
(1, 1, 'Vườn Bonsai Phố Huyện', '0978195419', 'Yên Phong, Bắc Ninh', 'Chuyên các dòng Bonsai mini và tầm trung.', 'active'),
(2, 3, 'Nam Định Art Garden', '0123456789', 'Nam Trực, Nam Định', 'Nghệ nhân cây cảnh cổ truyền Nam Điền.', 'active'),
(3, 4, 'Thế Giới Cây Kiểng Miền Tây', '0912345678', 'Chợ Lách, Bến Tre', 'Chuyên cung cấp Linh Sam, Mai Chiếu Thủy số lượng lớn.', 'active');

-- Categories (Tree)
INSERT INTO categories (category_id, category_parent_id, category_title, category_slug, category_published) VALUES
(1, NULL, 'Bonsai', 'bonsai', true),
(2, NULL, 'Cây Công Trình', 'cay-cong-trinh', true),
(3, NULL, 'Dụng Cụ & Vật Tư', 'dung-cu-vat-tu', true),
(4, NULL, 'Chậu & Phụ Kiện', 'chau-phu-kien', true),
(11, 1, 'Bonsai Mini (Mame/Shito)', 'bonsai-mini', true),
(12, 1, 'Bonsai Tầm Trung', 'bonsai-tam-trung', true),
(13, 1, 'Bonsai Đại (San vườn)', 'bonsai-dai', true),
(31, 3, 'Kéo Tỉa & Kìm Cạp', 'keo-tia-kim-cap', true),
(32, 3, 'Đất Nhật (Akadama)', 'dat-nhat-akadama', true);

-- Attributes
INSERT INTO attributes (attribute_id, attribute_code, attribute_title, attribute_data_type, attribute_options, attribute_published) VALUES
(1, 'dang_cay', 'Dáng Thế', 'enum', '["Dáng Trực", "Dáng Xiên", "Dáng Hoành", "Dáng Huyền", "Dáng Văn Nhân", "Dáng Thác Đổ"]', true),
(2, 'chieu_cao', 'Chiều cao (cm)', 'number', NULL, true),
(3, 'hoanh_goc', 'Hoành gốc (cm)', 'number', NULL, true),
(4, 'tuoi_cay', 'Tuổi cây (năm)', 'number', NULL, true),
(5, 'nguon_goc', 'Nguồn gốc', 'text', NULL, true);

-- Category-Attribute Mapping
INSERT INTO category_attributes (category_attribute_category_id, category_attribute_attribute_id, category_attribute_required) VALUES
(1, 1, true), (1, 2, true), (1, 3, true), (1, 4, false), (1, 5, false),
(11, 1, true), (11, 2, true), (12, 1, true), (12, 3, true);

-- Posts
INSERT INTO posts (post_id, post_author_id, post_shop_id, category_id, post_title, post_slug, post_content, post_price, post_location, post_status, post_contact_phone) VALUES
(1, 1, 1, 11, 'Sanh Nam Điền Mini Dáng Văn Nhân', 'sanh-nam-dien-mini-123', 'Cây Sanh Nam Điền già, u nần, cốt cách thanh thoát.', 2500000, 'Bắc Ninh', 'approved', '0978195419'),
(2, 3, 2, 12, 'Tùng La Hán Dáng Trực Cổ Thụ', 'tung-la-han-truc-456', 'Siêu phẩm Tùng La Hán cốt cách Nam Định, tay cành hoàn thiện.', 150000000, 'Nam Định', 'approved', '0123456789'),
(3, 4, 3, 12, 'Linh Sam Sông Hinh Lũa Thép', 'linh-sam-lua-thep-789', 'Cây Linh Sam lũa tự nhiên cực đẹp, hoa tím thơm.', 8500000, 'Bến Tre', 'approved', '0912345678'),
(4, 3, 2, 13, 'Sanh Quê Dáng Làng Đại Thụ', 'sanh-que-dang-lang-101', 'Cây sanh quê bóng mát rộng 3m, thích hợp sân vườn lớn.', 45000000, 'Nam Định', 'approved', '0123456789'),
(5, 1, 1, 31, 'Kìm Cạp Xéo Thép Đen Nhật Bản', 'kim-cap-nhat-202', 'Dụng cụ chuyên dụng cho nghệ nhân bonsai.', 1200000, 'Bắc Ninh', 'approved', '0978195419'),
(6, 4, 3, 11, 'Mai Chiếu Thủy Nu Gò Công Mini', 'mct-nu-mini-303', 'Cây mini bỏ túi, nu mặt quỷ cực già.', 3500000, 'Bến Tre', 'approved', '0912345678'),
(7, 2, NULL, 12, 'Thông Đen Nhật Bản Thành Thẩm', 'thong-den-nhat-ban-404', 'Cây thông đen nuôi 10 năm từ hạt, dáng trực quân tử.', 25000000, 'Hà Nội', 'approved', '0982703398');

-- Post Attribute Values
INSERT INTO post_attribute_values (post_id, attribute_id, attribute_value) VALUES
(1, 1, 'Dáng Văn Nhân'), (1, 2, '25'), (1, 3, '15'),
(2, 1, 'Dáng Trực'), (2, 2, '180'), (2, 3, '85'), (2, 5, 'Nam Định'),
(3, 1, 'Dáng Thác Đổ'), (3, 2, '45'), (3, 3, '28'), (3, 5, 'Phú Yên'),
(6, 1, 'Dáng Hoành'), (6, 2, '15'), (6, 3, '22'),
(7, 1, 'Dáng Trực'), (7, 5, 'Nhập khẩu Nhật Bản');

-- Post Images (Placeholder URLs)
INSERT INTO post_images (post_id, image_url, image_sort_order) VALUES
(1, 'https://example.com/images/sanh-mini-1.jpg', 0),
(1, 'https://example.com/images/sanh-mini-2.jpg', 1),
(2, 'https://example.com/images/tung-la-han.jpg', 0),
(3, 'https://example.com/images/linh-sam.jpg', 0),
(7, 'https://example.com/images/thong-den.jpg', 0);

-- OTP Requests (Sample)
INSERT INTO otp_requests (otp_request_mobile, otp_request_otp_code, otp_request_expire_at, otp_request_status) VALUES
('0978195419', '123456', now() + interval '10 minutes', 'verified'),
('0982703398', '654321', now() + interval '10 minutes', 'pending');

-- ============================================================
-- RESET SEQUENCES
-- ============================================================
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
