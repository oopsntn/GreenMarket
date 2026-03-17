-- GreenMarket PostgreSQL Schema
-- Snake_case naming convention

-- Drop tables if exists (in reverse order of dependencies)
DROP TABLE IF EXISTS event_logs CASCADE;
DROP TABLE IF EXISTS ai_insights CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS trend_scores CASCADE;
DROP TABLE IF EXISTS daily_placement_metrics CASCADE;
DROP TABLE IF EXISTS payment_txn CASCADE;
DROP TABLE IF EXISTS post_promotions CASCADE;
DROP TABLE IF EXISTS promotion_packages CASCADE;
DROP TABLE IF EXISTS placement_slots CASCADE;
DROP TABLE IF EXISTS moderation_actions CASCADE;
DROP TABLE IF EXISTS report_evidence CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS category_attributes CASCADE;
DROP TABLE IF EXISTS blocked_shops CASCADE;
DROP TABLE IF EXISTS favorite_posts CASCADE;
DROP TABLE IF EXISTS post_attributes CASCADE;
DROP TABLE IF EXISTS post_categories CASCADE;
DROP TABLE IF EXISTS post_meta CASCADE;
DROP TABLE IF EXISTS post_images CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS banned_keywords CASCADE;
DROP TABLE IF EXISTS otp_requests CASCADE;
DROP TABLE IF EXISTS admin_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS attributes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create tables

CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  user_mobile VARCHAR(15),
  user_display_name VARCHAR(80),
  user_avatar_url VARCHAR(255),
  user_status VARCHAR(20),
  user_registered_at TIMESTAMP,
  user_last_login_at TIMESTAMP,
  user_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
  admin_id SERIAL PRIMARY KEY,
  admin_email VARCHAR(150) UNIQUE NOT NULL,
  admin_username VARCHAR(50) UNIQUE,
  admin_password_hash VARCHAR(255) NOT NULL,
  admin_full_name VARCHAR(100),
  admin_avatar_url VARCHAR(255),
  admin_status VARCHAR(20),
  admin_last_login_at TIMESTAMP,
  admin_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  admin_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  role_code VARCHAR(50),
  role_title VARCHAR(100),
  role_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_roles (
  admin_role_admin_id INT NOT NULL,
  admin_role_role_id INT NOT NULL,
  PRIMARY KEY (admin_role_admin_id, admin_role_role_id),
  FOREIGN KEY (admin_role_admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE,
  FOREIGN KEY (admin_role_role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

CREATE TABLE otp_requests (
  otp_request_id SERIAL PRIMARY KEY,
  otp_request_mobile VARCHAR(15),
  otp_request_otp_code VARCHAR(10),
  otp_request_expire_at TIMESTAMP,
  otp_request_status VARCHAR(20),
  otp_request_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE banned_keywords (
  banned_keyword_id SERIAL PRIMARY KEY,
  banned_keyword_keyword VARCHAR(50),
  banned_keyword_published BOOLEAN DEFAULT FALSE,
  banned_keyword_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shops (
  shop_id SERIAL PRIMARY KEY,
  shop_owner_id INT NOT NULL,
  shop_name VARCHAR(150),
  shop_phone VARCHAR(20),
  shop_location VARCHAR(255),
  shop_description TEXT,
  shop_status VARCHAR(20),
  shop_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  shop_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_owner_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE categories (
  category_id SERIAL PRIMARY KEY,
  category_parent_id INT,
  category_title VARCHAR(150),
  category_slug VARCHAR(150),
  category_published BOOLEAN DEFAULT FALSE,
  category_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  category_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_parent_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

CREATE TABLE attributes (
  attribute_id SERIAL PRIMARY KEY,
  attribute_code VARCHAR(100),
  attribute_title VARCHAR(150),
  attribute_data_type VARCHAR(50),
  attribute_options JSONB,
  attribute_published BOOLEAN DEFAULT FALSE,
  attribute_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  post_id SERIAL PRIMARY KEY,
  post_author_id INT NOT NULL,
  post_shop_id INT,
  post_title VARCHAR(200),
  post_content TEXT,
  post_price DECIMAL(15, 2),
  post_location VARCHAR(255),
  post_status VARCHAR(20),
  post_rejected_reason TEXT,
  post_contact_phone VARCHAR(20),
  post_published BOOLEAN DEFAULT FALSE,
  post_submitted_at TIMESTAMP,
  post_published_at TIMESTAMP,
  post_deleted_at TIMESTAMP,
  post_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  post_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_author_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (post_shop_id) REFERENCES shops(shop_id) ON DELETE SET NULL
);

CREATE TABLE post_images (
  post_image_id SERIAL PRIMARY KEY,
  post_image_post_id INT NOT NULL,
  post_image_url VARCHAR(255),
  post_image_position INT,
  post_image_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_image_post_id) REFERENCES posts(post_id) ON DELETE CASCADE
);

CREATE TABLE post_meta (
  post_meta_id SERIAL PRIMARY KEY,
  post_meta_post_id INT NOT NULL,
  post_meta_key VARCHAR(100),
  post_meta_content TEXT,
  post_meta_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_meta_post_id) REFERENCES posts(post_id) ON DELETE CASCADE
);

CREATE TABLE post_categories (
  post_category_post_id INT NOT NULL,
  post_category_category_id INT NOT NULL,
  PRIMARY KEY (post_category_post_id, post_category_category_id),
  FOREIGN KEY (post_category_post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
  FOREIGN KEY (post_category_category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

CREATE TABLE post_attributes (
  post_attribute_id SERIAL PRIMARY KEY,
  post_attribute_post_id INT NOT NULL,
  post_attribute_attribute_id INT NOT NULL,
  post_attribute_value_text TEXT,
  post_attribute_value_number DECIMAL(15, 4),
  post_attribute_value_enum VARCHAR(100),
  post_attribute_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_attribute_post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
  FOREIGN KEY (post_attribute_attribute_id) REFERENCES attributes(attribute_id) ON DELETE CASCADE
);

CREATE TABLE favorite_posts (
  favorite_post_user_id INT NOT NULL,
  favorite_post_post_id INT NOT NULL,
  favorite_post_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (favorite_post_user_id, favorite_post_post_id),
  FOREIGN KEY (favorite_post_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (favorite_post_post_id) REFERENCES posts(post_id) ON DELETE CASCADE
);

CREATE TABLE blocked_shops (
  blocked_shop_user_id INT NOT NULL,
  blocked_shop_shop_id INT NOT NULL,
  blocked_shop_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (blocked_shop_user_id, blocked_shop_shop_id),
  FOREIGN KEY (blocked_shop_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_shop_shop_id) REFERENCES shops(shop_id) ON DELETE CASCADE
);

CREATE TABLE category_attributes (
  category_attribute_category_id INT NOT NULL,
  category_attribute_attribute_id INT NOT NULL,
  category_attribute_required BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (category_attribute_category_id, category_attribute_attribute_id),
  FOREIGN KEY (category_attribute_category_id) REFERENCES categories(category_id) ON DELETE CASCADE,
  FOREIGN KEY (category_attribute_attribute_id) REFERENCES attributes(attribute_id) ON DELETE CASCADE
);

CREATE TABLE reports (
  report_id SERIAL PRIMARY KEY,
  report_reporter_id INT NOT NULL,
  report_post_id INT,
  report_shop_id INT,
  report_reason_code VARCHAR(50),
  report_note TEXT,
  report_status VARCHAR(20),
  report_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  report_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_reporter_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (report_post_id) REFERENCES posts(post_id) ON DELETE SET NULL,
  FOREIGN KEY (report_shop_id) REFERENCES shops(shop_id) ON DELETE SET NULL
);

CREATE TABLE report_evidence (
  report_evidence_id SERIAL PRIMARY KEY,
  report_evidence_report_id INT NOT NULL,
  report_evidence_url VARCHAR(255),
  report_evidence_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_evidence_report_id) REFERENCES reports(report_id) ON DELETE CASCADE
);

CREATE TABLE moderation_actions (
  moderation_action_id SERIAL PRIMARY KEY,
  moderation_action_action_by INT NOT NULL,
  moderation_action_post_id INT,
  moderation_action_action VARCHAR(50),
  moderation_action_note TEXT,
  moderation_action_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (moderation_action_action_by) REFERENCES admins(admin_id) ON DELETE CASCADE,
  FOREIGN KEY (moderation_action_post_id) REFERENCES posts(post_id) ON DELETE SET NULL
);

CREATE TABLE placement_slots (
  placement_slot_id SERIAL PRIMARY KEY,
  placement_slot_code VARCHAR(100),
  placement_slot_title VARCHAR(150),
  placement_slot_capacity INT,
  placement_slot_rules JSONB,
  placement_slot_published BOOLEAN DEFAULT FALSE,
  placement_slot_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE promotion_packages (
  promotion_package_id SERIAL PRIMARY KEY,
  promotion_package_slot_id INT NOT NULL,
  promotion_package_title VARCHAR(150),
  promotion_package_duration_days INT,
  promotion_package_price DECIMAL(15, 2),
  promotion_package_published BOOLEAN DEFAULT FALSE,
  promotion_package_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (promotion_package_slot_id) REFERENCES placement_slots(placement_slot_id) ON DELETE CASCADE
);

CREATE TABLE post_promotions (
  post_promotion_id SERIAL PRIMARY KEY,
  post_promotion_post_id INT NOT NULL,
  post_promotion_buyer_id INT NOT NULL,
  post_promotion_package_id INT NOT NULL,
  post_promotion_slot_id INT NOT NULL,
  post_promotion_start_at TIMESTAMP,
  post_promotion_end_at TIMESTAMP,
  post_promotion_status VARCHAR(20),
  post_promotion_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_promotion_post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
  FOREIGN KEY (post_promotion_package_id) REFERENCES promotion_packages(promotion_package_id) ON DELETE CASCADE,
  FOREIGN KEY (post_promotion_slot_id) REFERENCES placement_slots(placement_slot_id) ON DELETE CASCADE
);

CREATE TABLE payment_txn (
  payment_txn_id SERIAL PRIMARY KEY,
  payment_txn_user_id INT NOT NULL,
  payment_txn_package_id INT NOT NULL,
  payment_txn_amount DECIMAL(15, 2),
  payment_txn_provider VARCHAR(50),
  payment_txn_provider_txn_id VARCHAR(100) UNIQUE,
  payment_txn_status VARCHAR(20),
  payment_txn_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_txn_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (payment_txn_package_id) REFERENCES promotion_packages(promotion_package_id) ON DELETE CASCADE
);

CREATE TABLE daily_placement_metrics (
  daily_placement_metric_id SERIAL PRIMARY KEY,
  daily_placement_metric_date DATE,
  daily_placement_metric_slot_id INT NOT NULL,
  daily_placement_metric_category_id INT,
  daily_placement_metric_impressions INT DEFAULT 0,
  daily_placement_metric_clicks INT DEFAULT 0,
  daily_placement_metric_detail_views INT DEFAULT 0,
  daily_placement_metric_contacts INT DEFAULT 0,
  daily_placement_metric_ctr DECIMAL(5, 4),
  daily_placement_metric_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (daily_placement_metric_slot_id) REFERENCES placement_slots(placement_slot_id) ON DELETE CASCADE,
  FOREIGN KEY (daily_placement_metric_category_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

CREATE TABLE trend_scores (
  trend_score_id SERIAL PRIMARY KEY,
  trend_score_as_of_date DATE,
  trend_score_slot_id INT NOT NULL,
  trend_score_score DECIMAL(10, 4),
  trend_score_components JSONB,
  trend_score_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trend_score_slot_id) REFERENCES placement_slots(placement_slot_id) ON DELETE CASCADE
);

CREATE TABLE ai_insights (
  ai_insight_id SERIAL PRIMARY KEY,
  ai_insight_requested_by INT NOT NULL,
  ai_insight_scope VARCHAR(50),
  ai_insight_input_snapshot JSONB,
  ai_insight_output_text TEXT,
  ai_insight_provider VARCHAR(50),
  ai_insight_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_insight_requested_by) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE system_settings (
  system_setting_id SERIAL PRIMARY KEY,
  system_setting_key VARCHAR(100) UNIQUE,
  system_setting_value TEXT,
  system_setting_updated_by INT,
  system_setting_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (system_setting_updated_by) REFERENCES admins(admin_id) ON DELETE SET NULL
);

CREATE TABLE event_logs (
  event_log_id SERIAL PRIMARY KEY,
  event_log_user_id INT,
  event_log_post_id INT,
  event_log_shop_id INT,
  event_log_slot_id INT,
  event_log_category_id INT,
  event_log_event_type VARCHAR(50),
  event_log_event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  event_log_meta JSONB,
  FOREIGN KEY (event_log_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Create indexes for better performance

CREATE INDEX idx_users_mobile ON users(user_mobile);
CREATE INDEX idx_otp_requests_mobile_code ON otp_requests(otp_request_mobile, otp_request_otp_code);
CREATE INDEX idx_users_status ON users(user_status);

CREATE INDEX idx_admins_email ON admins(admin_email);
CREATE INDEX idx_admins_username ON admins(admin_username);
CREATE INDEX idx_admins_status ON admins(admin_status);

CREATE INDEX idx_shops_owner ON shops(shop_owner_id);
CREATE INDEX idx_shops_status ON shops(shop_status);

CREATE INDEX idx_posts_author ON posts(post_author_id);
CREATE INDEX idx_posts_shop ON posts(post_shop_id);
CREATE INDEX idx_posts_status ON posts(post_status);
CREATE INDEX idx_posts_published ON posts(post_published);
CREATE INDEX idx_posts_created ON posts(post_created_at);

CREATE INDEX idx_post_images_post ON post_images(post_image_post_id);

CREATE INDEX idx_post_meta_post ON post_meta(post_meta_post_id);
CREATE INDEX idx_post_meta_key ON post_meta(post_meta_key);

CREATE INDEX idx_post_categories_post ON post_categories(post_category_post_id);
CREATE INDEX idx_post_categories_category ON post_categories(post_category_category_id);

CREATE INDEX idx_post_attributes_post ON post_attributes(post_attribute_post_id);
CREATE INDEX idx_post_attributes_attribute ON post_attributes(post_attribute_attribute_id);

CREATE INDEX idx_favorite_posts_user ON favorite_posts(favorite_post_user_id);
CREATE INDEX idx_favorite_posts_post ON favorite_posts(favorite_post_post_id);

CREATE INDEX idx_categories_parent ON categories(category_parent_id);
CREATE INDEX idx_categories_slug ON categories(category_slug);

CREATE INDEX idx_reports_reporter ON reports(report_reporter_id);
CREATE INDEX idx_reports_post ON reports(report_post_id);
CREATE INDEX idx_reports_shop ON reports(report_shop_id);
CREATE INDEX idx_reports_status ON reports(report_status);

CREATE INDEX idx_post_promotions_post ON post_promotions(post_promotion_post_id);
CREATE INDEX idx_post_promotions_slot ON post_promotions(post_promotion_slot_id);
CREATE INDEX idx_post_promotions_status ON post_promotions(post_promotion_status);
CREATE INDEX idx_post_promotions_dates ON post_promotions(post_promotion_start_at, post_promotion_end_at);

CREATE INDEX idx_payment_txn_user ON payment_txn(payment_txn_user_id);
CREATE INDEX idx_payment_txn_status ON payment_txn(payment_txn_status);

CREATE INDEX idx_daily_metrics_date ON daily_placement_metrics(daily_placement_metric_date);
CREATE INDEX idx_daily_metrics_slot ON daily_placement_metrics(daily_placement_metric_slot_id);

CREATE INDEX idx_event_logs_user ON event_logs(event_log_user_id);
CREATE INDEX idx_event_logs_type ON event_logs(event_log_event_type);
CREATE INDEX idx_event_logs_time ON event_logs(event_log_event_time);

-- Create trigger functions for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_user_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.user_updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_admin_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.admin_updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_shop_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.shop_updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_post_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.post_updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_category_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.category_updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_report_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.report_updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_system_setting_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.system_setting_updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$ language 'plpgsql';

-- Create triggers for tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_user_updated_at();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION update_shop_updated_at();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_post_updated_at();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_category_updated_at();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_report_updated_at();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_system_setting_updated_at();

-- Add comments for documentation
COMMENT ON TABLE users IS 'Customer accounts and authentication';
COMMENT ON TABLE admins IS 'Internal staff and admin accounts';
COMMENT ON TABLE admin_roles IS 'Mapping of administrators to roles';
COMMENT ON TABLE shops IS 'Shop/seller information';
COMMENT ON TABLE posts IS 'Product listings and advertisements';
COMMENT ON TABLE categories IS 'Hierarchical product categories';
COMMENT ON TABLE attributes IS 'Dynamic product attributes';
COMMENT ON TABLE reports IS 'User reports for content moderation';
COMMENT ON TABLE placement_slots IS 'Advertisement placement zones';
COMMENT ON TABLE promotion_packages IS 'Paid promotion offerings';
COMMENT ON TABLE post_promotions IS 'Active post promotions';
COMMENT ON TABLE payment_txn IS 'Payment transactions';
COMMENT ON TABLE daily_placement_metrics IS 'Daily performance metrics';
COMMENT ON TABLE ai_insights IS 'AI-generated insights and recommendations';
COMMENT ON TABLE event_logs IS 'User activity and system events';