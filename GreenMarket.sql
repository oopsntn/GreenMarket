-- GreenMarket PostgreSQL Schema
-- Generated from DBML with renamed columns

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
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS attributes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create tables

CREATE TABLE users (
  userId SERIAL PRIMARY KEY,
  userMobile VARCHAR(15),
  userDisplayName VARCHAR(80),
  userAvatarUrl VARCHAR(255),
  userStatus VARCHAR(20),
  userRegisteredAt TIMESTAMP,
  userLastLoginAt TIMESTAMP,
  userCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  userUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
  roleId SERIAL PRIMARY KEY,
  roleCode VARCHAR(50),
  roleTitle VARCHAR(100),
  roleCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
  userRoleUserId INT NOT NULL,
  userRoleRoleId INT NOT NULL,
  PRIMARY KEY (userRoleUserId, userRoleRoleId),
  FOREIGN KEY (userRoleUserId) REFERENCES users(userId) ON DELETE CASCADE,
  FOREIGN KEY (userRoleRoleId) REFERENCES roles(roleId) ON DELETE CASCADE
);

CREATE TABLE otp_requests (
  otpRequestId SERIAL PRIMARY KEY,
  otpRequestMobile VARCHAR(15),
  otpRequestOtpCode VARCHAR(10),
  otpRequestExpireAt TIMESTAMP,
  otpRequestStatus VARCHAR(20),
  otpRequestCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE banned_keywords (
  bannedKeywordId SERIAL PRIMARY KEY,
  bannedKeywordKeyword VARCHAR(50),
  bannedKeywordPublished BOOLEAN DEFAULT FALSE,
  bannedKeywordCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shops (
  shopId SERIAL PRIMARY KEY,
  shopOwnerId INT NOT NULL,
  shopName VARCHAR(150),
  shopPhone VARCHAR(20),
  shopLocation VARCHAR(255),
  shopDescription TEXT,
  shopStatus VARCHAR(20),
  shopCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  shopUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shopOwnerId) REFERENCES users(userId) ON DELETE CASCADE
);

CREATE TABLE categories (
  categoryId SERIAL PRIMARY KEY,
  categoryParentId INT,
  categoryTitle VARCHAR(150),
  categorySlug VARCHAR(150),
  categoryPublished BOOLEAN DEFAULT FALSE,
  categoryCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  categoryUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryParentId) REFERENCES categories(categoryId) ON DELETE SET NULL
);

CREATE TABLE attributes (
  attributeId SERIAL PRIMARY KEY,
  attributeCode VARCHAR(100),
  attributeTitle VARCHAR(150),
  attributeDataType VARCHAR(50),
  attributeOptions JSON,
  attributePublished BOOLEAN DEFAULT FALSE,
  attributeCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  postId SERIAL PRIMARY KEY,
  postAuthorId INT NOT NULL,
  postShopId INT,
  postTitle VARCHAR(200),
  postContent TEXT,
  postPrice DECIMAL(15, 2),
  postLocation VARCHAR(255),
  postStatus VARCHAR(20),
  postRejectedReason TEXT,
  postPublished BOOLEAN DEFAULT FALSE,
  postSubmittedAt TIMESTAMP,
  postPublishedAt TIMESTAMP,
  postDeletedAt TIMESTAMP,
  postCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  postUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (postAuthorId) REFERENCES users(userId) ON DELETE CASCADE,
  FOREIGN KEY (postShopId) REFERENCES shops(shopId) ON DELETE SET NULL
);

CREATE TABLE post_images (
  postImageId SERIAL PRIMARY KEY,
  postImagePostId INT NOT NULL,
  postImageUrl VARCHAR(255),
  postImagePosition INT,
  postImageCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (postImagePostId) REFERENCES posts(postId) ON DELETE CASCADE
);

