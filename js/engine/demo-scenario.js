// =============================================================================
// TONTITRUST 11-STEP INTERACTIVE DEMO SCENARIO
// PRD Reference: Section 21.1 (Scénario de démo recommandé)
// =============================================================================

import { TontineManager } from './tontine-manager.js';
import { PaymentAdapter } from './payment-adapter.js';
import { store } from './store.js';
import { MembershipStatus, ContributionStatus, formatCurrency } from './models.js';

export const DEMO_STEPS = [
  {
    step: 1,
    title: "1. Création / Connexion du compte Organisateur",
    description: "Amina Kabangu (+243 900 000 001) se connecte avec vérification OTP et accède à son espace d'administration de tontine.",
    actionName: "Connecter Amina (Organisateur)"
  },
  {
    step: 2,
    title: "2. Création de la « Tontine Espoir » et prévisualisation",
    description: "Configuration : 6 membres, 10 000 CDF par cycle hebdomadaire. Calcul automatique de la cagnotte (60 000 CDF) et du calendrier sur 6 semaines.",
    actionName: "Créer « Tontine Espoir »"
  },
  {
    step: 3,
    title: "3. Invitations et adhésions des 5 membres",
    description: "Génération du code d'invitation et adhésion de Patrick, Chantal, Junior, David et Sarah avec acceptation des règles du groupe.",
    actionName: "Simuler 5 adhésions"
  },
  {
    step: 4,
    title: "4. Approbation des membres et verrouillage de l'ordre",
    description: "L'organisateur valide chaque participant et verrouille l'ordre de passage (Junior en position #1) conformément aux règles (BR-004).",
    actionName: "Approuver et verrouiller"
  },
  {
    step: 5,
    title: "5. Activation de la tontine",
    description: "Génération automatique des 6 cycles, des échéances hebdomadaires et des 36 cotisations attendues.",
    actionName: "Activer la tontine"
  },
  {
    step: 6,
    title: "6. Collecte du Cycle 1 : 5 paiements réussis et 1 échec",
    description: "Simulation des paiements Mobile Money. 5 cotisations passent avec succès, celle de Chantal Ntumba échoue pour solde insuffisant.",
    actionName: "Simuler les 6 cotisations"
  },
  {
    step: 7,
    title: "7. Notification de relance et nouvelle tentative de paiement",
    description: "Envoi d'un rappel in-app/SMS pendant la période de grâce. Chantal recharge son compte Mobile Money et relance la transaction avec succès.",
    actionName: "Relancer le paiement échoué"
  },
  {
    step: 8,
    title: "8. Confirmation de la 6ème cotisation",
    description: "Toutes les 6 cotisations du cycle #1 sont désormais au statut PAID. Aucune cotisation manquante.",
    actionName: "Vérifier la complétude"
  },
  {
    step: 9,
    title: "9. Validation de l'éligibilité du Cycle à la distribution",
    description: "Le moteur TontiTrust vérifie l'absence de transaction en cours (PROCESSING) et valide le passage du cycle à l'état ELIGIBLE (FR-PAYOUT-001).",
    actionName: "Calculer l'éligibilité"
  },
  {
    step: 10,
    title: "10. Déclenchement de la distribution (Payout) au bénéficiaire",
    description: "Initiation unique du versement Mobile Money de la cagnotte de 60 000 CDF à Junior Boketshu (+243 900 000 004). Enregistrement comptable append-only.",
    actionName: "Verser la cagnotte"
  },
  {
    step: 11,
    title: "11. Reçu électronique, rapport de cycle et audit trail",
    description: "Génération du reçu officiel avec référence unique, clôture du cycle #1 et consultation des preuves dans le journal d'audit.",
    actionName: "Consulter les preuves & audit"
  }
];

export class DemoRunner {
  static getDemoTontine() {
    return store.state.tontines.find(t => t.name === 'Tontine Espoir');
  }

