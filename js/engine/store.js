// =============================================================================
// TONTITRUST REACTIVE STORE & PERSISTENCE
// PRD Reference: TT-PRD-TSD-001 v1.0
// =============================================================================

import {
  UserStatus,
  TontineStatus,
  Frequency,
  MembershipStatus,
  CycleStatus,
  ContributionStatus,
  TransactionStatus,
  PayoutStatus,
  ActorType,
  TicketStatus,
  generateUUID
} from './models.js';

const STORAGE_KEY = 'tontitrust_db_v1';

export function getInitialSeedData() {
  const users = [
    { id: 'u001', phone_e164: '+243900000001', name: 'Amina Kabangu', city: 'Kinshasa', role: 'ORGANIZER', status: UserStatus.ACTIVE, kycLevel: 2 },
    { id: 'u002', phone_e164: '+243900000002', name: 'Patrick Mukendi', city: 'Lubumbashi', role: 'MEMBER', status: UserStatus.ACTIVE, kycLevel: 1 },
    { id: 'u003', phone_e164: '+243900000003', name: 'Chantal Ntumba', city: 'Kinshasa', role: 'MEMBER', status: UserStatus.ACTIVE, kycLevel: 1 },
    { id: 'u004', phone_e164: '+243900000004', name: 'Junior Boketshu', city: 'Matadi', role: 'MEMBER', status: UserStatus.ACTIVE, kycLevel: 1 },
    { id: 'u005', phone_e164: '+243900000005', name: 'David Lukusa', city: 'Goma', role: 'MEMBER', status: UserStatus.ACTIVE, kycLevel: 1 },
    { id: 'u006', phone_e164: '+243900000006', name: 'Sarah Malula', city: 'Kinshasa', role: 'MEMBER', status: UserStatus.ACTIVE, kycLevel: 1 },
    { id: 'u007', phone_e164: '+243900000007', name: 'Erick Kasongo', city: 'Kolwezi', role: 'MEMBER', status: UserStatus.ACTIVE, kycLevel: 1 },
    { id: 'u008', phone_e164: '+243900000008', name: 'Grace Tshilombo', city: 'Kinshasa', role: 'MEMBER', status: UserStatus.ACTIVE, kycLevel: 1 },
    { id: 'admin001', phone_e164: '+243900000000', name: 'Admin TontiTrust', city: 'Kinshasa', role: 'ADMIN', status: UserStatus.ACTIVE, kycLevel: 3 },
    { id: 'sup001', phone_e164: '+243900000099', name: 'Support Technique', city: 'Kinshasa', role: 'SUPPORT', status: UserStatus.ACTIVE, kycLevel: 2 }
  ];

  const tontines = [
    {
      id: 't001',
      name: 'Tontine Solidarité Matonge',
      description: 'Épargne solidaire commerçants du marché Matonge',
      organizer_id: 'u001',
      amount_minor: 2500000, // 25,000 CDF
      currency: 'CDF',
      frequency: Frequency.WEEKLY,
      member_limit: 4,
      grace_period_hours: 24,
      timezone: 'Africa/Kinshasa',
      order_mode: 'MANUAL',
      status: TontineStatus.ACTIVE,
      start_date: '2026-07-01',
      locked_at: '2026-06-30T18:00:00Z',
      created_at: '2026-06-25T10:00:00Z'
    },
    {
      id: 't002',
      name: 'Tontine Entrepreneures Gombe',
      description: 'Groupe d\'investissement femmes d\'affaires',
      organizer_id: 'u001',
      amount_minor: 5000000, // 50,000 CDF
      currency: 'CDF',
      frequency: Frequency.MONTHLY,
      member_limit: 8,
      grace_period_hours: 48,
      timezone: 'Africa/Kinshasa',
      order_mode: 'RANDOM',
      status: TontineStatus.RECRUITING,
      start_date: '2026-08-01',
      created_at: '2026-07-10T14:30:00Z'
    },
    {
      id: 't003',
      name: 'Projet Achat Équipement Moto',
      description: 'Collecte pour acquisition de deux roues',
      organizer_id: 'u002',
      amount_minor: 10000000, // 100,000 CDF
      currency: 'CDF',
      frequency: Frequency.BIWEEKLY,
      member_limit: 5,
      grace_period_hours: 24,
      timezone: 'Africa/Kinshasa',
      order_mode: 'MANUAL',
      status: TontineStatus.DRAFT,
      start_date: '2026-09-01',
      created_at: '2026-07-20T09:00:00Z'
    }
  ];

  const memberships = [
    { id: 'm001', tontine_id: 't001', user_id: 'u001', position: 1, status: MembershipStatus.ACTIVE, rules_version: 1, payout_phone: '+243900000001' },
    { id: 'm002', tontine_id: 't001', user_id: 'u002', position: 2, status: MembershipStatus.ACTIVE, rules_version: 1, payout_phone: '+243900000002' },
    { id: 'm003', tontine_id: 't001', user_id: 'u003', position: 3, status: MembershipStatus.ACTIVE, rules_version: 1, payout_phone: '+243900000003' },
    { id: 'm004', tontine_id: 't001', user_id: 'u004', position: 4, status: MembershipStatus.ACTIVE, rules_version: 1, payout_phone: '+243900000004' },
    { id: 'm005', tontine_id: 't002', user_id: 'u001', position: null, status: MembershipStatus.APPROVED, rules_version: 1, payout_phone: '+243900000001' },
    { id: 'm006', tontine_id: 't002', user_id: 'u005', position: null, status: MembershipStatus.APPROVED, rules_version: 1, payout_phone: '+243900000005' },
    { id: 'm007', tontine_id: 't002', user_id: 'u006', position: null, status: MembershipStatus.PENDING, rules_version: 1, payout_phone: '+243900000006' }
  ];

  const invitations = [
    { id: 'inv001', tontine_id: 't001', code: 'MATONGE26', link_token: 'link_matonge_2026', expires_at: '2026-12-31T23:59:59Z', status: 'ACTIVE' },
    { id: 'inv002', tontine_id: 't002', code: 'GOMBE2026', link_token: 'link_gombe_2026', expires_at: '2026-12-31T23:59:59Z', status: 'ACTIVE' }
  ];

  const cycles = [
    { id: 'c001', tontine_id: 't001', cycle_number: 1, beneficiary_membership_id: 'm001', due_at: '2026-07-08T18:00:00Z', status: CycleStatus.COMPLETED, completed_at: '2026-07-08T19:00:00Z' },
    { id: 'c002', tontine_id: 't001', cycle_number: 2, beneficiary_membership_id: 'm002', due_at: '2026-07-15T18:00:00Z', status: CycleStatus.COMPLETED, completed_at: '2026-07-15T19:30:00Z' },
    { id: 'c003', tontine_id: 't001', cycle_number: 3, beneficiary_membership_id: 'm003', due_at: '2026-07-22T18:00:00Z', status: CycleStatus.COLLECTING, completed_at: null },
    { id: 'c004', tontine_id: 't001', cycle_number: 4, beneficiary_membership_id: 'm004', due_at: '2026-07-29T18:00:00Z', status: CycleStatus.SCHEDULED, completed_at: null }
  ];

  const contributions = [
    // Cycle 1 contributions (all paid)
    { id: 'ct001', cycle_id: 'c001', member_id: 'm001', amount_due_minor: 2500000, status: ContributionStatus.PAID, paid_at: '2026-07-05T10:00:00Z' },
    { id: 'ct002', cycle_id: 'c001', member_id: 'm002', amount_due_minor: 2500000, status: ContributionStatus.PAID, paid_at: '2026-07-06T11:20:00Z' },
    { id: 'ct003', cycle_id: 'c001', member_id: 'm003', amount_due_minor: 2500000, status: ContributionStatus.PAID, paid_at: '2026-07-07T14:40:00Z' },
    { id: 'ct004', cycle_id: 'c001', member_id: 'm004', amount_due_minor: 2500000, status: ContributionStatus.PAID, paid_at: '2026-07-08T09:15:00Z' },
    // Cycle 2 contributions (all paid)
    { id: 'ct005', cycle_id: 'c002', member_id: 'm001', amount_due_minor: 2500000, status: ContributionStatus.PAID, paid_at: '2026-07-12T10:00:00Z' },
    { id: 'ct006', cycle_id: 'c002', member_id: 'm002', amount_due_minor: 2500000, status: ContributionStatus.PAID, paid_at: '2026-07-13T11:00:00Z' },
    { id: 'ct007', cycle_id: 'c002', member_id: 'm003', amount_due_minor: 2500000, status: ContributionStatus.PAID, paid_at: '2026-07-14T15:00:00Z' },
    { id: 'ct008', cycle_id: 'c002', member_id: 'm004', amount_due_minor: 2500000, status: ContributionStatus.PAID, paid_at: '2026-07-15T12:00:00Z' },
    // Cycle 3 contributions (in progress: 2 paid, 1 pending, 1 overdue)
    { id: 'ct009', cycle_id: 'c003', member_id: 'm001', amount_due_minor: 2500000, status: ContributionStatus.PAID, paid_at: '2026-07-20T09:30:00Z' },
    { id: 'ct010', cycle_id: 'c003', member_id: 'm002', amount_due_minor: 2500000, status: ContributionStatus.PAID, paid_at: '2026-07-21T10:15:00Z' },
    { id: 'ct011', cycle_id: 'c003', member_id: 'm003', amount_due_minor: 2500000, status: ContributionStatus.PENDING, paid_at: null },
    { id: 'ct012', cycle_id: 'c003', member_id: 'm004', amount_due_minor: 2500000, status: ContributionStatus.OVERDUE, paid_at: null }
  ];

  const transactions = [
    { id: 'tx001', contribution_id: 'ct001', idempotency_key: 'idemp_tx001', provider: 'M-PESA', provider_reference: 'MPESA_98234710', amount_minor: 2500000, currency: 'CDF', status: TransactionStatus.SUCCEEDED, created_at: '2026-07-05T10:00:00Z' },
    { id: 'tx002', contribution_id: 'ct002', idempotency_key: 'idemp_tx002', provider: 'ORANGE_MONEY', provider_reference: 'OM_11849201', amount_minor: 2500000, currency: 'CDF', status: TransactionStatus.SUCCEEDED, created_at: '2026-07-06T11:20:00Z' },
    { id: 'tx003', contribution_id: 'ct009', idempotency_key: 'idemp_tx009', provider: 'AIRTEL_MONEY', provider_reference: 'AM_77391022', amount_minor: 2500000, currency: 'CDF', status: TransactionStatus.SUCCEEDED, created_at: '2026-07-20T09:30:00Z' },
    { id: 'tx004', contribution_id: 'ct010', idempotency_key: 'idemp_tx010', provider: 'M-PESA', provider_reference: 'MPESA_38291044', amount_minor: 2500000, currency: 'CDF', status: TransactionStatus.SUCCEEDED, created_at: '2026-07-21T10:15:00Z' }
  ];

  const payouts = [
    { id: 'po001', cycle_id: 'c001', beneficiary_id: 'u001', amount_minor: 10000000, currency: 'CDF', idempotency_key: 'idemp_payout_c001', provider: 'M-PESA', provider_reference: 'PO_MPESA_001', status: PayoutStatus.PAID, paid_at: '2026-07-08T19:00:00Z' },
    { id: 'po002', cycle_id: 'c002', beneficiary_id: 'u002', amount_minor: 10000000, currency: 'CDF', idempotency_key: 'idemp_payout_c002', provider: 'ORANGE_MONEY', provider_reference: 'PO_OM_002', status: PayoutStatus.PAID, paid_at: '2026-07-15T19:30:00Z' }
  ];

  const ledger = [
    { id: 'lg001', transaction_id: 'tx001', direction: 'CREDIT', amount_minor: 2500000, currency: 'CDF', reference_type: 'PAYMENT', note: 'Cotisation Patrick Mukendi - Cycle 1', created_at: '2026-07-05T10:00:00Z' },
    { id: 'lg002', payout_id: 'po001', direction: 'DEBIT', amount_minor: 10000000, currency: 'CDF', reference_type: 'PAYOUT', note: 'Distribution Cagnotte Cycle 1 à Amina Kabangu', created_at: '2026-07-08T19:00:00Z' }
  ];

  const auditLogs = [
    { id: 'aud001', actor_id: 'u001', actor_type: ActorType.USER, action: 'tontine.created', entity_type: 'tontine', entity_id: 't001', after_json: { name: 'Tontine Solidarité Matonge' }, created_at: '2026-06-25T10:00:00Z' },
    { id: 'aud002', actor_id: 'u001', actor_type: ActorType.USER, action: 'tontine.locked', entity_type: 'tontine', entity_id: 't001', after_json: { locked_at: '2026-06-30T18:00:00Z' }, created_at: '2026-06-30T18:00:00Z' },
    { id: 'aud003', actor_id: 'u001', actor_type: ActorType.USER, action: 'tontine.activated', entity_type: 'tontine', entity_id: 't001', after_json: { status: 'ACTIVE', cycles: 4 }, created_at: '2026-07-01T08:00:00Z' },
    { id: 'aud004', actor_id: 'admin001', actor_type: ActorType.ADMIN, action: 'admin.dashboard_viewed', entity_type: 'system', entity_id: 'global', after_json: { ip: '127.0.0.1' }, created_at: '2026-07-28T09:00:00Z' }
  ];

  const notifications = [
    { id: 'nt001', user_id: 'u001', title: 'Tontine Activée', message: 'Votre tontine "Tontine Solidarité Matonge" a démarré.', type: 'tontine.activated', is_read: true, created_at: '2026-07-01T08:00:00Z' },
    { id: 'nt002', user_id: 'u003', title: 'Rappel d\'échéance', message: 'Votre cotisation de 25 000 CDF pour le cycle 3 est due.', type: 'contribution.due_soon', is_read: false, created_at: '2026-07-21T08:00:00Z' },
    { id: 'nt003', user_id: 'u004', title: 'Retard de cotisation', message: 'Votre cotisation pour le cycle 3 est en retard. Période de grâce active.', type: 'contribution.overdue', is_read: false, created_at: '2026-07-23T08:00:00Z' }
  ];

  const supportTickets = [
    {
      id: 'st001',
      user_id: 'u004',
      tontine_id: 't001',
      category: 'Paiement',
      subject: 'Problème de validation M-Pesa',
      description: 'Mon débit a été effectué mais la cotisation est marquée en retard.',
      priority: 'HIGH',
      status: TicketStatus.IN_REVIEW,
      created_at: '2026-07-23T10:00:00Z'
    }
  ];

  return {
    currentUser: users[0],
    users,
    tontines,
    memberships,
    invitations,
    cycles,
    contributions,
    transactions,
    payouts,
    ledger,
    auditLogs,
    notifications,
    supportTickets
  };
}

