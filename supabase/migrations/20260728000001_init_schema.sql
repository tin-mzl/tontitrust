-- =============================================================================
-- TONTITRUST DATABASE SCHEMA (PostgreSQL / Supabase Migration)
-- PRD & TSD Reference: TT-PRD-TSD-001 v1.0
-- Date: 2026-07-28
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. ENUM TYPES
-- =============================================================================
CREATE TYPE user_status_enum AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'CLOSED');
CREATE TYPE kyc_status_enum AS ENUM ('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE tontine_status_enum AS ENUM ('DRAFT', 'RECRUITING', 'READY', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE frequency_enum AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM_TEST');
CREATE TYPE membership_status_enum AS ENUM ('INVITED', 'PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'REMOVED', 'REJECTED');
CREATE TYPE cycle_status_enum AS ENUM ('SCHEDULED', 'COLLECTING', 'ELIGIBLE', 'PAYING', 'COMPLETED', 'BLOCKED');
CREATE TYPE contribution_status_enum AS ENUM ('PENDING', 'INITIATED', 'PROCESSING', 'PAID', 'FAILED', 'OVERDUE', 'WAIVED', 'REFUNDED');
CREATE TYPE transaction_status_enum AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED');
CREATE TYPE payout_status_enum AS ENUM ('PENDING', 'ELIGIBLE', 'PROCESSING', 'PAID', 'FAILED', 'REVERSED');
CREATE TYPE ledger_direction_enum AS ENUM ('DEBIT', 'CREDIT');
CREATE TYPE ledger_ref_type_enum AS ENUM ('PAYMENT', 'PAYOUT', 'REFUND', 'ADJUSTMENT');
CREATE TYPE actor_type_enum AS ENUM ('USER', 'ADMIN', 'SYSTEM');
CREATE TYPE ticket_status_enum AS ENUM ('OPEN', 'IN_REVIEW', 'WAITING_USER', 'RESOLVED', 'REJECTED', 'CLOSED');
CREATE TYPE notif_channel_enum AS ENUM ('IN_APP', 'SMS', 'EMAIL', 'PUSH');

-- =============================================================================
-- 2. CORE IDENTITY & PROFILES
-- =============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,
    phone_e164 VARCHAR(20) NOT NULL UNIQUE,
    status user_status_enum NOT NULL DEFAULT 'PENDING_VERIFICATION',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(120) NOT NULL,
    city VARCHAR(80) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'fr',
    avatar_url TEXT,
    date_of_birth DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_profile UNIQUE (user_id)
);

CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cgu_version VARCHAR(20) NOT NULL,
    privacy_version VARCHAR(20) NOT NULL,
    ip_hash VARCHAR(64) NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE kyc_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kyc_level SMALLINT NOT NULL DEFAULT 1,
    status kyc_status_enum NOT NULL DEFAULT 'NOT_STARTED',
    provider VARCHAR(50) DEFAULT 'INTERNAL_PILOT',
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_kyc_profile UNIQUE (user_id)
);

CREATE TABLE kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kyc_profile_id UUID NOT NULL REFERENCES kyc_profiles(id) ON DELETE CASCADE,
    doc_type VARCHAR(50) NOT NULL,
    storage_path TEXT NOT NULL,
    file_hash VARCHAR(64),
    status VARCHAR(30) NOT NULL DEFAULT 'UPLOADED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 3. TONTINES & GOVERNANCE
-- =============================================================================
CREATE TABLE tontines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(80) NOT NULL,
    description TEXT,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency CHAR(3) NOT NULL DEFAULT 'CDF',
    frequency frequency_enum NOT NULL DEFAULT 'WEEKLY',
    member_limit SMALLINT NOT NULL CHECK (member_limit BETWEEN 2 AND 50),
    grace_period_hours INT NOT NULL DEFAULT 24 CHECK (grace_period_hours >= 0 AND grace_period_hours <= 168),
    timezone VARCHAR(50) NOT NULL DEFAULT 'Africa/Kinshasa',
    order_mode VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
    status tontine_status_enum NOT NULL DEFAULT 'DRAFT',
    start_date DATE NOT NULL,
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE tontine_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tontine_id UUID NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    standard_rules_accepted BOOLEAN NOT NULL DEFAULT TRUE,
    custom_clauses TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tontine_rule_version UNIQUE (tontine_id, version)
);

CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tontine_id UUID NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    position SMALLINT,
    rules_version INT NOT NULL DEFAULT 1,
    status membership_status_enum NOT NULL DEFAULT 'PENDING',
    payout_destination_phone VARCHAR(20),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tontine_user UNIQUE (tontine_id, user_id),
    CONSTRAINT uq_tontine_position UNIQUE (tontine_id, position)
);

CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tontine_id UUID NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL UNIQUE,
    link_token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 4. CYCLES & CONTRIBUTIONS
