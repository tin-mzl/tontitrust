// =============================================================================
// TONTITRUST BUSINESS RULES & TONTINE MANAGER
// PRD Rules: BR-001 to BR-025
// =============================================================================

import {
  TontineStatus,
  MembershipStatus,
  CycleStatus,
  ContributionStatus,
  ActorType,
  generateUUID
} from './models.js';
import { store } from './store.js';

export class TontineManager {
  /**
   * BR-001: Exactly one organizer per tontine
   * BR-019: Amount stored in minimal monetary units (amount_minor)
   */
  static createDraftTontine(organizerId, params) {
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('Le nom de la tontine est obligatoire.');
    }
    if (!params.amount_minor || params.amount_minor <= 0) {
      throw new Error('Le montant doit être strictement positif (BR-019).');
    }
    if (!params.member_limit || params.member_limit < 2 || params.member_limit > 50) {
      throw new Error('La capacité doit être comprise entre 2 et 50 membres (FR-GRP-002).');
    }

    const tontineId = generateUUID();
    const tontine = {
      id: tontineId,
      organizer_id: organizerId,
      name: params.name.trim(),
      description: params.description || '',
      amount_minor: parseInt(params.amount_minor, 10),
      currency: params.currency || 'CDF',
      frequency: params.frequency || 'WEEKLY',
      member_limit: parseInt(params.member_limit, 10),
      grace_period_hours: parseInt(params.grace_period_hours || 24, 10),
      timezone: params.timezone || 'Africa/Kinshasa',
      order_mode: params.order_mode || 'MANUAL',
      status: TontineStatus.DRAFT,
      start_date: params.start_date || new Date().toISOString().split('T')[0],
      locked_at: null,
      created_at: new Date().toISOString()
    };

    // Auto-add organizer as first approved membership
    const membership = {
      id: generateUUID(),
      tontine_id: tontineId,
      user_id: organizerId,
      position: 1,
      status: MembershipStatus.APPROVED,
      rules_version: 1,
      payout_phone: store.state.currentUser ? store.state.currentUser.phone_e164 : '+243900000001',
      joined_at: new Date().toISOString()
    };

    store.state.tontines.unshift(tontine);
    store.state.memberships.push(membership);

