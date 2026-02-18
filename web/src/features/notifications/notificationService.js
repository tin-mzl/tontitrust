import { collection, doc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function watchNotifications(userId, callback) {
  const q = query(collection(db, 'notifications'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function markNotificationRead(notificationId) {
  return updateDoc(doc(db, 'notifications', notificationId), { read: true });
}
