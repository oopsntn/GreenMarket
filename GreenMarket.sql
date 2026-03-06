--
-- PostgreSQL database dump
--

\restrict YM0HVt071pqpV33LU3ZXFs9Huho7WuozlIvMISHwjzwGXgDjDkAjcBxyixBJUHP

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: account_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.account_status AS ENUM (
    'active',
    'inactive',
    'banned',
    'pending'
);


ALTER TYPE public.account_status OWNER TO postgres;

--
-- Name: job_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.job_status AS ENUM (
    'open',
    'in_progress',
    'completed',
    'cancelled',
    'disputed'
);


ALTER TYPE public.job_status OWNER TO postgres;

--
-- Name: moderation_action; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.moderation_action AS ENUM (
    'approve',
    'reject',
    'remove',
    'warn',
    'ban'
);


ALTER TYPE public.moderation_action OWNER TO postgres;

--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_type AS ENUM (
    'system',
    'job',
    'payment',
    'report',
    'message',
    'review'
);


ALTER TYPE public.notification_type OWNER TO postgres;

--
-- Name: otp_purpose; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.otp_purpose AS ENUM (
    'register',
    'login',
    'reset_password',
    'verify_email',
    'verify_phone'
);


ALTER TYPE public.otp_purpose OWNER TO postgres;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);


ALTER TYPE public.payment_status OWNER TO postgres;

--
-- Name: payout_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payout_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'rejected'
);


ALTER TYPE public.payout_status OWNER TO postgres;

--
-- Name: post_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.post_status AS ENUM (
    'draft',
    'published',
    'hidden',
    'rejected',
    'pending_review'
);


ALTER TYPE public.post_status OWNER TO postgres;

--
-- Name: report_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.report_status AS ENUM (
    'pending',
    'under_review',
    'resolved',
    'dismissed'
);


ALTER TYPE public.report_status OWNER TO postgres;

--
-- Name: shop_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.shop_status AS ENUM (
    'active',
    'inactive',
    'suspended',
    'pending_review'
);


