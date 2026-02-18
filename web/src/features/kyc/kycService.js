import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';

export async function uploadKycDocuments(userId, idDocumentFile, selfieFile) {
  const idPath = `kyc/${userId}/identity_${Date.now()}_${idDocumentFile.name}`;
  const selfiePath = `kyc/${userId}/selfie_${Date.now()}_${selfieFile.name}`;

  await uploadBytes(ref(storage, idPath), idDocumentFile, { contentType: idDocumentFile.type });
  await uploadBytes(ref(storage, selfiePath), selfieFile, { contentType: selfieFile.type });

  const [idDocumentUrl, selfieUrl] = await Promise.all([
    getDownloadURL(ref(storage, idPath)),
    getDownloadURL(ref(storage, selfiePath))
  ]);

  await updateDoc(doc(db, 'users', userId), {
    kycStatus: 'pending',
    kyc: {
      idDocumentPath: idPath,
      selfiePath,
      idDocumentUrl,
      selfieUrl,
      submittedAt: serverTimestamp()
    }
  });
}