    store.logAudit(ActorType.USER, 'tontine.created', 'tontine', tontineId, null, tontine);
    store.saveState();
    return tontine;
  }

  /**
   * Transition DRAFT -> RECRUITING and generate invitation code
   */
  static publishTontine(tontineId) {
    const tontine = store.state.tontines.find(t => t.id === tontineId);
    if (!tontine) throw new Error('Tontine introuvable.');
    if (tontine.status !== TontineStatus.DRAFT) {
      throw new Error('Seule une tontine en brouillon peut être publiée.');
    }

    tontine.status = TontineStatus.RECRUITING;
    const invCode = 'TT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const invitation = {
      id: generateUUID(),
      tontine_id: tontineId,
      code: invCode,
      link_token: 'link_' + generateUUID(),
      expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    store.state.invitations.push(invitation);
    store.logAudit(ActorType.USER, 'tontine.published', 'tontine', tontineId, { status: TontineStatus.DRAFT }, { status: TontineStatus.RECRUITING, code: invCode });
    store.saveState();
    return { tontine, invitation };
  }

  /**
   * BR-002: One active position per tontine
   * BR-003: Max capacity respected atomically
   */
  static requestMembership(tontineId, userId, payoutPhone) {
    const tontine = store.state.tontines.find(t => t.id === tontineId);
    if (!tontine) throw new Error('Tontine introuvable.');
    if (tontine.status !== TontineStatus.RECRUITING) {
      throw new Error('Cette tontine n\'est pas ouverte aux adhésions.');
    }

    const existing = store.state.memberships.find(m => m.tontine_id === tontineId && m.user_id === userId);
    if (existing) {
      throw new Error('Vous avez déjà une demande ou adhésion pour cette tontine (BR-002).');
    }

    const activeCount = store.state.memberships.filter(m => m.tontine_id === tontineId && ['APPROVED', 'ACTIVE'].includes(m.status)).length;
    if (activeCount >= tontine.member_limit) {
      throw new Error('La capacité maximale de cette tontine est déjà atteinte (BR-003).');
    }

    const membership = {
      id: generateUUID(),
      tontine_id: tontineId,
      user_id: userId,
      position: null,
      status: MembershipStatus.PENDING,
      rules_version: 1,
      payout_phone: payoutPhone,
      joined_at: new Date().toISOString()
    };

    store.state.memberships.push(membership);
    store.logAudit(ActorType.USER, 'membership.requested', 'membership', membership.id, null, membership);
    store.addNotification(tontine.organizer_id, 'Nouvelle demande d\'adhésion', `Un membre souhaite rejoindre "${tontine.name}".`, 'membership.requested');
    store.saveState();
    return membership;
  }

  /**
   * Approve a pending member
   */
  static approveMembership(organizerId, membershipId) {
    const membership = store.state.memberships.find(m => m.id === membershipId);
    if (!membership) throw new Error('Adhésion introuvable.');
    const tontine = store.state.tontines.find(t => t.id === membership.tontine_id);
    if (!tontine || tontine.organizer_id !== organizerId) {
      throw new Error('Seul l\'organisateur peut approuver un membre.');
    }

    membership.status = MembershipStatus.APPROVED;
    store.logAudit(ActorType.USER, 'membership.approved', 'membership', membership.id, null, { status: MembershipStatus.APPROVED });
    store.addNotification(membership.user_id, 'Adhésion approuvée !', `Votre participation à "${tontine.name}" a été validée.`, 'membership.approved');
    store.saveState();
    return membership;
  }

  /**
   * BR-004: Lock rotation order and parameters before activation
   */
  static lockTontine(organizerId, tontineId) {
    const tontine = store.state.tontines.find(t => t.id === tontineId);
    if (!tontine) throw new Error('Tontine introuvable.');
    if (tontine.organizer_id !== organizerId) {
      throw new Error('Seul l\'organisateur peut verrouiller la tontine.');
    }

    const approvedMembers = store.state.memberships.filter(m => m.tontine_id === tontineId && m.status === MembershipStatus.APPROVED);
    if (approvedMembers.length !== tontine.member_limit) {
      throw new Error(`La tontine nécessite exactement ${tontine.member_limit} membres approuvés (${approvedMembers.length} actuels) (FR-GRP-006).`);
    }

    // Assign positions 1..N
    approvedMembers.forEach((m, idx) => {
      m.position = idx + 1;
    });

    tontine.locked_at = new Date().toISOString();
    tontine.status = TontineStatus.READY;

    store.logAudit(ActorType.USER, 'tontine.locked', 'tontine', tontineId, null, { status: TontineStatus.READY, locked_at: tontine.locked_at });
    store.saveState();
    return tontine;
  }

  /**
   * BR-006 & BR-007 & BR-008:
   * Activate tontine, generate all N cycles, assign 1 unique beneficiary per cycle,
   * and create expected contribution records for every member in every cycle.
   */
  static activateTontine(tontineId) {
    const tontine = store.state.tontines.find(t => t.id === tontineId);
    if (!tontine) throw new Error('Tontine introuvable.');
    if (tontine.status !== TontineStatus.READY && tontine.status !== TontineStatus.RECRUITING) {
      throw new Error('La tontine doit être prête ou verrouillée pour être activée.');
    }

    const members = store.state.memberships.filter(m => m.tontine_id === tontineId && ['APPROVED', 'ACTIVE'].includes(m.status));
    if (members.length !== tontine.member_limit) {
      throw new Error(`Nombre de membres insuffisant : ${members.length}/${tontine.member_limit} (BR-006).`);
    }

    // Ensure positions are assigned
    members.forEach((m, idx) => {
      m.position = m.position || (idx + 1);
      m.status = MembershipStatus.ACTIVE;
    });

    // Sort by rotation order position
    members.sort((a, b) => a.position - b.position);

    const startDate = new Date(tontine.start_date || new Date());
    const intervalDays = tontine.frequency === 'MONTHLY' ? 30 : tontine.frequency === 'BIWEEKLY' ? 14 : 7;

    // Generate N cycles
    for (let i = 0; i < members.length; i++) {
      const cycleDueDate = new Date(startDate.getTime() + (i + 1) * intervalDays * 24 * 3600 * 1000);
      const cycleId = generateUUID();

      const cycle = {
        id: cycleId,
        tontine_id: tontineId,
        cycle_number: i + 1,
        beneficiary_membership_id: members[i].id,
        due_at: cycleDueDate.toISOString(),
        status: i === 0 ? CycleStatus.COLLECTING : CycleStatus.SCHEDULED,
        completed_at: null,
        created_at: new Date().toISOString()
      };
      store.state.cycles.push(cycle);

      // Expected contribution for each member in this cycle
      for (const member of members) {
        const contribution = {
          id: generateUUID(),
          cycle_id: cycleId,
          member_id: member.id,
          amount_due_minor: tontine.amount_minor,
          status: ContributionStatus.PENDING,
          paid_at: null,
          waived_reason: null,
          created_at: new Date().toISOString()
        };
        store.state.contributions.push(contribution);
      }
    }

    tontine.status = TontineStatus.ACTIVE;
    store.logAudit(ActorType.USER, 'tontine.activated', 'tontine', tontineId, null, {
      status: TontineStatus.ACTIVE,
      cycles_count: members.length,
      gross_amount_per_cycle: tontine.amount_minor * members.length
    });

    // Notify all members
    members.forEach(m => {
      store.addNotification(m.user_id, 'Tontine Démarrée !', `La tontine "${tontine.name}" est maintenant active. Consultez votre calendrier.`, 'tontine.activated');
    });

    store.saveState();
    return tontine;
  }

  /**
   * FR-PAYOUT-001: Payout eligibility calculation
   * Cycle is ELIGIBLE only when ALL expected contributions are PAID or WAIVED.
   * Any contribution in PROCESSING blocks payout.
   */
  static evaluatePayoutEligibility(cycleId) {
    const cycle = store.state.cycles.find(c => c.id === cycleId);
    if (!cycle) throw new Error('Cycle introuvable.');

    const contributions = store.state.contributions.filter(c => c.cycle_id === cycleId);
    if (contributions.length === 0) return { eligible: false, reason: 'NO_CONTRIBUTIONS' };

    const processingExists = contributions.some(c => c.status === ContributionStatus.PROCESSING);
    if (processingExists) {
      return { eligible: false, reason: 'CONTRIBUTIONS_IN_PROCESSING' };
    }

    const pendingOrFailedExists = contributions.some(c => [ContributionStatus.PENDING, ContributionStatus.FAILED, ContributionStatus.OVERDUE].includes(c.status));
    if (pendingOrFailedExists) {
      return { eligible: false, reason: 'PENDING_OR_FAILED_CONTRIBUTIONS' };
    }

    const allResolved = contributions.every(c => [ContributionStatus.PAID, ContributionStatus.WAIVED].includes(c.status));
    if (allResolved && cycle.status !== CycleStatus.COMPLETED) {
      cycle.status = CycleStatus.ELIGIBLE;
      store.saveState();
      return { eligible: true, status: CycleStatus.ELIGIBLE };
    }

    return { eligible: false, status: cycle.status };
  }

  /**
   * Admin suspend group (BR-013 & BR-018)
   */
  static suspendTontine(adminId, tontineId, reason) {
    if (!reason || reason.trim().length < 5) {
      throw new Error('Un motif détaillé est obligatoire pour suspendre un groupe (BR-018).');
    }
    const tontine = store.state.tontines.find(t => t.id === tontineId);
    if (!tontine) throw new Error('Tontine introuvable.');

    const oldStatus = tontine.status;
    tontine.status = TontineStatus.PAUSED;

    store.logAudit(ActorType.ADMIN, 'tontine.paused', 'tontine', tontineId, { status: oldStatus }, { status: TontineStatus.PAUSED, reason });
    store.saveState();
    return tontine;
  }
}
