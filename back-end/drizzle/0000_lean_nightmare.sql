CREATE TABLE "admin_roles" (
	"admin_role_admin_id" integer NOT NULL,
	"admin_role_role_id" integer NOT NULL,
	CONSTRAINT "admin_roles_admin_role_admin_id_admin_role_role_id_pk" PRIMARY KEY("admin_role_admin_id","admin_role_role_id")
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"admin_id" serial PRIMARY KEY NOT NULL,
	"admin_email" varchar(150) NOT NULL,
	"admin_username" varchar(50),
	"admin_password_hash" varchar(255) NOT NULL,
	"admin_full_name" varchar(100),
	"admin_avatar_url" varchar(255),
	"admin_status" varchar(20),
	"admin_last_login_at" timestamp,
	"admin_created_at" timestamp DEFAULT now(),
	"admin_updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admins_admin_email_unique" UNIQUE("admin_email"),
	CONSTRAINT "admins_admin_username_unique" UNIQUE("admin_username")
);
--> statement-breakpoint
CREATE TABLE "ai_insights" (
	"ai_insight_id" serial PRIMARY KEY NOT NULL,
	"ai_insight_requested_by" integer NOT NULL,
	"ai_insight_scope" varchar(50),
	"ai_insight_input_snapshot" jsonb,
	"ai_insight_output_text" text,
	"ai_insight_provider" varchar(50),
	"ai_insight_created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attributes" (
	"attribute_id" serial PRIMARY KEY NOT NULL,
	"attribute_code" varchar(100),
	"attribute_title" varchar(150),
	"attribute_data_type" varchar(50),
	"attribute_options" jsonb,
	"attribute_published" boolean DEFAULT false,
	"attribute_created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "banned_keywords" (
	"banned_keyword_id" serial PRIMARY KEY NOT NULL,
	"banned_keyword_keyword" varchar(50),
	"banned_keyword_published" boolean DEFAULT false,
	"banned_keyword_created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blocked_shops" (
	"blocked_shop_user_id" integer NOT NULL,
	"blocked_shop_shop_id" integer NOT NULL,
	"blocked_shop_created_at" timestamp DEFAULT now(),
	CONSTRAINT "blocked_shops_blocked_shop_user_id_blocked_shop_shop_id_pk" PRIMARY KEY("blocked_shop_user_id","blocked_shop_shop_id")
);
--> statement-breakpoint
CREATE TABLE "business_roles" (
	"business_role_id" serial PRIMARY KEY NOT NULL,
	"business_role_code" varchar(50) NOT NULL,
	"business_role_title" varchar(100) NOT NULL,
	"business_role_audience_group" varchar(50),
	"business_role_access_scope" varchar(100),
	"business_role_summary" text,
	"business_role_responsibilities" jsonb DEFAULT '[]'::jsonb,
	"business_role_capabilities" jsonb DEFAULT '[]'::jsonb,
	"business_role_status" varchar(20) DEFAULT 'active' NOT NULL,
	"business_role_created_at" timestamp DEFAULT now(),
	"business_role_updated_at" timestamp DEFAULT now(),
	CONSTRAINT "business_roles_business_role_code_unique" UNIQUE("business_role_code")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"category_id" serial PRIMARY KEY NOT NULL,
	"category_parent_id" integer,
	"category_title" varchar(150),
	"category_slug" varchar(150),
	"category_published" boolean DEFAULT false,
	"category_created_at" timestamp DEFAULT now(),
	"category_updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "category_attributes" (
	"category_attribute_category_id" integer NOT NULL,
	"category_attribute_attribute_id" integer NOT NULL,
	"category_attribute_required" boolean DEFAULT false,
	CONSTRAINT "category_attributes_category_attribute_category_id_category_attribute_attribute_id_pk" PRIMARY KEY("category_attribute_category_id","category_attribute_attribute_id")
);
--> statement-breakpoint
CREATE TABLE "daily_placement_metrics" (
	"daily_placement_metric_id" serial PRIMARY KEY NOT NULL,
	"daily_placement_metric_date" date,
	"daily_placement_metric_slot_id" integer NOT NULL,
	"daily_placement_metric_category_id" integer,
	"daily_placement_metric_impressions" integer DEFAULT 0,
	"daily_placement_metric_clicks" integer DEFAULT 0,
	"daily_placement_metric_detail_views" integer DEFAULT 0,
	"daily_placement_metric_contacts" integer DEFAULT 0,
	"daily_placement_metric_ctr" numeric(5, 4),
	"daily_placement_metric_created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_logs" (
	"event_log_id" serial PRIMARY KEY NOT NULL,
	"event_log_user_id" integer,
	"event_log_post_id" integer,
	"event_log_shop_id" integer,
	"event_log_slot_id" integer,
	"event_log_category_id" integer,
	"event_log_event_type" varchar(50),
	"event_log_event_time" timestamp DEFAULT now(),
	"event_log_meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "favorite_posts" (
	"favorite_post_user_id" integer NOT NULL,
	"favorite_post_post_id" integer NOT NULL,
	"favorite_post_created_at" timestamp DEFAULT now(),
	CONSTRAINT "favorite_posts_favorite_post_user_id_favorite_post_post_id_pk" PRIMARY KEY("favorite_post_user_id","favorite_post_post_id")
);
--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"moderation_action_id" serial PRIMARY KEY NOT NULL,
	"moderation_action_action_by" integer NOT NULL,
	"moderation_action_post_id" integer,
	"moderation_action_action" varchar(50),
	"moderation_action_note" text,
	"moderation_action_created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_txn" (
	"payment_txn_id" serial PRIMARY KEY NOT NULL,
	"payment_txn_user_id" integer NOT NULL,
	"payment_txn_package_id" integer NOT NULL,
	"payment_txn_post_id" integer,
	"payment_txn_price_id" integer,
	"payment_txn_amount" numeric(15, 2),
	"payment_txn_provider" varchar(50),
	"payment_txn_provider_txn_id" varchar(100),
	"payment_txn_status" varchar(20),
	"payment_txn_created_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_txn_payment_txn_provider_txn_id_unique" UNIQUE("payment_txn_provider_txn_id")
);
--> statement-breakpoint
CREATE TABLE "placement_slots" (
	"placement_slot_id" serial PRIMARY KEY NOT NULL,
	"placement_slot_code" varchar(100),
	"placement_slot_title" varchar(150),
	"placement_slot_capacity" integer,
	"placement_slot_rules" jsonb,
	"placement_slot_published" boolean DEFAULT false,
	"placement_slot_created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "post_attribute_values" (
	"value_id" serial PRIMARY KEY NOT NULL,
	"post_id" integer,
	"attribute_id" integer,
	"attribute_value" text NOT NULL,
	"value_created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "post_categories" (
	"post_category_post_id" integer NOT NULL,
	"post_category_category_id" integer NOT NULL,
	CONSTRAINT "post_categories_post_category_post_id_post_category_category_id_pk" PRIMARY KEY("post_category_post_id","post_category_category_id")
);
--> statement-breakpoint
CREATE TABLE "post_images" (
	"image_id" serial PRIMARY KEY NOT NULL,
	"post_id" integer,
	"image_url" varchar(500) NOT NULL,
	"image_sort_order" integer DEFAULT 0,
	"image_created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "post_meta" (
	"post_meta_id" serial PRIMARY KEY NOT NULL,
	"post_meta_post_id" integer NOT NULL,
	"post_meta_key" varchar(100),
	"post_meta_content" text,
	"post_meta_created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "post_promotions" (
	"post_promotion_id" serial PRIMARY KEY NOT NULL,
	"post_promotion_post_id" integer NOT NULL,
	"post_promotion_buyer_id" integer NOT NULL,
	"post_promotion_package_id" integer NOT NULL,
	"post_promotion_slot_id" integer NOT NULL,
	"post_promotion_start_at" timestamp,
	"post_promotion_end_at" timestamp,
	"post_promotion_status" varchar(20),
	"post_promotion_created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "post_videos" (
	"post_video_id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"video_url" varchar(255) NOT NULL,
	"video_position" integer DEFAULT 0,
	"video_created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"post_id" serial PRIMARY KEY NOT NULL,
	"post_author_id" integer NOT NULL,
	"post_shop_id" integer,
	"category_id" integer,
	"post_title" varchar(255) NOT NULL,
	"post_slug" varchar(255) NOT NULL,
	"post_content" text,
	"post_price" numeric(12, 2),
	"post_location" varchar(255),
	"post_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"post_rejected_reason" text,
	"post_contact_phone" varchar(20),
	"post_published" boolean DEFAULT false,
	"post_view_count" integer DEFAULT 0,
	"post_contact_count" integer DEFAULT 0,
	"post_submitted_at" timestamp,
	"post_published_at" timestamp,
	"post_deleted_at" timestamp,
	"post_moderated_at" timestamp,
	"post_created_at" timestamp DEFAULT now(),
	"post_updated_at" timestamp DEFAULT now(),
	CONSTRAINT "posts_post_slug_unique" UNIQUE("post_slug")
);
--> statement-breakpoint
CREATE TABLE "promotion_package_audit_log" (
	"audit_id" serial PRIMARY KEY NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"package_id" integer,
	"price_id" integer,
	"before_state" jsonb,
	"after_state" jsonb,
	"changed_by" integer,
	"changed_at" timestamp DEFAULT now(),
	"note" text
);
--> statement-breakpoint
CREATE TABLE "promotion_package_prices" (
	"price_id" serial PRIMARY KEY NOT NULL,
	"package_id" integer NOT NULL,
	"price" numeric(15, 2) NOT NULL,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"note" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "promotion_packages" (
	"promotion_package_id" serial PRIMARY KEY NOT NULL,
	"promotion_package_slot_id" integer NOT NULL,
	"promotion_package_title" varchar(150),
	"promotion_package_duration_days" integer,
	"promotion_package_price" numeric(15, 2),
	"promotion_package_max_posts" integer DEFAULT 1,
	"promotion_package_display_quota" integer DEFAULT 0,
	"promotion_package_description" text,
	"promotion_package_published" boolean DEFAULT false,
	"promotion_package_deleted_at" timestamp,
	"promotion_package_created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "qr_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_evidence" (
	"report_evidence_id" serial PRIMARY KEY NOT NULL,
	"report_evidence_report_id" integer NOT NULL,
	"report_evidence_url" varchar(255),
	"report_evidence_created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"report_id" serial PRIMARY KEY NOT NULL,
	"reporter_id" integer,
	"post_id" integer,
	"report_shop_id" integer,
	"report_reason_code" varchar(50),
	"report_reason" text NOT NULL,
	"report_note" text,
	"report_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"report_created_at" timestamp DEFAULT now(),
	"report_updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"role_id" serial PRIMARY KEY NOT NULL,
	"role_code" varchar(50),
	"role_title" varchar(100),
	"role_created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"shop_id" integer PRIMARY KEY NOT NULL,
	"shop_name" varchar(150) NOT NULL,
	"shop_phone" varchar(50),
	"shop_email" varchar(255),
	"shop_email_verified" boolean DEFAULT false,
	"shop_facebook" varchar(255),
	"shop_instagram" varchar(255),
	"shop_youtube" varchar(255),
	"shop_location" varchar(255),
	"shop_description" text,
	"shop_logo_url" varchar(255),
	"shop_cover_url" varchar(255),
	"shop_status" varchar(20) DEFAULT 'pending',
	"shop_lat" numeric(10, 8),
	"shop_lng" numeric(11, 8),
	"shop_created_at" timestamp DEFAULT now(),
	"shop_updated_at" timestamp DEFAULT now(),
	CONSTRAINT "shops_shop_email_unique" UNIQUE("shop_email")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"system_setting_id" serial PRIMARY KEY NOT NULL,
	"system_setting_key" varchar(100),
	"system_setting_value" text,
	"system_setting_updated_by" integer,
	"system_setting_updated_at" timestamp DEFAULT now(),
	CONSTRAINT "system_settings_system_setting_key_unique" UNIQUE("system_setting_key")
);
--> statement-breakpoint
CREATE TABLE "trend_scores" (
	"trend_score_id" serial PRIMARY KEY NOT NULL,
	"trend_score_as_of_date" date,
	"trend_score_slot_id" integer NOT NULL,
	"trend_score_score" numeric(10, 4),
	"trend_score_components" jsonb,
	"trend_score_created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"user_mobile" varchar(15) NOT NULL,
	"user_display_name" varchar(80),
	"user_avatar_url" varchar(255),
	"user_email" varchar(255),
	"user_status" varchar(20) DEFAULT 'active',
	"user_business_role_id" integer,
	"user_registered_at" timestamp DEFAULT now(),
	"user_last_login_at" timestamp,
	"user_created_at" timestamp DEFAULT now(),
	"user_updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_user_mobile_unique" UNIQUE("user_mobile")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"verification_id" serial PRIMARY KEY NOT NULL,
	"target" varchar(255) NOT NULL,
	"otp_code" varchar(255) NOT NULL,
	"verification_type" varchar(20) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "admin_roles" ADD CONSTRAINT "admin_roles_admin_role_admin_id_admins_admin_id_fk" FOREIGN KEY ("admin_role_admin_id") REFERENCES "public"."admins"("admin_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_roles" ADD CONSTRAINT "admin_roles_admin_role_role_id_roles_role_id_fk" FOREIGN KEY ("admin_role_role_id") REFERENCES "public"."roles"("role_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_ai_insight_requested_by_users_user_id_fk" FOREIGN KEY ("ai_insight_requested_by") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_shops" ADD CONSTRAINT "blocked_shops_blocked_shop_user_id_users_user_id_fk" FOREIGN KEY ("blocked_shop_user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_shops" ADD CONSTRAINT "blocked_shops_blocked_shop_shop_id_shops_shop_id_fk" FOREIGN KEY ("blocked_shop_shop_id") REFERENCES "public"."shops"("shop_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_category_parent_id_categories_category_id_fk" FOREIGN KEY ("category_parent_id") REFERENCES "public"."categories"("category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_category_attribute_category_id_categories_category_id_fk" FOREIGN KEY ("category_attribute_category_id") REFERENCES "public"."categories"("category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_category_attribute_attribute_id_attributes_attribute_id_fk" FOREIGN KEY ("category_attribute_attribute_id") REFERENCES "public"."attributes"("attribute_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_placement_metrics" ADD CONSTRAINT "daily_placement_metrics_daily_placement_metric_slot_id_placement_slots_placement_slot_id_fk" FOREIGN KEY ("daily_placement_metric_slot_id") REFERENCES "public"."placement_slots"("placement_slot_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_placement_metrics" ADD CONSTRAINT "daily_placement_metrics_daily_placement_metric_category_id_categories_category_id_fk" FOREIGN KEY ("daily_placement_metric_category_id") REFERENCES "public"."categories"("category_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_event_log_user_id_users_user_id_fk" FOREIGN KEY ("event_log_user_id") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_posts" ADD CONSTRAINT "favorite_posts_favorite_post_user_id_users_user_id_fk" FOREIGN KEY ("favorite_post_user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_posts" ADD CONSTRAINT "favorite_posts_favorite_post_post_id_posts_post_id_fk" FOREIGN KEY ("favorite_post_post_id") REFERENCES "public"."posts"("post_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_moderation_action_action_by_admins_admin_id_fk" FOREIGN KEY ("moderation_action_action_by") REFERENCES "public"."admins"("admin_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_moderation_action_post_id_posts_post_id_fk" FOREIGN KEY ("moderation_action_post_id") REFERENCES "public"."posts"("post_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_txn" ADD CONSTRAINT "payment_txn_payment_txn_user_id_users_user_id_fk" FOREIGN KEY ("payment_txn_user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_txn" ADD CONSTRAINT "payment_txn_payment_txn_package_id_promotion_packages_promotion_package_id_fk" FOREIGN KEY ("payment_txn_package_id") REFERENCES "public"."promotion_packages"("promotion_package_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_txn" ADD CONSTRAINT "payment_txn_payment_txn_post_id_posts_post_id_fk" FOREIGN KEY ("payment_txn_post_id") REFERENCES "public"."posts"("post_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_txn" ADD CONSTRAINT "payment_txn_payment_txn_price_id_promotion_package_prices_price_id_fk" FOREIGN KEY ("payment_txn_price_id") REFERENCES "public"."promotion_package_prices"("price_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_attribute_values" ADD CONSTRAINT "post_attribute_values_post_id_posts_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_attribute_values" ADD CONSTRAINT "post_attribute_values_attribute_id_attributes_attribute_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("attribute_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_categories" ADD CONSTRAINT "post_categories_post_category_post_id_posts_post_id_fk" FOREIGN KEY ("post_category_post_id") REFERENCES "public"."posts"("post_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_categories" ADD CONSTRAINT "post_categories_post_category_category_id_categories_category_id_fk" FOREIGN KEY ("post_category_category_id") REFERENCES "public"."categories"("category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_images" ADD CONSTRAINT "post_images_post_id_posts_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_meta" ADD CONSTRAINT "post_meta_post_meta_post_id_posts_post_id_fk" FOREIGN KEY ("post_meta_post_id") REFERENCES "public"."posts"("post_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_promotions" ADD CONSTRAINT "post_promotions_post_promotion_post_id_posts_post_id_fk" FOREIGN KEY ("post_promotion_post_id") REFERENCES "public"."posts"("post_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_promotions" ADD CONSTRAINT "post_promotions_post_promotion_package_id_promotion_packages_promotion_package_id_fk" FOREIGN KEY ("post_promotion_package_id") REFERENCES "public"."promotion_packages"("promotion_package_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_promotions" ADD CONSTRAINT "post_promotions_post_promotion_slot_id_placement_slots_placement_slot_id_fk" FOREIGN KEY ("post_promotion_slot_id") REFERENCES "public"."placement_slots"("placement_slot_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_videos" ADD CONSTRAINT "post_videos_post_id_posts_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_post_author_id_users_user_id_fk" FOREIGN KEY ("post_author_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_post_shop_id_shops_shop_id_fk" FOREIGN KEY ("post_shop_id") REFERENCES "public"."shops"("shop_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_package_audit_log" ADD CONSTRAINT "promotion_package_audit_log_package_id_promotion_packages_promotion_package_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."promotion_packages"("promotion_package_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_package_audit_log" ADD CONSTRAINT "promotion_package_audit_log_price_id_promotion_package_prices_price_id_fk" FOREIGN KEY ("price_id") REFERENCES "public"."promotion_package_prices"("price_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_package_audit_log" ADD CONSTRAINT "promotion_package_audit_log_changed_by_admins_admin_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."admins"("admin_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_package_prices" ADD CONSTRAINT "promotion_package_prices_package_id_promotion_packages_promotion_package_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."promotion_packages"("promotion_package_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_package_prices" ADD CONSTRAINT "promotion_package_prices_created_by_admins_admin_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("admin_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_packages" ADD CONSTRAINT "promotion_packages_promotion_package_slot_id_placement_slots_placement_slot_id_fk" FOREIGN KEY ("promotion_package_slot_id") REFERENCES "public"."placement_slots"("placement_slot_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_sessions" ADD CONSTRAINT "qr_sessions_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_evidence" ADD CONSTRAINT "report_evidence_report_evidence_report_id_reports_report_id_fk" FOREIGN KEY ("report_evidence_report_id") REFERENCES "public"."reports"("report_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_post_id_posts_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_report_shop_id_shops_shop_id_fk" FOREIGN KEY ("report_shop_id") REFERENCES "public"."shops"("shop_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_shop_id_users_user_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_system_setting_updated_by_admins_admin_id_fk" FOREIGN KEY ("system_setting_updated_by") REFERENCES "public"."admins"("admin_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trend_scores" ADD CONSTRAINT "trend_scores_trend_score_slot_id_placement_slots_placement_slot_id_fk" FOREIGN KEY ("trend_score_slot_id") REFERENCES "public"."placement_slots"("placement_slot_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_user_business_role_id_business_roles_business_role_id_fk" FOREIGN KEY ("user_business_role_id") REFERENCES "public"."business_roles"("business_role_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attribute_filter_idx" ON "post_attribute_values" USING btree ("post_id","attribute_id","attribute_value");--> statement-breakpoint
CREATE INDEX "post_search_idx" ON "posts" USING gin (to_tsvector('simple', "post_title" || ' ' || coalesce("post_content", '')));--> statement-breakpoint
CREATE INDEX "post_category_idx" ON "posts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "post_status_idx" ON "posts" USING btree ("post_status");--> statement-breakpoint
CREATE INDEX "post_price_idx" ON "posts" USING btree ("post_price");--> statement-breakpoint
CREATE INDEX "post_location_idx" ON "posts" USING btree ("post_location");