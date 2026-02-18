import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uploadKycDocuments } from '../features/kyc/kycService';
import { createTontine, joinTontineByCode } from '../features/tontines/tontineService';
import { watchNotifications } from '../features/notifications/notificationService';
import { db } from '../lib/firebase';

export default function DashboardPage() {
  const { user, profile, isKycValidated } = useAuth();
  const [tontines, setTontines] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [files, setFiles] = useState({ idDoc: null, selfie: null });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'tontines'), where('memberIds', 'array-contains', user.uid), orderBy('createdAt', 'desc'));
    const unsubTontines = onSnapshot(q, (snap) => setTontines(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubNotifications = watchNotifications(user.uid, setNotifications);
    return () => {
      unsubTontines();
      unsubNotifications();
    };
  }, [user]);

  const onCreateTontine = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    await createTontine(data, user.uid);
    e.target.reset();
  };

  return (
    <main className="dashboard">
      <section className="card">
        <h2>Profil</h2>
        <p><strong>Nom:</strong> {profile?.fullName}</p>
        <p><strong>Email:</strong> {profile?.email}</p>
        <p><strong>Status KYC:</strong> <span className={`badge badge-${profile?.kycStatus}`}>{profile?.kycStatus}</span></p>
      </section>

      {!isKycValidated && (
        <section className="card">
          <h2>Vérification d'identité (KYC)</h2>
          <input type="file" accept="image/*,.pdf" onChange={(e) => setFiles((s) => ({ ...s, idDoc: e.target.files[0] }))} />
          <input type="file" accept="image/*" onChange={(e) => setFiles((s) => ({ ...s, selfie: e.target.files[0] }))} />
          <button className="btn-primary" onClick={() => uploadKycDocuments(user.uid, files.idDoc, files.selfie)}>Soumettre documents</button>
        </section>
      )}

      {isKycValidated && (
        <>
          <section className="card">
            <h2>Créer une tontine</h2>
            <form className="grid-form" onSubmit={onCreateTontine}>
              <input name="name" required placeholder="Nom de tontine" />
              <input name="memberLimit" required type="number" placeholder="Nombre de membres" />
              <input name="contributionAmount" required type="number" placeholder="Montant cotisation" />
              <select name="frequency" defaultValue="monthly">
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuelle</option>
              </select>
              <input name="startDate" required type="date" />
              <button className="btn-primary" type="submit">Créer</button>
            </form>
          </section>

          <section className="card">
            <h2>Rejoindre une tontine</h2>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Code invitation" />
            <button className="btn-secondary" onClick={() => joinTontineByCode(joinCode, user.uid)}>Rejoindre</button>
          </section>
        </>
      )}

      <section className="card">
        <h2>Mes tontines</h2>
        {tontines.map((t) => (
          <Link key={t.id} to={`/tontines/${t.id}`} className="list-item">
            <span>{t.name}</span>
            <small>{t.membersCount}/{t.memberLimit} membres</small>
          </Link>
        ))}
      </section>

      <section className="card">
        <h2>Notifications</h2>
        {notifications.map((n) => <p key={n.id}>• {n.message}</p>)}
      </section>
    </main>
  );
}
