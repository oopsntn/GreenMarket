-- 1. Add missing columns to promotion_packages
ALTER TABLE promotion_packages 
ADD COLUMN IF NOT EXISTS promotion_package_price DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS promotion_package_max_posts INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS promotion_package_display_quota INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS promotion_package_description TEXT;

-- 2. Ensure promotion_package_audit_log matches the trigger expectations
-- (changed_by should be nullable)
ALTER TABLE promotion_package_audit_log 
ALTER COLUMN changed_by DROP NOT NULL;

-- 3. Re-define the trigger function with robust logic
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

-- 4. Re-attach the trigger
DROP TRIGGER IF EXISTS trg_audit_promotion_packages ON promotion_packages;
CREATE TRIGGER trg_audit_promotion_packages
    AFTER INSERT OR UPDATE ON promotion_packages
    FOR EACH ROW EXECUTE FUNCTION log_promotion_package_changes();
