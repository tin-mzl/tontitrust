import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerWithEmailAndPhone, sendPhoneOtp } from '../features/auth/authService';
import { logEvent } from '../lib/logger';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ fullName: '', phoneNumber: '', email: '', password: '' });
  const [confirmation, setConfirmation] = useState(null);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submitRegistration = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await registerWithEmailAndPhone(formData);
      const conf = await sendPhoneOtp(formData.phoneNumber);
      setConfirmation(conf);
      await logEvent(user.uid, 'register_started', { email: formData.email });
    } catch (err) {
      setError(err.message);
    }
  };

  const verifyOtp = async () => {
    try {
      await confirmation.confirm(otp);
      navigate('/');
    } catch (err) {
      setError(`OTP invalide: ${err.message}`);
    }
  };

  return (
    <section className="card">
      <h1>Créer un compte sécurisé</h1>
      <form onSubmit={submitRegistration} className="grid-form">
        <input placeholder="Nom complet" required onChange={(e) => setFormData((s) => ({ ...s, fullName: e.target.value }))} />
        <input placeholder="Téléphone (+225...)" required onChange={(e) => setFormData((s) => ({ ...s, phoneNumber: e.target.value }))} />
        <input type="email" placeholder="Email" required onChange={(e) => setFormData((s) => ({ ...s, email: e.target.value }))} />
        <input type="password" placeholder="Mot de passe" required onChange={(e) => setFormData((s) => ({ ...s, password: e.target.value }))} />
        <button className="btn-primary" type="submit">S'inscrire</button>
      </form>

      {confirmation && (
        <div className="otp-block">
          <input placeholder="Code OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
          <button className="btn-secondary" onClick={verifyOtp}>Valider OTP</button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </section>
  );
}
