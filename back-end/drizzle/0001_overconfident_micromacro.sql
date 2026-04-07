CREATE TABLE "admin_system_settings" (
	"setting_id" serial PRIMARY KEY NOT NULL,
	"otp_sandbox_enabled" boolean,
	"max_images_per_post" integer,
	"post_rate_limit_per_hour" integer,
	"banned_keywords" jsonb,
	"auto_moderation_enabled" boolean,
	"keyword_filter_enabled" boolean,
	"report_rate_limit" integer,
	"post_expiry_days" integer,
	"restore_window_days" integer,
	"auto_expire_enabled" boolean,
	"max_file_size_mb" integer,
	"image_compression_enabled" boolean,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_templates" (
	"template_id" serial PRIMARY KEY NOT NULL,
	"template_name" varchar(150) NOT NULL,
	"template_type" varchar(50) NOT NULL,
	"template_content" text NOT NULL,
	"template_status" varchar(30),
	"template_created_by" integer,
	"template_created_at" timestamp DEFAULT now(),
	"template_updated_by" integer,
	"template_updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "otp_requests" (
	"otp_request_id" serial PRIMARY KEY NOT NULL,
	"otp_request_mobile" varchar(20),
	"otp_request_otp_code" varchar(20),
	"otp_request_expire_at" timestamp,
	"otp_request_status" varchar(30),
	"otp_request_created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "category_attributes" ADD COLUMN "category_attribute_id" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "category_attributes" ADD COLUMN "category_attribute_display_order" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "category_attributes" ADD COLUMN "category_attribute_status" varchar(20) DEFAULT 'Active';--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "shop_owner_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "user_location" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "user_bio" text;--> statement-breakpoint
ALTER TABLE "admin_system_settings" ADD CONSTRAINT "admin_system_settings_updated_by_admins_admin_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("admin_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_templates" ADD CONSTRAINT "admin_templates_template_created_by_admins_admin_id_fk" FOREIGN KEY ("template_created_by") REFERENCES "public"."admins"("admin_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_templates" ADD CONSTRAINT "admin_templates_template_updated_by_admins_admin_id_fk" FOREIGN KEY ("template_updated_by") REFERENCES "public"."admins"("admin_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_shop_owner_id_users_user_id_fk" FOREIGN KEY ("shop_owner_id") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;