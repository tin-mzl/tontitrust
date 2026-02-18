const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const { z } = require('zod');

admin.initializeApp();
const db = admin.firestore();

const tontineSchema = z.object({
  name: z.string().min(3),
  memberLimit: z.coerce.number().int().min(2).max(200),
  contributionAmount: z.coerce.number().positive(),
  frequency: z.enum(['weekly', 'monthly']),
  startDate: z.string().min(8)
});

async function assertValidatedUser(uid) {
  const userRef = await db.collection('users').doc(uid).get();
  const user = userRef.data();
  if (!user || user.kycStatus !== 'validated' || user.suspended) {
    throw new HttpsError('permission-denied', 'Compte non validé ou suspendu');
  }
}

exports.createTontineSecure = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentification requise');
  await assertValidatedUser(request.auth.uid);

  const parsed = tontineSchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', parsed.error.message);

  const inviteCode = crypto.randomUUID();
  const docRef = await db.collection('tontines').add({
    ...parsed.data,
    createdBy: request.auth.uid,
    memberIds: [request.auth.uid],
    membersCount: 1,
    order: [{ memberId: request.auth.uid, position: 1 }],
    inviteCode,
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { id: docRef.id, inviteCode };
});

exports.reviewKyc = onCall(async (request) => {
  if (!request.auth?.token?.admin) throw new HttpsError('permission-denied', 'Admin requis');
  const schema = z.object({ userId: z.string(), status: z.enum(['validated', 'rejected']), reason: z.string().optional() });
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', parsed.error.message);

  await db.collection('users').doc(parsed.data.userId).update({
    kycStatus: parsed.data.status,
    kycReviewReason: parsed.data.reason || null,
    kycReviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    kycReviewedBy: request.auth.uid
  });

  await db.collection('notifications').add({
    userId: parsed.data.userId,
    message: parsed.data.status === 'validated' ? 'Votre compte est validé.' : 'Votre compte est refusé.',
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { ok: true };
});

exports.onPaymentDeclared = onDocumentCreated('tontines/{tontineId}/payments/{paymentId}', async (event) => {
  const payment = event.data.data();
  const tontine = await db.collection('tontines').doc(event.params.tontineId).get();
  const organizerId = tontine.data().createdBy;

  await db.collection('notifications').add({
    userId: organizerId,
    message: `Nouveau paiement déclaré par ${payment.memberId}`,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
});
