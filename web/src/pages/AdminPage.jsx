import { collection, onSnapshot, orderBy, query, updateDoc, doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [tontines, setTontines] = useState([]);

  useEffect(() => {
    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubTontines = onSnapshot(query(collection(db, 'tontines'), orderBy('createdAt', 'desc')), (snap) => {
      setTontines(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubUsers();
      unsubTontines();
    };
  }, []);

  const setKycStatus = async (userId, status) => {
    await updateDoc(doc(db, 'users', userId), { kycStatus: status });
  };

  const toggleSuspend = async (userId, suspended) => {
    await updateDoc(doc(db, 'users', userId), { suspended: !suspended });
  };

  return (
    <main className="dashboard">
      <section className="card">
        <h1>Panel Admin</h1>
        <h2>Gestion KYC</h2>
        {users.map((u) => (
          <div key={u.id} className="list-item">
            <div>
              <strong>{u.fullName}</strong>
              <p>{u.email} - {u.phoneNumber}</p>
              <p>KYC: {u.kycStatus}</p>
              {u.kyc?.idDocumentUrl && <a href={u.kyc.idDocumentUrl} target="_blank" rel="noreferrer">Voir pièce</a>}
              {u.kyc?.selfieUrl && <a href={u.kyc.selfieUrl} target="_blank" rel="noreferrer">Voir selfie</a>}
            </div>
            <div className="actions-vertical">
              <button className="btn-secondary" onClick={() => setKycStatus(u.id, 'validated')}>Valider</button>
              <button className="btn-secondary" onClick={() => setKycStatus(u.id, 'rejected')}>Refuser</button>
              <button className="btn-link" onClick={() => toggleSuspend(u.id, u.suspended)}>{u.suspended ? 'Réactiver' : 'Suspendre'}</button>
            </div>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Toutes les tontines</h2>
        {tontines.map((t) => <p key={t.id}>{t.name} - {t.membersCount}/{t.memberLimit}</p>)}
      </section>
    </main>
  );
}
