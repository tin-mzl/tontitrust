#!/usr/bin/env node
const admin = require('firebase-admin');

admin.initializeApp();

async function run() {
  const [email] = process.argv.slice(2);
  if (!email) throw new Error('Usage: node scripts/setAdmin.js <email>');
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  console.log(`Admin claim set for ${email}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
