-- =============================================================================
-- TONTITRUST SEED DATA
-- PRD Section 21.2 & 21.3 Test Dataset
-- =============================================================================

-- 1. Base Ledger Accounts
INSERT INTO ledger_accounts (id, code, name, type, currency) VALUES
('11111111-0000-0000-0000-000000000001', 'TRANSIT_COLLECTION', 'Compte Transit Encaissement Membres', 'ASSET', 'CDF'),
('11111111-0000-0000-0000-000000000002', 'TRANSIT_PAYOUT', 'Compte Transit Décaissement Bénéficiaires', 'LIABILITY', 'CDF'),
('11111111-0000-0000-0000-000000000003', 'PLATFORM_FEES', 'Compte Produits Frais TontiTrust', 'REVENUE', 'CDF');

-- 2. Test Users & Profiles (PRD §21.2)
-- Admin
INSERT INTO users (id, phone_e164, status) VALUES 
('a0000000-0000-0000-0000-000000000000', '+243900000000', 'ACTIVE');
INSERT INTO user_profiles (user_id, full_name, city, language) VALUES 
('a0000000-0000-0000-0000-000000000000', 'Admin TontiTrust', 'Kinshasa', 'fr');

-- Support
INSERT INTO users (id, phone_e164, status) VALUES 
('a0000000-0000-0000-0000-000000000099', '+243900000099', 'ACTIVE');
INSERT INTO user_profiles (user_id, full_name, city, language) VALUES 
('a0000000-0000-0000-0000-000000000099', 'Support Technique', 'Kinshasa', 'fr');

-- Organisateur : Amina Kabangu
INSERT INTO users (id, phone_e164, status) VALUES 
('u0000000-0000-0000-0000-000000000001', '+243900000001', 'ACTIVE');
INSERT INTO user_profiles (user_id, full_name, city, language) VALUES 
('u0000000-0000-0000-0000-000000000001', 'Amina Kabangu', 'Kinshasa', 'fr');
INSERT INTO kyc_profiles (user_id, kyc_level, status) VALUES 
('u0000000-0000-0000-0000-000000000001', 2, 'VERIFIED');

-- Membre 1 : Patrick Mukendi (Paiement réussi)
INSERT INTO users (id, phone_e164, status) VALUES 
('u0000000-0000-0000-0000-000000000002', '+243900000002', 'ACTIVE');
INSERT INTO user_profiles (user_id, full_name, city, language) VALUES 
('u0000000-0000-0000-0000-000000000002', 'Patrick Mukendi', 'Lubumbashi', 'fr');

-- Membre 2 : Chantal Ntumba (Paiement échoué puis réussi)
INSERT INTO users (id, phone_e164, status) VALUES 
('u0000000-0000-0000-0000-000000000003', '+243900000003', 'ACTIVE');
INSERT INTO user_profiles (user_id, full_name, city, language) VALUES 
('u0000000-0000-0000-0000-000000000003', 'Chantal Ntumba', 'Kinshasa', 'fr');

-- Membre 3 : Junior Boketshu (Bénéficiaire cycle 1)
INSERT INTO users (id, phone_e164, status) VALUES 
('u0000000-0000-0000-0000-000000000004', '+243900000004', 'ACTIVE');
INSERT INTO user_profiles (user_id, full_name, city, language) VALUES 
('u0000000-0000-0000-0000-000000000004', 'Junior Boketshu', 'Matadi', 'fr');

-- Membre 4 : David Lukusa
INSERT INTO users (id, phone_e164, status) VALUES 
('u0000000-0000-0000-0000-000000000005', '+243900000005', 'ACTIVE');
INSERT INTO user_profiles (user_id, full_name, city, language) VALUES 
('u0000000-0000-0000-0000-000000000005', 'David Lukusa', 'Goma', 'fr');

-- Membre 5 : Sarah Malula
INSERT INTO users (id, phone_e164, status) VALUES 
('u0000000-0000-0000-0000-000000000006', '+243900000006', 'ACTIVE');
INSERT INTO user_profiles (user_id, full_name, city, language) VALUES 
('u0000000-0000-0000-0000-000000000006', 'Sarah Malula', 'Kinshasa', 'fr');

-- Membre 6 : Erick Kasongo
INSERT INTO users (id, phone_e164, status) VALUES 
('u0000000-0000-0000-0000-000000000007', '+243900000007', 'ACTIVE');
INSERT INTO user_profiles (user_id, full_name, city, language) VALUES 
('u0000000-0000-0000-0000-000000000007', 'Erick Kasongo', 'Kolwezi', 'fr');

-- Membre 7 : Grace Tshilombo
INSERT INTO users (id, phone_e164, status) VALUES 
('u0000000-0000-0000-0000-000000000008', '+243900000008', 'ACTIVE');
INSERT INTO user_profiles (user_id, full_name, city, language) VALUES 
('u0000000-0000-0000-0000-000000000008', 'Grace Tshilombo', 'Kinshasa', 'fr');

-- 3. Tontine Active de référence : Tontine Solidarité Matonge
INSERT INTO tontines (
    id, organizer_id, name, description, amount_minor, currency, frequency, member_limit, 
    grace_period_hours, timezone, status, start_date, locked_at
) VALUES (
    't0000000-0000-0000-0000-000000000001',
    'u0000000-0000-0000-0000-000000000001',
    'Tontine Solidarité Matonge',
    'Épargne solidaire commerçants du marché Matonge',
    2500000, -- 25,000 CDF
    'CDF',
    'WEEKLY',
    4,
    24,
    'Africa/Kinshasa',
    'ACTIVE',
    '2026-07-01',
    '2026-06-30 18:00:00+01'
);

-- Memberships for Tontine Solidarité Matonge
INSERT INTO memberships (id, tontine_id, user_id, position, status, payout_destination_phone) VALUES
('m0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', 1, 'ACTIVE', '+243900000001'),
('m0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000002', 2, 'ACTIVE', '+243900000002'),
('m0000000-0000-0000-0000-000000000003', 't0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000003', 3, 'ACTIVE', '+243900000003'),
('m0000000-0000-0000-0000-000000000004', 't0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000004', 4, 'ACTIVE', '+243900000004');

-- Invitations
INSERT INTO invitations (tontine_id, code, link_token, expires_at, status) VALUES
('t0000000-0000-0000-0000-000000000001', 'MATONGE26', 'inv_matonge_token_xyz', '2026-12-31 23:59:59+01', 'EXPIRED');

-- Audit Log de démarrage
INSERT INTO audit_logs (actor_id, actor_type, action, entity_type, entity_id, after_json) VALUES
('u0000000-0000-0000-0000-000000000001', 'USER', 'tontine.activated', 'tontine', 't0000000-0000-0000-0000-000000000001', '{"status":"ACTIVE","members_count":4}'::jsonb);

-- Initial App Config & Feature Flags
INSERT INTO app_config (key, value, description) VALUES
('system.maintenance', 'false'::jsonb, 'Mode maintenance global'),
('system.default_currency', '"CDF"'::jsonb, 'Devise par défaut'),
('limits.max_amount_cdf', '500000000'::jsonb, 'Montant max par cycle en CDF');

INSERT INTO feature_flags (key, is_enabled, rollout_percentage, description) VALUES
('sms_notifications', true, 100, 'Envoi de notifications SMS'),
('mobile_money_simulator', true, 100, 'Passerelle simulateur Mobile Money'),
('pdf_receipt_export', true, 100, 'Téléchargement de reçus PDF');