ALTER TYPE public.shop_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_roles (
    id integer NOT NULL,
    account_id uuid NOT NULL,
    role_id integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.account_roles OWNER TO postgres;

--
-- Name: account_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.account_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.account_roles_id_seq OWNER TO postgres;

--
-- Name: account_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.account_roles_id_seq OWNED BY public.account_roles.id;


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    password_hash character varying(255) NOT NULL,
    full_name character varying(100),
    avatar_url text,
    status public.account_status DEFAULT 'pending'::public.account_status,
    email_verified boolean DEFAULT false,
    phone_verified boolean DEFAULT false,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.accounts OWNER TO postgres;

--
-- Name: admin_activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_activity_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    admin_id uuid NOT NULL,
    action character varying(100) NOT NULL,
    target_type character varying(50),
    target_id uuid,
    detail jsonb,
    ip_address inet,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.admin_activity_logs OWNER TO postgres;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    target_audience character varying(50) DEFAULT 'all'::character varying,
    is_published boolean DEFAULT false,
    published_at timestamp without time zone,
    expires_at timestamp without time zone,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.announcements OWNER TO postgres;

--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcements_id_seq OWNER TO postgres;

--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: attributes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attributes (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    data_type character varying(30) NOT NULL,
    unit character varying(30),
    is_required boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.attributes OWNER TO postgres;

--
-- Name: attributes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attributes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attributes_id_seq OWNER TO postgres;

--
-- Name: attributes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attributes_id_seq OWNED BY public.attributes.id;


--
-- Name: blocked_shops; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blocked_shops (
    id integer NOT NULL,
    account_id uuid NOT NULL,
    shop_id uuid NOT NULL,
    reason text,
    blocked_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.blocked_shops OWNER TO postgres;

--
-- Name: blocked_shops_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.blocked_shops_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blocked_shops_id_seq OWNER TO postgres;

--
-- Name: blocked_shops_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.blocked_shops_id_seq OWNED BY public.blocked_shops.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    parent_id integer,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    icon_url text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: category_attribute_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.category_attribute_configs (
    id integer NOT NULL,
    category_id integer NOT NULL,
    attribute_id integer NOT NULL,
    is_required boolean DEFAULT false,
    sort_order integer DEFAULT 0
);


ALTER TABLE public.category_attribute_configs OWNER TO postgres;

--
-- Name: category_attribute_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.category_attribute_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.category_attribute_configs_id_seq OWNER TO postgres;

--
-- Name: category_attribute_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.category_attribute_configs_id_seq OWNED BY public.category_attribute_configs.id;


--
-- Name: earning_statements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.earning_statements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    account_id uuid NOT NULL,
    shop_id uuid,
    period_start date NOT NULL,
    period_end date NOT NULL,
    gross_amount numeric(15,2) NOT NULL,
    fee_amount numeric(15,2) DEFAULT 0,
    net_amount numeric(15,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.earning_statements OWNER TO postgres;

--
-- Name: export_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.export_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    account_id uuid NOT NULL,
    export_type character varying(50) NOT NULL,
    filters jsonb,
    status character varying(30) DEFAULT 'pending'::character varying,
    file_url text,
    requested_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone
);


ALTER TABLE public.export_requests OWNER TO postgres;

--
-- Name: favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.favorites (
    id integer NOT NULL,
    account_id uuid NOT NULL,
    target_type character varying(50) NOT NULL,
    target_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.favorites OWNER TO postgres;

--
-- Name: favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.favorites_id_seq OWNER TO postgres;

--
-- Name: favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.favorites_id_seq OWNED BY public.favorites.id;


--
-- Name: feedbacks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feedbacks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    account_id uuid,
    job_id uuid,
    shop_id uuid,
    rating smallint,
    comment text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT feedbacks_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.feedbacks OWNER TO postgres;

--
-- Name: host_contents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.host_contents (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    body text NOT NULL,
    is_published boolean DEFAULT false,
    updated_by uuid,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.host_contents OWNER TO postgres;

--
-- Name: host_contents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.host_contents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.host_contents_id_seq OWNER TO postgres;

--
-- Name: host_contents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.host_contents_id_seq OWNED BY public.host_contents.id;


--
-- Name: job_deliverables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_deliverables (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    job_id uuid NOT NULL,
    file_url text,
    note text,
    submitted_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.job_deliverables OWNER TO postgres;

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jobs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    post_id uuid,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    shop_id uuid,
    title character varying(255) NOT NULL,
    description text,
    price numeric(15,2) NOT NULL,
    status public.job_status DEFAULT 'open'::public.job_status,
    deadline_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.jobs OWNER TO postgres;

--
-- Name: moderation_action_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.moderation_action_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    moderator_id uuid NOT NULL,
    target_type character varying(50) NOT NULL,
    target_id uuid NOT NULL,
    action public.moderation_action NOT NULL,
    reason text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.moderation_action_logs OWNER TO postgres;

--
-- Name: moderation_queue_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.moderation_queue_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    target_type character varying(50) NOT NULL,
    target_id uuid NOT NULL,
    priority integer DEFAULT 0,
    assigned_to uuid,
    reviewed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.moderation_queue_items OWNER TO postgres;

--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_preferences (
    id integer NOT NULL,
    account_id uuid NOT NULL,
    type public.notification_type NOT NULL,
    email_enabled boolean DEFAULT true,
    push_enabled boolean DEFAULT true,
    sms_enabled boolean DEFAULT false
);


ALTER TABLE public.notification_preferences OWNER TO postgres;

--
-- Name: notification_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_preferences_id_seq OWNER TO postgres;

--
-- Name: notification_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_preferences_id_seq OWNED BY public.notification_preferences.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    account_id uuid NOT NULL,
    type public.notification_type NOT NULL,
    title character varying(255) NOT NULL,
    body text,
    is_read boolean DEFAULT false,
    ref_type character varying(50),
    ref_id uuid,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: operation_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operation_tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    task_type character varying(50) NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying,
    assigned_to uuid,
    due_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.operation_tasks OWNER TO postgres;

--
-- Name: otp_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    account_id uuid,
    target character varying(255) NOT NULL,
    otp_code character varying(10) NOT NULL,
    purpose public.otp_purpose NOT NULL,
    is_used boolean DEFAULT false,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.otp_requests OWNER TO postgres;

--
-- Name: otp_verification_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_verification_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    account_id uuid,
    target character varying(255) NOT NULL,
    purpose public.otp_purpose NOT NULL,
    success boolean NOT NULL,
    ip_address inet,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.otp_verification_logs OWNER TO postgres;

--
-- Name: package_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.package_plans (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    price numeric(15,2) NOT NULL,
    duration_days integer NOT NULL,
    features jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.package_plans OWNER TO postgres;

--
-- Name: package_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.package_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.package_plans_id_seq OWNER TO postgres;

--
-- Name: package_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.package_plans_id_seq OWNED BY public.package_plans.id;


--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    account_id uuid NOT NULL,
    job_id uuid,
    amount numeric(15,2) NOT NULL,
    currency character varying(10) DEFAULT 'VND'::character varying,
    status public.payment_status DEFAULT 'pending'::public.payment_status,
    payment_method character varying(50),
    reference_code character varying(100),
    note text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.payment_transactions OWNER TO postgres;

--
-- Name: payout_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payout_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    account_id uuid NOT NULL,
    amount numeric(15,2) NOT NULL,
    bank_account character varying(50),
    bank_name character varying(100),
    status public.payout_status DEFAULT 'pending'::public.payout_status,
    note text,
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.payout_requests OWNER TO postgres;

--
-- Name: placement_slots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.placement_slots (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    location_key character varying(100) NOT NULL,
    max_capacity integer DEFAULT 1,
    price_per_day numeric(15,2),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.placement_slots OWNER TO postgres;

--
-- Name: placement_slots_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.placement_slots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.placement_slots_id_seq OWNER TO postgres;

--
-- Name: placement_slots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.placement_slots_id_seq OWNED BY public.placement_slots.id;


--
-- Name: post_attribute_values; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_attribute_values (
    id integer NOT NULL,
    post_id uuid NOT NULL,
    attribute_id integer NOT NULL,
    value text NOT NULL
);


ALTER TABLE public.post_attribute_values OWNER TO postgres;

--
-- Name: post_attribute_values_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.post_attribute_values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_attribute_values_id_seq OWNER TO postgres;

--
-- Name: post_attribute_values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.post_attribute_values_id_seq OWNED BY public.post_attribute_values.id;


--
-- Name: post_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_images (
    id integer NOT NULL,
    post_id uuid NOT NULL,
    image_url text NOT NULL,
    is_primary boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.post_images OWNER TO postgres;

--
-- Name: post_images_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.post_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_images_id_seq OWNER TO postgres;

--
-- Name: post_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.post_images_id_seq OWNED BY public.post_images.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    shop_id uuid NOT NULL,
    category_id integer,
    title character varying(255) NOT NULL,
    description text,
    price numeric(15,2),
    status public.post_status DEFAULT 'draft'::public.post_status,
    view_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: rejection_reasons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rejection_reasons (
    id integer NOT NULL,
    target_type character varying(50) NOT NULL,
    reason character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.rejection_reasons OWNER TO postgres;

--
-- Name: rejection_reasons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rejection_reasons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rejection_reasons_id_seq OWNER TO postgres;

--
-- Name: rejection_reasons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rejection_reasons_id_seq OWNED BY public.rejection_reasons.id;


--
-- Name: report_evidences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_evidences (
    id integer NOT NULL,
    report_id uuid NOT NULL,
    file_url text NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.report_evidences OWNER TO postgres;

--
-- Name: report_evidences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_evidences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_evidences_id_seq OWNER TO postgres;

--
-- Name: report_evidences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_evidences_id_seq OWNED BY public.report_evidences.id;


--
-- Name: report_resolutions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_resolutions (
    id integer NOT NULL,
    report_id uuid NOT NULL,
    resolved_by uuid NOT NULL,
    action_taken text NOT NULL,
    note text,
    resolved_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.report_resolutions OWNER TO postgres;

--
-- Name: report_resolutions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_resolutions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_resolutions_id_seq OWNER TO postgres;

--
-- Name: report_resolutions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_resolutions_id_seq OWNED BY public.report_resolutions.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    reporter_id uuid NOT NULL,
    target_type character varying(50) NOT NULL,
    target_id uuid NOT NULL,
    reason text NOT NULL,
    status public.report_status DEFAULT 'pending'::public.report_status,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: shops; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shops (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    account_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    slug character varying(150) NOT NULL,
    description text,
    logo_url text,
    cover_url text,
    status public.shop_status DEFAULT 'pending_review'::public.shop_status,
    rating numeric(3,2) DEFAULT 0,
    total_sales integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.shops OWNER TO postgres;

--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    account_id uuid NOT NULL,
    subject character varying(255) NOT NULL,
    description text NOT NULL,
    status character varying(30) DEFAULT 'open'::character varying,
    priority character varying(20) DEFAULT 'normal'::character varying,
    assigned_to uuid,
    resolved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.support_tickets OWNER TO postgres;

--
-- Name: templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.templates (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(50) NOT NULL,
    subject character varying(255),
    body text NOT NULL,
    variables jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.templates OWNER TO postgres;

--
-- Name: templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.templates_id_seq OWNER TO postgres;

--
-- Name: templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.templates_id_seq OWNED BY public.templates.id;


--
-- Name: account_roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_roles ALTER COLUMN id SET DEFAULT nextval('public.account_roles_id_seq'::regclass);


--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: attributes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attributes ALTER COLUMN id SET DEFAULT nextval('public.attributes_id_seq'::regclass);


--
-- Name: blocked_shops id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_shops ALTER COLUMN id SET DEFAULT nextval('public.blocked_shops_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: category_attribute_configs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_attribute_configs ALTER COLUMN id SET DEFAULT nextval('public.category_attribute_configs_id_seq'::regclass);


--
-- Name: favorites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites ALTER COLUMN id SET DEFAULT nextval('public.favorites_id_seq'::regclass);


--
-- Name: host_contents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.host_contents ALTER COLUMN id SET DEFAULT nextval('public.host_contents_id_seq'::regclass);


--
-- Name: notification_preferences id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences ALTER COLUMN id SET DEFAULT nextval('public.notification_preferences_id_seq'::regclass);


--
-- Name: package_plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_plans ALTER COLUMN id SET DEFAULT nextval('public.package_plans_id_seq'::regclass);


--
-- Name: placement_slots id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_slots ALTER COLUMN id SET DEFAULT nextval('public.placement_slots_id_seq'::regclass);


--
-- Name: post_attribute_values id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_attribute_values ALTER COLUMN id SET DEFAULT nextval('public.post_attribute_values_id_seq'::regclass);


--
-- Name: post_images id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_images ALTER COLUMN id SET DEFAULT nextval('public.post_images_id_seq'::regclass);


--
-- Name: rejection_reasons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rejection_reasons ALTER COLUMN id SET DEFAULT nextval('public.rejection_reasons_id_seq'::regclass);


--
-- Name: report_evidences id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_evidences ALTER COLUMN id SET DEFAULT nextval('public.report_evidences_id_seq'::regclass);


--
-- Name: report_resolutions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_resolutions ALTER COLUMN id SET DEFAULT nextval('public.report_resolutions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.templates ALTER COLUMN id SET DEFAULT nextval('public.templates_id_seq'::regclass);


--
-- Data for Name: account_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.account_roles (id, account_id, role_id, assigned_at) FROM stdin;
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounts (id, email, phone, password_hash, full_name, avatar_url, status, email_verified, phone_verified, last_login_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: admin_activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_activity_logs (id, admin_id, action, target_type, target_id, detail, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announcements (id, title, content, target_audience, is_published, published_at, expires_at, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: attributes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attributes (id, name, data_type, unit, is_required, created_at) FROM stdin;
\.


--
-- Data for Name: blocked_shops; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blocked_shops (id, account_id, shop_id, reason, blocked_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, parent_id, name, slug, icon_url, is_active, sort_order, created_at) FROM stdin;
\.


--
-- Data for Name: category_attribute_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.category_attribute_configs (id, category_id, attribute_id, is_required, sort_order) FROM stdin;
\.


--
-- Data for Name: earning_statements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.earning_statements (id, account_id, shop_id, period_start, period_end, gross_amount, fee_amount, net_amount, created_at) FROM stdin;
\.


--
-- Data for Name: export_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.export_requests (id, account_id, export_type, filters, status, file_url, requested_at, completed_at) FROM stdin;
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.favorites (id, account_id, target_type, target_id, created_at) FROM stdin;
\.


--
-- Data for Name: feedbacks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feedbacks (id, account_id, job_id, shop_id, rating, comment, created_at) FROM stdin;
\.


--
-- Data for Name: host_contents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.host_contents (id, key, title, body, is_published, updated_by, updated_at) FROM stdin;
\.


--
-- Data for Name: job_deliverables; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_deliverables (id, job_id, file_url, note, submitted_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobs (id, post_id, buyer_id, seller_id, shop_id, title, description, price, status, deadline_at, completed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: moderation_action_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.moderation_action_logs (id, moderator_id, target_type, target_id, action, reason, created_at) FROM stdin;
\.


--
-- Data for Name: moderation_queue_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.moderation_queue_items (id, target_type, target_id, priority, assigned_to, reviewed_at, created_at) FROM stdin;
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_preferences (id, account_id, type, email_enabled, push_enabled, sms_enabled) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, account_id, type, title, body, is_read, ref_type, ref_id, created_at) FROM stdin;
\.


--
-- Data for Name: operation_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.operation_tasks (id, name, description, task_type, status, assigned_to, due_at, completed_at, created_at) FROM stdin;
\.


--
-- Data for Name: otp_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_requests (id, account_id, target, otp_code, purpose, is_used, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: otp_verification_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_verification_logs (id, account_id, target, purpose, success, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: package_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.package_plans (id, name, description, price, duration_days, features, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: payment_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_transactions (id, account_id, job_id, amount, currency, status, payment_method, reference_code, note, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payout_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payout_requests (id, account_id, amount, bank_account, bank_name, status, note, processed_at, created_at) FROM stdin;
\.


--
-- Data for Name: placement_slots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.placement_slots (id, name, description, location_key, max_capacity, price_per_day, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: post_attribute_values; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_attribute_values (id, post_id, attribute_id, value) FROM stdin;
\.


--
-- Data for Name: post_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_images (id, post_id, image_url, is_primary, sort_order, created_at) FROM stdin;
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.posts (id, shop_id, category_id, title, description, price, status, view_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: rejection_reasons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rejection_reasons (id, target_type, reason, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: report_evidences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.report_evidences (id, report_id, file_url, uploaded_at) FROM stdin;
\.


--
-- Data for Name: report_resolutions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.report_resolutions (id, report_id, resolved_by, action_taken, note, resolved_at) FROM stdin;
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, reporter_id, target_type, target_id, reason, status, created_at) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description, created_at) FROM stdin;
1	admin	System administrator	2026-02-23 19:43:07.879507
2	moderator	Content moderator	2026-02-23 19:43:07.879507
3	seller	Shop owner / seller	2026-02-23 19:43:07.879507
4	buyer	Regular buyer	2026-02-23 19:43:07.879507
\.


--
-- Data for Name: shops; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shops (id, account_id, name, slug, description, logo_url, cover_url, status, rating, total_sales, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_tickets (id, account_id, subject, description, status, priority, assigned_to, resolved_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.templates (id, name, type, subject, body, variables, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Name: account_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.account_roles_id_seq', 1, false);


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.announcements_id_seq', 1, false);


--
-- Name: attributes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attributes_id_seq', 1, false);


--
-- Name: blocked_shops_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.blocked_shops_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 1, false);


--
-- Name: category_attribute_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.category_attribute_configs_id_seq', 1, false);


--
-- Name: favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.favorites_id_seq', 1, false);


--
-- Name: host_contents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.host_contents_id_seq', 1, false);


--
-- Name: notification_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_preferences_id_seq', 1, false);


--
-- Name: package_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.package_plans_id_seq', 1, false);


--
-- Name: placement_slots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.placement_slots_id_seq', 1, false);


--
-- Name: post_attribute_values_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.post_attribute_values_id_seq', 1, false);


--
-- Name: post_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.post_images_id_seq', 1, false);


--
-- Name: rejection_reasons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rejection_reasons_id_seq', 1, false);


--
-- Name: report_evidences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.report_evidences_id_seq', 1, false);


--
-- Name: report_resolutions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.report_resolutions_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);


--
-- Name: templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.templates_id_seq', 1, false);


--
-- Name: account_roles account_roles_account_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_roles
    ADD CONSTRAINT account_roles_account_id_role_id_key UNIQUE (account_id, role_id);


--
-- Name: account_roles account_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_roles
    ADD CONSTRAINT account_roles_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_email_key UNIQUE (email);


--
-- Name: accounts accounts_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_phone_key UNIQUE (phone);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: admin_activity_logs admin_activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_activity_logs
    ADD CONSTRAINT admin_activity_logs_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: attributes attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attributes
    ADD CONSTRAINT attributes_pkey PRIMARY KEY (id);


--
-- Name: blocked_shops blocked_shops_account_id_shop_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_shops
    ADD CONSTRAINT blocked_shops_account_id_shop_id_key UNIQUE (account_id, shop_id);


--
-- Name: blocked_shops blocked_shops_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_shops
    ADD CONSTRAINT blocked_shops_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: category_attribute_configs category_attribute_configs_category_id_attribute_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_attribute_configs
    ADD CONSTRAINT category_attribute_configs_category_id_attribute_id_key UNIQUE (category_id, attribute_id);


--
-- Name: category_attribute_configs category_attribute_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_attribute_configs
    ADD CONSTRAINT category_attribute_configs_pkey PRIMARY KEY (id);


--
-- Name: earning_statements earning_statements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.earning_statements
    ADD CONSTRAINT earning_statements_pkey PRIMARY KEY (id);


--
-- Name: export_requests export_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.export_requests
    ADD CONSTRAINT export_requests_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_account_id_target_type_target_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_account_id_target_type_target_id_key UNIQUE (account_id, target_type, target_id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: feedbacks feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_pkey PRIMARY KEY (id);


--
-- Name: host_contents host_contents_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.host_contents
    ADD CONSTRAINT host_contents_key_key UNIQUE (key);


--
-- Name: host_contents host_contents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.host_contents
    ADD CONSTRAINT host_contents_pkey PRIMARY KEY (id);


--
-- Name: job_deliverables job_deliverables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_deliverables
    ADD CONSTRAINT job_deliverables_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: moderation_action_logs moderation_action_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moderation_action_logs
    ADD CONSTRAINT moderation_action_logs_pkey PRIMARY KEY (id);


--
-- Name: moderation_queue_items moderation_queue_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moderation_queue_items
    ADD CONSTRAINT moderation_queue_items_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_account_id_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_account_id_type_key UNIQUE (account_id, type);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: operation_tasks operation_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operation_tasks
    ADD CONSTRAINT operation_tasks_pkey PRIMARY KEY (id);


--
-- Name: otp_requests otp_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_requests
    ADD CONSTRAINT otp_requests_pkey PRIMARY KEY (id);


--
-- Name: otp_verification_logs otp_verification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_verification_logs
    ADD CONSTRAINT otp_verification_logs_pkey PRIMARY KEY (id);


--
-- Name: package_plans package_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_plans
    ADD CONSTRAINT package_plans_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_reference_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_reference_code_key UNIQUE (reference_code);


--
-- Name: payout_requests payout_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payout_requests
    ADD CONSTRAINT payout_requests_pkey PRIMARY KEY (id);


--
-- Name: placement_slots placement_slots_location_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_slots
    ADD CONSTRAINT placement_slots_location_key_key UNIQUE (location_key);


--
-- Name: placement_slots placement_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_slots
    ADD CONSTRAINT placement_slots_pkey PRIMARY KEY (id);


--
-- Name: post_attribute_values post_attribute_values_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_attribute_values
    ADD CONSTRAINT post_attribute_values_pkey PRIMARY KEY (id);


--
-- Name: post_attribute_values post_attribute_values_post_id_attribute_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_attribute_values
    ADD CONSTRAINT post_attribute_values_post_id_attribute_id_key UNIQUE (post_id, attribute_id);


--
-- Name: post_images post_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_images
    ADD CONSTRAINT post_images_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: rejection_reasons rejection_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rejection_reasons
    ADD CONSTRAINT rejection_reasons_pkey PRIMARY KEY (id);


--
-- Name: report_evidences report_evidences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_evidences
    ADD CONSTRAINT report_evidences_pkey PRIMARY KEY (id);


--
-- Name: report_resolutions report_resolutions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_resolutions
    ADD CONSTRAINT report_resolutions_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: shops shops_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_pkey PRIMARY KEY (id);


--
-- Name: shops shops_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_slug_key UNIQUE (slug);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);


--
-- Name: idx_accounts_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounts_email ON public.accounts USING btree (email);


--
-- Name: idx_accounts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounts_status ON public.accounts USING btree (status);


--
-- Name: idx_admin_activity_logs_admin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_activity_logs_admin_id ON public.admin_activity_logs USING btree (admin_id);


--
-- Name: idx_jobs_buyer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_buyer_id ON public.jobs USING btree (buyer_id);


--
-- Name: idx_jobs_seller_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_seller_id ON public.jobs USING btree (seller_id);


--
-- Name: idx_jobs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_status ON public.jobs USING btree (status);


--
-- Name: idx_moderation_queue_target; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_moderation_queue_target ON public.moderation_queue_items USING btree (target_type, target_id);


--
-- Name: idx_notifications_account_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_account_id ON public.notifications USING btree (account_id);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_payment_transactions_account_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_transactions_account_id ON public.payment_transactions USING btree (account_id);


--
-- Name: idx_posts_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_category_id ON public.posts USING btree (category_id);


--
-- Name: idx_posts_shop_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_shop_id ON public.posts USING btree (shop_id);


--
-- Name: idx_posts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_status ON public.posts USING btree (status);


--
-- Name: idx_reports_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_status ON public.reports USING btree (status);


--
-- Name: idx_shops_account_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shops_account_id ON public.shops USING btree (account_id);


--
-- Name: idx_shops_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shops_status ON public.shops USING btree (status);


--
-- Name: account_roles account_roles_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_roles
    ADD CONSTRAINT account_roles_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: account_roles account_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_roles
    ADD CONSTRAINT account_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: admin_activity_logs admin_activity_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_activity_logs
    ADD CONSTRAINT admin_activity_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.accounts(id);


--
-- Name: announcements announcements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.accounts(id);


--
-- Name: blocked_shops blocked_shops_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_shops
    ADD CONSTRAINT blocked_shops_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: blocked_shops blocked_shops_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_shops
    ADD CONSTRAINT blocked_shops_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: category_attribute_configs category_attribute_configs_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_attribute_configs
    ADD CONSTRAINT category_attribute_configs_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.attributes(id) ON DELETE CASCADE;


--
-- Name: category_attribute_configs category_attribute_configs_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_attribute_configs
    ADD CONSTRAINT category_attribute_configs_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: earning_statements earning_statements_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.earning_statements
    ADD CONSTRAINT earning_statements_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: earning_statements earning_statements_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.earning_statements
    ADD CONSTRAINT earning_statements_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: export_requests export_requests_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.export_requests
    ADD CONSTRAINT export_requests_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: favorites favorites_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: feedbacks feedbacks_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: feedbacks feedbacks_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;


--
-- Name: feedbacks feedbacks_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE SET NULL;


--
-- Name: host_contents host_contents_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.host_contents
    ADD CONSTRAINT host_contents_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.accounts(id);


--
-- Name: job_deliverables job_deliverables_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_deliverables
    ADD CONSTRAINT job_deliverables_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: jobs jobs_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.accounts(id);


--
-- Name: jobs jobs_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE SET NULL;


--
-- Name: jobs jobs_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.accounts(id);


--
-- Name: jobs jobs_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: moderation_action_logs moderation_action_logs_moderator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moderation_action_logs
    ADD CONSTRAINT moderation_action_logs_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES public.accounts(id);


--
-- Name: moderation_queue_items moderation_queue_items_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moderation_queue_items
    ADD CONSTRAINT moderation_queue_items_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: notification_preferences notification_preferences_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: operation_tasks operation_tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operation_tasks
    ADD CONSTRAINT operation_tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: otp_requests otp_requests_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_requests
    ADD CONSTRAINT otp_requests_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: otp_verification_logs otp_verification_logs_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_verification_logs
    ADD CONSTRAINT otp_verification_logs_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: payment_transactions payment_transactions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: payment_transactions payment_transactions_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;


--
-- Name: payout_requests payout_requests_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payout_requests
    ADD CONSTRAINT payout_requests_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: post_attribute_values post_attribute_values_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_attribute_values
    ADD CONSTRAINT post_attribute_values_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.attributes(id) ON DELETE CASCADE;


--
-- Name: post_attribute_values post_attribute_values_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_attribute_values
    ADD CONSTRAINT post_attribute_values_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_images post_images_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_images
    ADD CONSTRAINT post_images_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: posts posts_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: posts posts_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;


--
-- Name: report_evidences report_evidences_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_evidences
    ADD CONSTRAINT report_evidences_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE CASCADE;


--
-- Name: report_resolutions report_resolutions_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_resolutions
    ADD CONSTRAINT report_resolutions_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE CASCADE;


--
-- Name: report_resolutions report_resolutions_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_resolutions
    ADD CONSTRAINT report_resolutions_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.accounts(id);


--
-- Name: reports reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.accounts(id);


--
-- Name: shops shops_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: support_tickets support_tickets_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict YM0HVt071pqpV33LU3ZXFs9Huho7WuozlIvMISHwjzwGXgDjDkAjcBxyixBJUHP

