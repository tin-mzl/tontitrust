import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../features/auth/authService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="card">
      <h1>Connexion</h1>
      <form onSubmit={onSubmit} className="grid-form">
        <input type="email" required placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input type="password" required placeholder="Mot de passe" onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="btn-primary">Se connecter</button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