-- =============================================================================
CREATE TABLE cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tontine_id UUID NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
    cycle_number SMALLINT NOT NULL CHECK (cycle_number > 0),
    beneficiary_membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT,
    due_at TIMESTAMPTZ NOT NULL,
    status cycle_status_enum NOT NULL DEFAULT 'SCHEDULED',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tontine_cycle_num UNIQUE (tontine_id, cycle_number)
);

CREATE TABLE contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT,
    amount_due_minor BIGINT NOT NULL CHECK (amount_due_minor > 0),
    status contribution_status_enum NOT NULL DEFAULT 'PENDING',
    paid_at TIMESTAMPTZ,
    waived_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cycle_member_contrib UNIQUE (cycle_id, member_id)
);

-- =============================================================================
-- 5. PAYMENTS, WEBHOOKS & LEDGER
-- =============================================================================
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    token VARCHAR(255) NOT NULL,
    account_masked VARCHAR(50) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contribution_id UUID NOT NULL REFERENCES contributions(id) ON DELETE RESTRICT,
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL DEFAULT 'SIMULATOR',
    provider_reference VARCHAR(128),
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency CHAR(3) NOT NULL DEFAULT 'CDF',
    raw_status VARCHAR(50),
    status transaction_status_enum NOT NULL DEFAULT 'PENDING',
    error_code VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    provider_event_id VARCHAR(128) NOT NULL,
    event_type VARCHAR(80) NOT NULL,
    payload_json JSONB NOT NULL,
    signature VARCHAR(255),
    processed_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_provider_webhook UNIQUE (provider, provider_event_id)
);

CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE RESTRICT UNIQUE,
    beneficiary_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency CHAR(3) NOT NULL DEFAULT 'CDF',
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL DEFAULT 'SIMULATOR',
    provider_reference VARCHAR(128),
    status payout_status_enum NOT NULL DEFAULT 'PENDING',
    paid_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ledger_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'CDF',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES payment_transactions(id) ON DELETE RESTRICT,
    payout_id UUID REFERENCES payouts(id) ON DELETE RESTRICT,
    account_id UUID NOT NULL REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
    direction ledger_direction_enum NOT NULL,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency CHAR(3) NOT NULL DEFAULT 'CDF',
    reference_type ledger_ref_type_enum NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 6. NOTIFICATIONS, SUPPORT & AUDIT
-- =============================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    action_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    channel notif_channel_enum NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'QUEUED',
    provider_message_id VARCHAR(100),
    sent_at TIMESTAMPTZ,
    error_message TEXT
);

CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    tontine_id UUID REFERENCES tontines(id) ON DELETE SET NULL,
    cycle_id UUID REFERENCES cycles(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status ticket_status_enum NOT NULL DEFAULT 'OPEN',
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    sender_role VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    attachment_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_type actor_type_enum NOT NULL DEFAULT 'USER',
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    before_json JSONB,
    after_json JSONB,
    ip_hash VARCHAR(64),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action_type VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    target_entity_type VARCHAR(50) NOT NULL,
    target_entity_id VARCHAR(64) NOT NULL,
    approval_status VARCHAR(30) NOT NULL DEFAULT 'EXECUTED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE app_config (
    key VARCHAR(80) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE feature_flags (
    key VARCHAR(80) PRIMARY KEY,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    rollout_percentage SMALLINT NOT NULL DEFAULT 0,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_name VARCHAR(80) NOT NULL,
    properties_json JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 7. INDEXES
-- =============================================================================
CREATE INDEX idx_users_phone ON users(phone_e164);
CREATE INDEX idx_tontines_status ON tontines(status);
CREATE INDEX idx_tontines_organizer ON tontines(organizer_id);
CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_tontine ON memberships(tontine_id);
CREATE INDEX idx_cycles_due_at ON cycles(due_at);
CREATE INDEX idx_cycles_status ON cycles(status);
CREATE INDEX idx_contributions_status ON contributions(status);
CREATE INDEX idx_transactions_status ON payment_transactions(status);
CREATE INDEX idx_transactions_provider_ref ON payment_transactions(provider_reference);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- =============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontines ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY users_self_read ON users FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY profiles_self_read ON user_profiles FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY profiles_self_update ON user_profiles FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Members can view their tontines
CREATE POLICY tontines_member_read ON tontines FOR SELECT USING (
    id IN (SELECT tontine_id FROM memberships WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()))
    OR organizer_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Memberships visibility
CREATE POLICY memberships_group_read ON memberships FOR SELECT USING (
    tontine_id IN (SELECT tontine_id FROM memberships WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()))
);

-- Contributions visibility
CREATE POLICY contributions_member_read ON contributions FOR SELECT USING (
    member_id IN (SELECT id FROM memberships WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()))
    OR cycle_id IN (SELECT c.id FROM cycles c JOIN tontines t ON c.tontine_id = t.id WHERE t.organizer_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()))
);

-- Notifications
CREATE POLICY notifs_self ON notifications FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Audit logs (Read-only for Admins & Auditors)
CREATE POLICY audit_admin_read ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND status = 'ACTIVE')
);
