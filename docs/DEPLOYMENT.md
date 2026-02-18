# Guide d'installation et de mise en production

## 1) Pré-requis

- Node.js 20+
- Firebase CLI (`npm i -g firebase-tools`)
- Projet Firebase avec Auth, Firestore, Storage, Functions activés

## 2) Installation locale

```bash
npm install
cp .env.example .env
# renseigner variables VITE_FIREBASE_*
npm run dev
```

## 3) Configuration Firebase

1. Activer Auth providers: **Email/Password** + **Phone**.
2. Activer Firestore en mode production.
3. Activer Storage.
4. Déployer les règles:

```bash
firebase deploy --only firestore:rules,storage
```

## 4) Déploiement complet

```bash
npm run build
firebase login
firebase use --add
firebase deploy
```

## 5) Création d'un administrateur

```bash
node scripts/setAdmin.js admin@example.com
```

Puis mettre `role: admin` dans `users/{uid}` pour l'utilisateur concerné.

## 6) Hardening recommandé

- Ajouter App Check (reCAPTCHA Enterprise).
- Activer budgets/alertes GCP.
- Limiter CORS sur endpoints sensibles.
- Ajouter rotation des secrets (Secret Manager).
- Configurer sauvegardes Firestore automatiques.
