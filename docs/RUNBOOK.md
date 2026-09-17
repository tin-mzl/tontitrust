# TontiTrust - Runbook d'Exploitation & Support

> **Référence PRD & TSD** : TT-PRD-TSD-001 v1.0 (Sections 14 & 18)  
> **Statut** : Document opérationnel pour équipes DevOps & Support  

---

## 1. Niveaux de Support & Escalade (PRD §14.2)

| Niveau | Périmètre d'Intervention | Accès & Outils |
| :--- | :--- | :--- |
| **Niveau 1 (L1)** | Questions d'usage, statut d'un paiement, renvoi de reçu ou d'invitation. | Console Admin (données minimisées, pas de modification financière). |
| **Niveau 2 (L2)** | Incidents de transactions, échecs de webhooks, suspension conservatoire. | Chronologie détaillée, statuts intermédiaires, module de suspension. |
| **Niveau 3 (L3)** | Anomalies techniques de calcul, bugs d'idempotence, rollback. | Logs techniques, base de données via procédure d'audit renforcée. |

---

## 2. Procédures d'Urgence

### 2.1 Suspension Conservatoire d'un Groupe (FR-SUP-004, BR-013)
1. Ouvrir la console d'administration sur `/admin/tontines`.
2. Identifier le groupe par son ID ou nom.
3. Cliquer sur `Suspendre le groupe`.
4. **Saisir obligatoirement le motif de suspension** (ex: *Contestation sur le numéro de paiement du bénéficiaire*).
5. Vérifier que les cotisations et payouts sont immédiatement bloqués dans l'audit trail.

### 2.2 Rejeu d'un Webhook Échoué (FR-PAY-003, BR-012)
1. Récupérer l'ID de l'événement dans `payment_webhook_events`.
2. Vérifier la charge utile (`payload_json`) et la signature.
3. Déclencher le traitement via la passerelle d'administration. Le moteur vérifie automatiquement l'idempotence pour éviter tout double-débit ou double-crédit.

---

## 3. Gestion des Sauvegardes & Restauration (NFR-011)

- **Sauvegardes Quotidiennes** : Exécutées automatiquement avec archivage chiffré.
- **RPO Cible** : 24 h en pilote, 1 h en production.
- **RTO Cible** : 8 h en pilote, 4 h en production.
- **Procédure de Test de Restauration** : Trimestrielle obligatoire sur base isolée.
