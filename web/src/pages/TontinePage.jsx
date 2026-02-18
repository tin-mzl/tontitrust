import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { declarePayment, getTontine, validatePayment } from '../features/tontines/tontineService';

export default function TontinePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [tontine, setTontine] = useState(null);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    getTontine(id).then(setTontine);
    const q = query(collection(db, 'tontines', id, 'payments'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => setPayments(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))));
    return () => unsub();
  }, [id]);

  if (!tontine) return <p>Chargement...</p>;
  const isOrganizer = tontine.createdBy === user.uid;

  return (
    <main className="dashboard">
      <section className="card">
        <h1>{tontine.name}</h1>
        <p>Montant: {tontine.contributionAmount} FCFA</p>
        <p>Ordre de passage:</p>
        <ol>
          {tontine.order?.map((entry) => <li key={entry.memberId}>{entry.memberId}</li>)}
        </ol>
        <p>Lien invitation: <code>{window.location.origin}/?invite={tontine.inviteCode}</code></p>
      </section>

      <section className="card">
        <h2>Déclarer un paiement</h2>
        <button className="btn-primary" onClick={() => declarePayment(id, user.uid, tontine.contributionAmount)}>Je déclare mon paiement</button>
      </section>

      <section className="card">
        <h2>Historique paiements</h2>
        {payments.map((p) => (
          <div key={p.id} className="list-item">
            <span>{p.memberId} - {p.amount} FCFA</span>
            <span className={`badge badge-${p.status}`}>{p.status}</span>
            {isOrganizer && p.status === 'pending' && (
              <button className="btn-link" onClick={() => validatePayment(id, p.id)}>Valider</button>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