class Store {
  constructor() {
    this.listeners = [];
    this.state = this.loadState();
  }

  loadState() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        return JSON.parse(serialized);
      }
    } catch (e) {
      console.warn('LocalStorage unavailable, using initial seed data', e);
    }
    const seed = getInitialSeedData();
    this.saveState(seed);
    return seed;
  }

  saveState(stateToSave) {
    const data = stateToSave || this.state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
    this.notify();
  }

  resetToSeed() {
    this.state = getInitialSeedData();
    this.saveState();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  setCurrentUser(userId) {
    const user = this.state.users.find(u => u.id === userId);
    if (user) {
      this.state.currentUser = user;
      this.saveState();
    }
  }

  logAudit(actorType, action, entityType, entityId, beforeJson = null, afterJson = null) {
    const log = {
      id: generateUUID(),
      actor_id: this.state.currentUser ? this.state.currentUser.id : null,
      actor_type: actorType,
      action,
      entity_type: entityType,
      entity_id: entityId,
      before_json: beforeJson,
      after_json: afterJson,
      created_at: new Date().toISOString()
    };
    this.state.auditLogs.unshift(log);
    this.saveState();
    return log;
  }

  addNotification(userId, title, message, type, actionUrl = null) {
    const notif = {
      id: generateUUID(),
      user_id: userId,
      title,
      message,
      type,
      action_url: actionUrl,
      is_read: false,
      created_at: new Date().toISOString()
    };
    this.state.notifications.unshift(notif);
    this.saveState();
    return notif;
  }
}

export const store = new Store();
