import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function logEvent(userId, type, metadata = {}) {
  try {
    await addDoc(collection(db, 'logs'), {
      userId,
      type,
      metadata,
      createdAt: serverTimestamp()
    });
  } catch {
    // noop intentionally to avoid breaking UX on logging failure
  }
}