CREATE TABLE post_meta (
  postMetaId SERIAL PRIMARY KEY,
  postMetaPostId INT NOT NULL,
  postMetaKey VARCHAR(100),
  postMetaContent TEXT,
  postMetaCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (postMetaPostId) REFERENCES posts(postId) ON DELETE CASCADE
);

CREATE TABLE post_categories (
  postCategoryPostId INT NOT NULL,
  postCategoryCategoryId INT NOT NULL,
  PRIMARY KEY (postCategoryPostId, postCategoryCategoryId),
  FOREIGN KEY (postCategoryPostId) REFERENCES posts(postId) ON DELETE CASCADE,
  FOREIGN KEY (postCategoryCategoryId) REFERENCES categories(categoryId) ON DELETE CASCADE
);

CREATE TABLE post_attributes (
  postAttributeId SERIAL PRIMARY KEY,
  postAttributePostId INT NOT NULL,
  postAttributeAttributeId INT NOT NULL,
  postAttributeValueText TEXT,
  postAttributeValueNumber DECIMAL(15, 4),
  postAttributeValueEnum VARCHAR(100),
  postAttributeCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (postAttributePostId) REFERENCES posts(postId) ON DELETE CASCADE,
  FOREIGN KEY (postAttributeAttributeId) REFERENCES attributes(attributeId) ON DELETE CASCADE
);

CREATE TABLE favorite_posts (
  favoritePostUserId INT NOT NULL,
  favoritePostPostId INT NOT NULL,
  favoritePostCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (favoritePostUserId, favoritePostPostId),
  FOREIGN KEY (favoritePostUserId) REFERENCES users(userId) ON DELETE CASCADE,
  FOREIGN KEY (favoritePostPostId) REFERENCES posts(postId) ON DELETE CASCADE
);

CREATE TABLE blocked_shops (
  blockedShopUserId INT NOT NULL,
  blockedShopShopId INT NOT NULL,
  blockedShopCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (blockedShopUserId, blockedShopShopId),
  FOREIGN KEY (blockedShopUserId) REFERENCES users(userId) ON DELETE CASCADE,
  FOREIGN KEY (blockedShopShopId) REFERENCES shops(shopId) ON DELETE CASCADE
);

CREATE TABLE category_attributes (
  categoryAttributeCategoryId INT NOT NULL,
  categoryAttributeAttributeId INT NOT NULL,
  categoryAttributeRequired BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (categoryAttributeCategoryId, categoryAttributeAttributeId),
  FOREIGN KEY (categoryAttributeCategoryId) REFERENCES categories(categoryId) ON DELETE CASCADE,
  FOREIGN KEY (categoryAttributeAttributeId) REFERENCES attributes(attributeId) ON DELETE CASCADE
);

CREATE TABLE reports (
  reportId SERIAL PRIMARY KEY,
  reportReporterId INT NOT NULL,
  reportPostId INT,
  reportShopId INT,
  reportReasonCode VARCHAR(50),
  reportNote TEXT,
  reportStatus VARCHAR(20),
  reportCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reportUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reportReporterId) REFERENCES users(userId) ON DELETE CASCADE,
  FOREIGN KEY (reportPostId) REFERENCES posts(postId) ON DELETE SET NULL,
  FOREIGN KEY (reportShopId) REFERENCES shops(shopId) ON DELETE SET NULL
);

CREATE TABLE report_evidence (
  reportEvidenceId SERIAL PRIMARY KEY,
  reportEvidenceReportId INT NOT NULL,
  reportEvidenceUrl VARCHAR(255),
  reportEvidenceCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reportEvidenceReportId) REFERENCES reports(reportId) ON DELETE CASCADE
);

CREATE TABLE moderation_actions (
  moderationActionId SERIAL PRIMARY KEY,
  moderationActionActionBy INT NOT NULL,
  moderationActionPostId INT,
  moderationActionAction VARCHAR(50),
  moderationActionNote TEXT,
  moderationActionCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (moderationActionPostId) REFERENCES posts(postId) ON DELETE SET NULL
);