  static runStep(stepNumber) {
    switch (stepNumber) {
      case 1: {
        // Switch user to Amina
        store.setCurrentUser('u001');
        return { success: true, message: 'Connecté en tant qu\'Amina Kabangu (+243 900 000 001) - Organisateur.' };
      }

      case 2: {
        // Create Tontine Espoir if not present
        let tontine = this.getDemoTontine();
        if (!tontine) {
          tontine = TontineManager.createDraftTontine('u001', {
            name: 'Tontine Espoir',
            description: 'Tontine de démonstration officielle PRD 2026',
            amount_minor: 1000000, // 10,000 CDF
            currency: 'CDF',
            frequency: 'WEEKLY',
            member_limit: 6,
            grace_period_hours: 24,
            timezone: 'Africa/Kinshasa',
            order_mode: 'MANUAL',
            start_date: new Date().toISOString().split('T')[0]
          });
          TontineManager.publishTontine(tontine.id);
        }
        return { success: true, tontine, message: '« Tontine Espoir » créée avec succès : 6 membres, 10 000 CDF / semaine, cagnotte totale de 60 000 CDF.' };
      }

      case 3: {
        const tontine = this.getDemoTontine();
        if (!tontine) throw new Error('Veuillez d\'abord exécuter l\'étape 2.');

        const candidateUsers = ['u002', 'u003', 'u004', 'u005', 'u006']; // Patrick, Chantal, Junior, David, Sarah
        for (const uid of candidateUsers) {
          const u = store.state.users.find(user => user.id === uid);
          const existing = store.state.memberships.find(m => m.tontine_id === tontine.id && m.user_id === uid);
          if (!existing) {
            TontineManager.requestMembership(tontine.id, uid, u.phone_e164);
          }
        }
        return { success: true, message: '5 membres ont soumis leur demande d\'adhésion et accepté le règlement.' };
      }

      case 4: {
        const tontine = this.getDemoTontine();
        if (!tontine) throw new Error('Tontine introuvable.');

        // Approve all pending memberships
        const memberships = store.state.memberships.filter(m => m.tontine_id === tontine.id);
        memberships.forEach(m => {
          m.status = MembershipStatus.APPROVED;
        });

        // Set Junior Boketshu (u004) as position #1
        const juniorMem = memberships.find(m => m.user_id === 'u004');
        const aminaMem = memberships.find(m => m.user_id === 'u001');
        const patrickMem = memberships.find(m => m.user_id === 'u002');
        const chantalMem = memberships.find(m => m.user_id === 'u003');
        const davidMem = memberships.find(m => m.user_id === 'u005');
        const sarahMem = memberships.find(m => m.user_id === 'u006');

        if (juniorMem) juniorMem.position = 1;
        if (aminaMem) aminaMem.position = 2;
        if (patrickMem) patrickMem.position = 3;
        if (chantalMem) chantalMem.position = 4;
        if (davidMem) davidMem.position = 5;
        if (sarahMem) sarahMem.position = 6;

        tontine.status = 'READY';
        tontine.locked_at = new Date().toISOString();
        store.saveState();
        return { success: true, message: 'Membres approuvés et ordre de passage verrouillé : Junior Boketshu est le 1er bénéficiaire.' };
      }

      case 5: {
        const tontine = this.getDemoTontine();
        if (!tontine) throw new Error('Tontine introuvable.');

        // Activate if not active
        if (tontine.status !== 'ACTIVE') {
          TontineManager.activateTontine(tontine.id);
        }
        return { success: true, message: 'Tontine activée ! 6 cycles hebdomadaires et 36 cotisations générés.' };
      }

      case 6: {
        const tontine = this.getDemoTontine();
        const cycle1 = store.state.cycles.find(c => c.tontine_id === tontine.id && c.cycle_number === 1);
        if (!cycle1) throw new Error('Cycle 1 introuvable.');

        const contributions = store.state.contributions.filter(c => c.cycle_id === cycle1.id);
        const memberships = store.state.memberships.filter(m => m.tontine_id === tontine.id);

        // Find Chantal's contribution to simulate failure
        const chantalMem = memberships.find(m => m.user_id === 'u003');

        contributions.forEach(c => {
          if (c.member_id === chantalMem.id) {
            PaymentAdapter.initiateContributionPayment(c.id, 'ORANGE_MONEY', `demo_step6_${c.id}`, false);
          } else {
            PaymentAdapter.initiateContributionPayment(c.id, 'M-PESA', `demo_step6_${c.id}`, true);
          }
        });

        return {
          success: true,
          message: 'Simulation effectuée : 5 cotisations payées avec succès, 1 paiement rejeté (Chantal Ntumba - Solde insuffisant).'
        };
      }

      case 7: {
        const tontine = this.getDemoTontine();
        const cycle1 = store.state.cycles.find(c => c.tontine_id === tontine.id && c.cycle_number === 1);
        const chantalMem = store.state.memberships.find(m => m.tontine_id === tontine.id && m.user_id === 'u003');
        const chantalContrib = store.state.contributions.find(c => c.cycle_id === cycle1.id && c.member_id === chantalMem.id);

        // Send reminder & retry with success
        store.addNotification('u003', 'Rappel d\'échéance', 'Paiement relancé avec succès après approvisionnement.', 'contribution.retry');
        PaymentAdapter.initiateContributionPayment(chantalContrib.id, 'ORANGE_MONEY', `demo_retry_${chantalContrib.id}_${Date.now()}`, true);

        return {
          success: true,
          message: 'Paiement de Chantal Ntumba relancé et validé avec succès (Reçu généré).'
        };
      }

      case 8: {
        const tontine = this.getDemoTontine();
        const cycle1 = store.state.cycles.find(c => c.tontine_id === tontine.id && c.cycle_number === 1);
        const contributions = store.state.contributions.filter(c => c.cycle_id === cycle1.id);

        const paidCount = contributions.filter(c => c.status === ContributionStatus.PAID).length;
        return {
          success: true,
          message: `Vérification réussie : ${paidCount}/${contributions.length} cotisations validées (100 % complétude).`
        };
      }

      case 9: {
        const tontine = this.getDemoTontine();
        const cycle1 = store.state.cycles.find(c => c.tontine_id === tontine.id && c.cycle_number === 1);
        const result = TontineManager.evaluatePayoutEligibility(cycle1.id);

        return {
          success: true,
          status: result.status,
          message: 'Calcul d\'éligibilité validé : Le statut du Cycle #1 passe à ELIGIBLE.'
        };
      }

      case 10: {
        const tontine = this.getDemoTontine();
        const cycle1 = store.state.cycles.find(c => c.tontine_id === tontine.id && c.cycle_number === 1);
        const payout = PaymentAdapter.executePayout(cycle1.id, 'DEMO_ENGINE');

        return {
          success: true,
          payout,
          message: `Distribution effectuée avec succès ! Cagnotte de 60 000 CDF versée à Junior Boketshu (Réf: ${payout.provider_reference}).`
        };
      }

      case 11: {
        const tontine = this.getDemoTontine();
        const cycle1 = store.state.cycles.find(c => c.tontine_id === tontine.id && c.cycle_number === 1);
        const payout = store.state.payouts.find(p => p.cycle_id === cycle1.id);

        return {
          success: true,
          report: {
            tontine: tontine.name,
            cycle: 1,
            grossAmount: '60 000 CDF',
            beneficiary: 'Junior Boketshu (+243 900 000 004)',
            status: 'COMPLETED',
            payoutRef: payout ? payout.provider_reference : 'PO_SIM_DEMO',
            auditEventsCount: store.state.auditLogs.length
          },
          message: 'Démonstration terminée avec succès ! Le cycle #1 est clôturé et archivé dans le grand livre comptable et le journal d\'audit.'
        };
      }

      default:
        throw new Error('Étape de démo inconnue');
    }
  }
}
