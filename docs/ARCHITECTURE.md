# Architecture TontiTrust (Production-ready)

## Vue d'ensemble

- **Frontend React (Vite)**: interface utilisateur, routage protégé, logique UX KYC/tontines/admin.
- **Firebase Auth**: email/password + OTP SMS (phone auth).
- **Firestore**: données transactionnelles (users, tontines, payments, notifications, logs).
- **Firebase Storage**: documents KYC chiffrés au repos.
- **Cloud Functions**: validation serveur des opérations critiques, notifications, audit trail.
- **Firebase Hosting**: déploiement SPA, CDN global.

## Modèle de données

### users/{uid}
- fullName, email, phoneNumber
- role: `user|admin`
- kycStatus: `pending|validated|rejected`
- suspended: boolean
- kyc: {idDocumentPath, selfiePath, submittedAt}

### tontines/{id}
- name, memberLimit, contributionAmount, frequency, startDate
- createdBy, memberIds[], order[]
- inviteCode, status

### tontines/{id}/payments/{paymentId}
- memberId, amount, status (`pending|validated`)
- dueDate, createdAt

### notifications/{id}
- userId, message, read, createdAt

### logs/{id}
- userId, type, metadata, createdAt

## Scalabilité 10 000+ utilisateurs

1. Index Firestore explicites.
2. Cloud Functions pour écrire les opérations sensibles.
3. Subcollections pour limiter la hot-spot contention.
4. Security rules minimales et ciblées.
5. Notifications async via triggers.
6. Monitoring avec Cloud Logging + Error Reporting.