CREATE TABLE placement_slots (
  placementSlotId SERIAL PRIMARY KEY,
  placementSlotCode VARCHAR(100),
  placementSlotTitle VARCHAR(150),
  placementSlotCapacity INT,
  placementSlotRules JSON,
  placementSlotPublished BOOLEAN DEFAULT FALSE,
  placementSlotCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE promotion_packages (
  promotionPackageId SERIAL PRIMARY KEY,
  promotionPackageSlotId INT NOT NULL,
  promotionPackageTitle VARCHAR(150),
  promotionPackageDurationDays INT,
  promotionPackagePrice DECIMAL(15, 2),
  promotionPackagePublished BOOLEAN DEFAULT FALSE,
  promotionPackageCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (promotionPackageSlotId) REFERENCES placement_slots(placementSlotId) ON DELETE CASCADE
);

CREATE TABLE post_promotions (
  postPromotionId SERIAL PRIMARY KEY,
  postPromotionPostId INT NOT NULL,
  postPromotionBuyerId INT NOT NULL,
  postPromotionPackageId INT NOT NULL,
  postPromotionSlotId INT NOT NULL,
  postPromotionStartAt TIMESTAMP,
  postPromotionEndAt TIMESTAMP,
  postPromotionStatus VARCHAR(20),
  postPromotionCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (postPromotionPostId) REFERENCES posts(postId) ON DELETE CASCADE,
  FOREIGN KEY (postPromotionPackageId) REFERENCES promotion_packages(promotionPackageId) ON DELETE CASCADE,
  FOREIGN KEY (postPromotionSlotId) REFERENCES placement_slots(placementSlotId) ON DELETE CASCADE
);

CREATE TABLE payment_txn (
  paymentTxnId SERIAL PRIMARY KEY,
  paymentTxnUserId INT NOT NULL,
  paymentTxnPackageId INT NOT NULL,
  paymentTxnAmount DECIMAL(15, 2),
  paymentTxnProvider VARCHAR(50),
  paymentTxnProviderTxnId VARCHAR(100),
  paymentTxnStatus VARCHAR(20),
  paymentTxnCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paymentTxnUserId) REFERENCES users(userId) ON DELETE CASCADE,
  FOREIGN KEY (paymentTxnPackageId) REFERENCES promotion_packages(promotionPackageId) ON DELETE CASCADE
);

CREATE TABLE daily_placement_metrics (
  dailyPlacementMetricId SERIAL PRIMARY KEY,
  dailyPlacementMetricDate DATE,
  dailyPlacementMetricSlotId INT NOT NULL,
  dailyPlacementMetricCategoryId INT,
  dailyPlacementMetricImpressions INT DEFAULT 0,
  dailyPlacementMetricClicks INT DEFAULT 0,
  dailyPlacementMetricDetailViews INT DEFAULT 0,
  dailyPlacementMetricContacts INT DEFAULT 0,
  dailyPlacementMetricCtr DECIMAL(5, 4),
  dailyPlacementMetricCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dailyPlacementMetricSlotId) REFERENCES placement_slots(placementSlotId) ON DELETE CASCADE,
  FOREIGN KEY (dailyPlacementMetricCategoryId) REFERENCES categories(categoryId) ON DELETE SET NULL
);

CREATE TABLE trend_scores (
  trendScoreId SERIAL PRIMARY KEY,
  trendScoreAsOfDate DATE,
  trendScoreSlotId INT NOT NULL,
  trendScoreScore DECIMAL(10, 4),
  trendScoreComponents JSON,
  trendScoreCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trendScoreSlotId) REFERENCES placement_slots(placementSlotId) ON DELETE CASCADE
);

CREATE TABLE ai_insights (
  aiInsightId SERIAL PRIMARY KEY,
  aiInsightRequestedBy INT NOT NULL,
  aiInsightScope VARCHAR(50),
  aiInsightInputSnapshot JSON,
  aiInsightOutputText TEXT,
  aiInsightProvider VARCHAR(50),
  aiInsightCreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aiInsightRequestedBy) REFERENCES users(userId) ON DELETE CASCADE
);

