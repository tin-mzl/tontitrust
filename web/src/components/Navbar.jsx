import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../features/auth/authService';

export function Navbar() {
  const { user, isAdmin, profile } = useAuth();

  return (
    <header className="navbar">
      <Link to="/" className="brand">TontiTrust</Link>
      <nav>
        {user ? (
          <div className="nav-actions">
            {isAdmin && <Link to="/admin">Admin</Link>}
            <span className={`badge badge-${profile?.kycStatus || 'pending'}`}>KYC: {profile?.kycStatus || 'pending'}</span>
            <button onClick={logout} className="btn-link">Déconnexion</button>
          </div>
        ) : (
          <div className="nav-actions">
            <Link to="/login">Connexion</Link>
            <Link to="/register">Inscription</Link>
          </div>
        )}
      </nav>
    </header>
  );
}
