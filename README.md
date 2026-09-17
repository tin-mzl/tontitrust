# TontiTrust — Plateforme Fintech de Tontines Digitales Sécurisées

<div align="center">

![TontiTrust Banner](./assets/logo.jpg)

**Infrastructure de Confiance pour l'Épargne Communautaire Digitale en Afrique**

[![Version](https://img.shields.io/badge/Version-1.0--MVP--Pilote-blue.svg)](./docs/openapi.yaml)
[![Status](https://img.shields.io/badge/Statut-Prêt_pour_recette-success.svg)](./implementation_plan.md)
[![Tests](https://img.shields.io/badge/Tests-10%2F10_Passing-emerald.svg)](./tests/test_tontitrust.py)
[![PRD](https://img.shields.io/badge/Spécifications-TT--PRD--TSD--001-indigo.svg)](./docs/ARCHITECTURE.md)
[![License](https://img.shields.io/badge/License-Propriétaire-slate.svg)](#)

</div>

---

## 📖 Sommaire

1. [Présentation & Proposition de Valeur](#-présentation--proposition-de-valeur)
2. [Démarrage Rapide (Sans Dépendance)](#-démarrage-rapide-sans-dépendance)
3. [Scénario de Démonstration Guidé (11 Étapes)](#-scénario-de-démonstration-guidé-11-étapes)
4. [Comptes & Jeux de Données de Test](#-comptes--jeux-de-données-de-test)
5. [Conformité au Cahier des Charges (PRD v1.0)](#-conformité-au-cahier-des-charges-prd-v10)
6. [Architecture Technique & Base de Données](#-architecture-technique--base-de-données)
7. [Documentation API REST & OpenAPI](#-documentation-api-rest--openapi)
8. [Suite de Tests Automatisés](#-suite-de-tests-automatisés)
9. [Garde-fous de Sécurité & Non-Dépôt des Fonds](#-garde-fous-de-sécurité--non-dépôt-des-fonds)
10. [Instructions Git & Déploiement](#-instructions-git--déploiement)

---

## 🌟 Présentation & Proposition de Valeur

**TontiTrust** modernise et sécurise les tontines traditionnelles (épargne rotative / ROSCA) en Afrique en éliminant les litiges fréquents :
- ❌ **Paiements contestés ou oubliés** ➔ ✔️ Preuves cryptographiques, reçus électroniques horodatés et rapprochement Mobile Money.
- ❌ **Ordre de passage manipulé** ➔ ✔️ Ordre validé et verrouillé avant toute activation (`BR-004`).
- ❌ **Retards de paiement bloquant la cagnotte** ➔ ✔️ Rappels automatiques, période de grâce configurable et calcul strict d'éligibilité (`FR-PAYOUT-001`).
- ❌ **Risque de détention illégale de fonds** ➔ ✔️ **Principe de Non-Custody** : les flux transitent directement via les opérateurs de paiement agréés (M-Pesa, Orange Money, Airtel Money).

---

## 🚀 Démarrage Rapide (Sans Dépendance)

L'application de démonstration est prête à l'emploi et fonctionne sans aucune installation complexe :

### Option 1 : Lancer le serveur local inclus (Recommandé)
```bash
python server.py
```
Puis ouvrez votre navigateur sur : **[http://localhost:3000](http://localhost:3000)**

### Option 2 : Ouvrir directement dans le navigateur
Vous pouvez également double-cliquer sur le fichier `index.html` pour ouvrir la démo en mode autonome.

---

## ⚡ Scénario de Démonstration Guidé (11 Étapes)

Conformément à la **section 21.1 du PRD**, l'application intègre un mode pas-à-pas interactif exécutable en moins de 10 minutes avec la **« Tontine Espoir »** :

| Étape | Action Réalisée | Règle Validée |
| :---: | :--- | :--- |
| **1** | Connexion du compte Organisateur (Amina Kabangu `+243 900 000 001`). | `FR-AUTH-001` |
| **2** | Création de la *Tontine Espoir* (6 membres, 10 000 CDF / semaine, cagnotte de 60 000 CDF). | `FR-GRP-002` |
| **3** | Invitation et adhésion simulée de 5 membres (Patrick, Chantal, Junior, David, Sarah). | `FR-INV-002` |
| **4** | Approbation des membres et verrouillage de l'ordre (Junior Boketshu en position #1). | `BR-004`, `US-008` |
| **5** | Activation de la tontine : génération des 6 cycles hebdomadaires et des 36 cotisations. | `BR-006`, `FR-CYC-001` |
| **6** | Collecte du cycle #1 : simulation de 5 cotisations réussies et 1 rejet (Chantal Ntumba). | `FR-PAY-002`, `FR-CYC-003` |
| **7** | Notification de relance pendant la période de grâce et seconde tentative réussie. | `FR-CYC-004`, `FR-NOTIF-004` |
| **8** | Confirmation de la 6ème cotisation (100 % de complétude). | `BR-008` |
| **9** | Calcul d'éligibilité automatique : passage du Cycle #1 au statut `ELIGIBLE`. | `FR-PAYOUT-001` |
| **10** | Déclenchement de la distribution (Payout) unique de 60 000 CDF à Junior Boketshu. | `BR-011`, `FR-PAYOUT-002` |
| **11** | Émission du reçu officiel avec QR code, clôture du cycle et inscription dans l'audit log. | `FR-PAY-004`, `FR-REP-004` |

Pour lancer ce scénario, cliquez sur le bouton **⚡ Démo Guidée (11 Étapes)** dans la barre supérieure de l'application.

---

## 👥 Comptes & Jeux de Données de Test

Tous les comptes du PRD (§21.2) sont préconfigurés dans le sélecteur de persona :

| Persona | Téléphone / Identifiant | Rôle Principal | Cas d'Usage Démo |
| :--- | :--- | :--- | :--- |
| **Amina Kabangu** | `+243 900 000 001` | Organisateur | Création, configuration, verrouillage & validation |
| **Patrick Mukendi** | `+243 900 000 002` | Membre 1 | Cotisation standard et consultation des reçus |
| **Chantal Ntumba** | `+243 900 000 003` | Membre 2 | Simulation d'échec de paiement puis relance |
| **Junior Boketshu** | `+243 900 000 004` | Membre 3 | Bénéficiaire du premier cycle (réception du payout) |
| **Admin TontiTrust** | `+243 900 000 000` | Super-Admin | Supervision, rapprochement bancaire et audit |
| **Support Technique**| `+243 900 000 099` | Support Client | Triage et résolution des tickets de réclamation |

---

## 📊 Conformité au Cahier des Charges (PRD v1.0)

### Inventaire des Écrans
- **S-01 à S-06 (Onboarding & Auth)** : Splash, Bienvenue, Téléphone, OTP à 6 chiffres, Profil et Consentements CGU.
- **S-07 à S-18 (Espace Membre & Organisateur)** : Tableau de bord, Création de tontine multi-étapes, Adhésion par code, Calendrier de rotation, Module de cotisation Mobile Money, Reçu imprimable avec QR Code, Centre de notifications.
- **S-19 à S-21 (Support & KYC)** : Création et suivi de tickets, Niveaux KYC progressifs.
- **A-01 à A-08 (Console Super-Admin)** : Tableau de bord des métriques globales, Annuaire utilisateurs, Suspension conservatoire de groupe, Rapprochement des flux, Supervision des versements, Journal d'audit append-only.

### Règles Métier Majeures
- **BR-001 & BR-002** : 1 seul organisateur principal et 1 seule position active par membre.
- **BR-003** : Capacité maximale comprise entre 2 et 50 membres, garantie de façon atomique.
- **BR-004** : Verrouillage strict de l'ordre et des paramètres avant l'activation.
- **BR-011** : Unicité absolue du payout par cycle (zéro double-décaissement).
- **BR-012** : Idempotence des paiements et déduplication des webhooks.
- **BR-013 & BR-018** : Suspension administrative avec motif obligatoire consigné dans l'audit log.
- **BR-019** : Montants stockés en unités monétaires minimales entières (`amount_minor`).

---

## 🗄️ Architecture Technique & Base de Données

Le projet comprend l'ensemble des fichiers nécessaires au déploiement de la base de données PostgreSQL / Supabase :

- **`supabase/migrations/20260728000001_init_schema.sql`** :
  - Définition complète des 26 tables (`users`, `tontines`, `memberships`, `cycles`, `contributions`, `payouts`, `ledger_entries`, `audit_logs`, etc.).
  - Politiques de sécurité **Row Level Security (RLS)** pour chaque table.
  - Contraintes d'intégrité, types énumérés et index optimisés.
- **`supabase/seed.sql`** : Données de test et historique comptable initial.
- **`supabase/config.toml`** : Configuration pour le CLI Supabase local.

---

## 📡 Documentation API REST & OpenAPI

La spécification complète au format **OpenAPI 3.1** est disponible dans :
👉 **[`docs/openapi.yaml`](./docs/openapi.yaml)**

Elle documente l'ensemble des endpoints du catalogue :
- `/auth/*` : OTP, vérification, sessions.
- `/tontines/*` : Brouillons, publication, verrouillage, activation, invitations.
- `/contributions/*` : Intents de paiement, reçus.
- `/payment-webhooks/*` : Webhooks signés des opérateurs.
- `/cycles/{id}/evaluate-payout` & `/payouts/*` : Moteur de distribution.
- `/admin/*` : Dashboard, suspension de groupe, rapprochement et audit logs.

---

## 🧪 Suite de Tests Automatisés

Une suite de tests unitaires et d'intégration en Python valide les scénarios critiques du PRD (§17.2, **TC-001 à TC-020**) :

```bash
python -m unittest tests/test_tontitrust.py
```

### Résultats des Tests :
```text
test_tc001_otp_validation_and_expiration ... ok
test_tc002_capacity_limit_atomic ... ok
test_tc003_activation_blocked_if_rules_not_accepted ... ok
test_tc004_payment_idempotency ... ok
test_tc005_webhook_deduplication ... ok
test_tc008_payout_eligibility_requires_all_paid ... ok
test_tc009_unique_payout_per_cycle ... ok
test_tc012_suspended_group_blocks_financial_operations ... ok
test_tc013_rotation_order_locked_after_activation ... ok
test_tc019_ledger_integer_accounting ... ok
----------------------------------------------------------------------
Ran 10 tests in 0.001s - OK
```

---

## 🔒 Garde-fous de Sécurité & Non-Dépôt des Fonds

- **Non-Custody** : TontiTrust n'encaisse pas les fonds sur ses propres comptes. Les transactions sont exécutées directement par les opérateurs de Mobile Money agréés.
- **Grand Livre Append-Only** : Toutes les écritures de crédit et de débit sont immuables (`ledger_entries`).
- **Audit Trail Immuable** : Chaque action sensible (suspension, activation, rejet) génère une trace horodatée avec diff avant/après (`audit_logs`).
- **Idempotence & Anti-Replay** : Chaque paiement possède une clé unique (`Idempotency-Key`) empêchant toute double facturation.

---

## 🐙 Instructions Git & Déploiement

Le dépôt Git local a été initialisé avec des commits conventionnels et structurés :

```bash
git log --oneline
```

Le remote `origin` est configuré sur votre dépôt GitHub :
```bash
git remote -v
# origin https://github.com/tin-mzl/tontitrust.git (fetch)
# origin https://github.com/tin-mzl/tontitrust.git (push)
```

### Pour publier sur votre dépôt GitHub :
Comme vous l'avez demandé, vous pouvez exécuter vous-même la commande de push lorsque vous le souhaitez :
```bash
git push -u origin main
```
