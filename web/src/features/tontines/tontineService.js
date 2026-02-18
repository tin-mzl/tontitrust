import { addDoc, collection, doc, getDoc, getDocs, increment, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const buildOrder = (memberIds) => memberIds.map((memberId, index) => ({ memberId, position: index + 1 }));

export async function createTontine(payload, ownerId) {
  const inviteCode = crypto.randomUUID();
  return addDoc(collection(db, 'tontines'), {
    ...payload,
    createdBy: ownerId,
    memberIds: [ownerId],
    membersCount: 1,
    order: buildOrder([ownerId]),
    inviteCode,
    status: 'active',
    createdAt: serverTimestamp()
  });
}

export async function joinTontineByCode(code, userId) {
  const q = query(collection(db, 'tontines'), where('inviteCode', '==', code));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('Lien invalide');
  const target = snap.docs[0];
  const data = target.data();
  if (data.memberIds.includes(userId)) return;
  if (data.memberIds.length >= Number(data.memberLimit)) throw new Error('Tontine complète');

  const memberIds = [...data.memberIds, userId];
  await updateDoc(doc(db, 'tontines', target.id), {
    memberIds,
    membersCount: increment(1),
    order: buildOrder(memberIds)
  });
}

export async function declarePayment(tontineId, memberId, amount) {
  await addDoc(collection(db, 'tontines', tontineId, 'payments'), {
    tontineId,
    memberId,
    amount: Number(amount),
    status: 'pending',
    dueDate: serverTimestamp(),
    createdAt: serverTimestamp()
  });
}

export async function validatePayment(tontineId, paymentId) {
  await updateDoc(doc(db, 'tontines', tontineId, 'payments', paymentId), { status: 'validated', validatedAt: serverTimestamp() });
}

export async function getTontine(tontineId) {
  const snap = await getDoc(doc(db, 'tontines', tontineId));
  return { id: snap.id, ...snap.data() };
}