CREATE TABLE system_settings (
  systemSettingId SERIAL PRIMARY KEY,
  systemSettingKey VARCHAR(100) UNIQUE,
  systemSettingValue TEXT,
  systemSettingUpdatedBy INT,
  systemSettingUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_logs (
  eventLogId SERIAL PRIMARY KEY,
  eventLogUserId INT,
  eventLogPostId INT,
  eventLogShopId INT,
  eventLogSlotId INT,
  eventLogCategoryId INT,
  eventLogEventType VARCHAR(50),
  eventLogEventTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eventLogMeta JSON,
  FOREIGN KEY (eventLogUserId) REFERENCES users(userId) ON DELETE SET NULL
);

-- Create indexes for better performance

CREATE INDEX idx_users_mobile ON users(userMobile);
CREATE INDEX idx_users_status ON users(userStatus);

CREATE INDEX idx_shops_owner ON shops(shopOwnerId);
CREATE INDEX idx_shops_status ON shops(shopStatus);

CREATE INDEX idx_posts_author ON posts(postAuthorId);
CREATE INDEX idx_posts_shop ON posts(postShopId);
CREATE INDEX idx_posts_status ON posts(postStatus);
CREATE INDEX idx_posts_published ON posts(postPublished);
CREATE INDEX idx_posts_created ON posts(postCreatedAt);

CREATE INDEX idx_post_images_post ON post_images(postImagePostId);

CREATE INDEX idx_post_meta_post ON post_meta(postMetaPostId);
CREATE INDEX idx_post_meta_key ON post_meta(postMetaKey);

CREATE INDEX idx_post_categories_post ON post_categories(postCategoryPostId);
CREATE INDEX idx_post_categories_category ON post_categories(postCategoryCategoryId);

CREATE INDEX idx_post_attributes_post ON post_attributes(postAttributePostId);
CREATE INDEX idx_post_attributes_attribute ON post_attributes(postAttributeAttributeId);

CREATE INDEX idx_favorite_posts_user ON favorite_posts(favoritePostUserId);
CREATE INDEX idx_favorite_posts_post ON favorite_posts(favoritePostPostId);

CREATE INDEX idx_categories_parent ON categories(categoryParentId);
CREATE INDEX idx_categories_slug ON categories(categorySlug);

CREATE INDEX idx_reports_reporter ON reports(reportReporterId);
CREATE INDEX idx_reports_post ON reports(reportPostId);
CREATE INDEX idx_reports_shop ON reports(reportShopId);
CREATE INDEX idx_reports_status ON reports(reportStatus);

CREATE INDEX idx_post_promotions_post ON post_promotions(postPromotionPostId);
CREATE INDEX idx_post_promotions_slot ON post_promotions(postPromotionSlotId);
CREATE INDEX idx_post_promotions_status ON post_promotions(postPromotionStatus);
CREATE INDEX idx_post_promotions_dates ON post_promotions(postPromotionStartAt, postPromotionEndAt);

CREATE INDEX idx_payment_txn_user ON payment_txn(paymentTxnUserId);
CREATE INDEX idx_payment_txn_status ON payment_txn(paymentTxnStatus);

CREATE INDEX idx_daily_metrics_date ON daily_placement_metrics(dailyPlacementMetricDate);
CREATE INDEX idx_daily_metrics_slot ON daily_placement_metrics(dailyPlacementMetricSlotId);

CREATE INDEX idx_event_logs_user ON event_logs(eventLogUserId);
CREATE INDEX idx_event_logs_type ON event_logs(eventLogEventType);
CREATE INDEX idx_event_logs_time ON event_logs(eventLogEventTime);

-- Create trigger function for updating updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.userUpdatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables with updatedAt column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts and authentication';
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