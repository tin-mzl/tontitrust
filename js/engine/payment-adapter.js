// =============================================================================
// TONTITRUST PAYMENT ADAPTER & SIMULATOR
// PRD Reference: FR-PAY-001 to FR-PAY-007, FR-PAYOUT-001 to 005
// =============================================================================

import {
  TransactionStatus,
  ContributionStatus,
  PayoutStatus,
  CycleStatus,
  ActorType,
  generateUUID,
  formatCurrency
} from './models.js';
import { store } from './store.js';
import { TontineManager } from './tontine-manager.js';

export class PaymentAdapter {
  /**
   * Initiate a contribution payment
   * BR-012: Idempotent processing
   */
  static initiateContributionPayment(contributionId, provider = 'M-PESA', idempotencyKey = null, simulateSuccess = true) {
    const contribution = store.state.contributions.find(c => c.id === contributionId);
    if (!contribution) throw new Error('Cotisation introuvable.');

    const cycle = store.state.cycles.find(c => c.id === contribution.cycle_id);
    const tontine = store.state.tontines.find(t => t.id === cycle.tontine_id);

    if (tontine.status === 'PAUSED') {
      throw new Error('Les paiements sont bloqués : la tontine est actuellement suspendue (BR-013).');
    }

    const idempKey = idempotencyKey || `idemp_contrib_${contributionId}_${Date.now()}`;

    // Check duplicate idempotency key (TC-004)
    const existingTx = store.state.transactions.find(t => t.idempotency_key === idempKey);
    if (existingTx) {
      return { transaction: existingTx, duplicated: true };
    }

    const txId = generateUUID();
    const providerRef = `${provider}_REF_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const transaction = {
      id: txId,
      contribution_id: contributionId,
      idempotency_key: idempKey,
      provider,
      provider_reference: providerRef,
      amount_minor: contribution.amount_due_minor,
      currency: tontine.currency,
      status: TransactionStatus.PROCESSING,
      error_code: null,
      error_message: null,
      created_at: new Date().toISOString()
    };

    contribution.status = ContributionStatus.PROCESSING;
    store.state.transactions.unshift(transaction);
    store.saveState();

    // Process simulation (synchronous simulation or webhook event)
    if (simulateSuccess) {
      transaction.status = TransactionStatus.SUCCEEDED;
      contribution.status = ContributionStatus.PAID;
      contribution.paid_at = new Date().toISOString();

      // Append-only ledger entry
      const ledgerEntry = {
        id: generateUUID(),
        transaction_id: txId,
        payout_id: null,
        direction: 'CREDIT',
        amount_minor: contribution.amount_due_minor,
        currency: tontine.currency,
        reference_type: 'PAYMENT',
        note: `Cotisation reçue via ${provider} (${providerRef})`,
        created_at: new Date().toISOString()
      };
      store.state.ledger.unshift(ledgerEntry);

      store.logAudit(ActorType.SYSTEM, 'payment.succeeded', 'payment_transaction', txId, null, {
        amount_minor: contribution.amount_due_minor,
        provider,
        provider_reference: providerRef
      });

      // Check if cycle is now ready for payout
      TontineManager.evaluatePayoutEligibility(cycle.id);
    } else {
      transaction.status = TransactionStatus.FAILED;
      transaction.error_code = 'INSUFFICIENT_FUNDS';
      transaction.error_message = 'Solde insuffisant ou rejet opérateur Mobile Money.';
      contribution.status = ContributionStatus.FAILED;

      store.logAudit(ActorType.SYSTEM, 'payment.failed', 'payment_transaction', txId, null, {
        error_code: transaction.error_code,
        provider
      });
    }

    store.saveState();
    return { transaction, contribution, receipt: simulateSuccess ? this.generateReceipt(transaction, contribution, cycle, tontine) : null };
  }

  /**
   * Handle incoming signed webhook (FR-PAY-003, BR-012)
   */
  static processWebhook(provider, providerEventId, payload) {
    // Check webhook deduplication (TC-005)
    const existing = store.state.auditLogs.find(l => l.action === 'payment.webhook_processed' && l.after_json && l.after_json.event_id === providerEventId);
    if (existing) {
      return { processed: false, reason: 'DUPLICATE_WEBHOOK_EVENT' };
    }

    store.logAudit(ActorType.SYSTEM, 'payment.webhook_processed', 'webhook', providerEventId, null, {
      event_id: providerEventId,
      provider,
      payload
    });

    return { processed: true, event_id: providerEventId };
  }

  /**
   * Initiate payout to the cycle beneficiary (FR-PAYOUT-001 to 005)
   * BR-011: Exactly one payout per cycle
   */
  static executePayout(cycleId, adminOrSystemId = 'SYSTEM') {
    const cycle = store.state.cycles.find(c => c.id === cycleId);
    if (!cycle) throw new Error('Cycle introuvable.');

    const tontine = store.state.tontines.find(t => t.id === cycle.tontine_id);
    if (tontine.status === 'PAUSED') {
      throw new Error('La distribution est bloquée : la tontine est actuellement suspendue (BR-013).');
    }

    // Check unique payout constraint (BR-011, TC-009)
    const existingPayout = store.state.payouts.find(p => p.cycle_id === cycleId);
    if (existingPayout && existingPayout.status === PayoutStatus.PAID) {
      throw new Error('Un versement a déjà été effectué pour ce cycle (BR-011).');
    }

    // Check eligibility
    const eligibility = TontineManager.evaluatePayoutEligibility(cycleId);
    if (!eligibility.eligible && cycle.status !== CycleStatus.ELIGIBLE) {
      throw new Error(`Cycle non éligible à la distribution : toutes les cotisations ne sont pas validées (${eligibility.reason || 'STATUT_INCORRECT'}).`);
    }

    const beneficiaryMembership = store.state.memberships.find(m => m.id === cycle.beneficiary_membership_id);
    const beneficiaryUser = store.state.users.find(u => u.id === beneficiaryMembership.user_id);

    const totalMembers = store.state.memberships.filter(m => m.tontine_id === tontine.id && ['APPROVED', 'ACTIVE'].includes(m.status)).length;
    const grossAmountMinor = tontine.amount_minor * totalMembers;

    const payoutId = generateUUID();
    const payoutRef = `PO_SIM_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const payout = {
      id: payoutId,
      cycle_id: cycleId,
      beneficiary_id: beneficiaryUser.id,
      amount_minor: grossAmountMinor,
      currency: tontine.currency,
      idempotency_key: `idemp_payout_${cycleId}`,
      provider: 'M-PESA',
      provider_reference: payoutRef,
      status: PayoutStatus.PAID,
      paid_at: new Date().toISOString(),
      failure_reason: null,
      created_at: new Date().toISOString()
    };

    store.state.payouts.unshift(payout);

    // Update cycle to completed
    cycle.status = CycleStatus.COMPLETED;
    cycle.completed_at = new Date().toISOString();

    // Advance next cycle to COLLECTING
    const nextCycle = store.state.cycles.find(c => c.tontine_id === tontine.id && c.cycle_number === cycle.cycle_number + 1);
    if (nextCycle) {
      nextCycle.status = CycleStatus.COLLECTING;
    } else {
      tontine.status = 'COMPLETED';
      store.logAudit(ActorType.SYSTEM, 'tontine.completed', 'tontine', tontine.id, null, { tontine_id: tontine.id });
    }

    // Append-only ledger debit entry
    const ledgerEntry = {
      id: generateUUID(),
      transaction_id: null,
      payout_id: payoutId,
      direction: 'DEBIT',
      amount_minor: grossAmountMinor,
      currency: tontine.currency,
      reference_type: 'PAYOUT',
      note: `Distribution cagnotte cycle #${cycle.cycle_number} à ${beneficiaryUser.name || beneficiaryUser.phone_e164}`,
      created_at: new Date().toISOString()
    };
    store.state.ledger.unshift(ledgerEntry);

    store.logAudit(ActorType.SYSTEM, 'payout.succeeded', 'payout', payoutId, null, {
      cycle_id: cycleId,
      beneficiary_phone: beneficiaryUser.phone_e164,
      amount_minor: grossAmountMinor,
      provider_reference: payoutRef
    });

    store.addNotification(
      beneficiaryUser.id,
      'Cagnotte Versée ! 🎉',
      `Félicitations ! Vous avez reçu la cagnotte de ${formatCurrency(grossAmountMinor, tontine.currency)} pour le cycle #${cycle.cycle_number}.`,
      'payout.succeeded'
    );

    store.saveState();
    return payout;
  }

  /**
   * Generate downloadable / printable receipt (FR-PAY-004)
   */
  static generateReceipt(transaction, contribution, cycle, tontine) {
    const member = store.state.memberships.find(m => m.id === contribution.member_id);
    const user = store.state.users.find(u => u.id === member.user_id);

    return {
      receiptNumber: 'REC-' + (transaction.provider_reference || transaction.id.substring(0, 8)),
      transactionId: transaction.id,
      providerReference: transaction.provider_reference,
      provider: transaction.provider,
      date: transaction.created_at,
      tontineName: tontine.name,
      cycleNumber: cycle.cycle_number,
      memberName: user ? user.name : 'Membre',
      memberPhone: user ? user.phone_e164 : '',
      amount: formatCurrency(transaction.amount_minor, transaction.currency),
      status: transaction.status,
      qrPayload: `TONTITRUST:REC:${transaction.provider_reference}:${transaction.amount_minor}:${transaction.currency}`
    };
  }
}
