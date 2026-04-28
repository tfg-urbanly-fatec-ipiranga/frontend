import { Link, useLocation } from 'react-router-dom';
import { Compass, Heart, User, ShieldCheck } from 'lucide-react';
import './BottomNav.css';
import { useAuthContext } from '../context/AuthContext';
import React from 'react';

function isAdmin(): boolean {
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    const user = parsed.user || parsed;
    return user.role === 'ADMIN';
  } catch {
    return false;
  }
}

const BottomNav = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthContext();
  const admin = isAdmin();

  return (
    <nav className="bottom-nav">
      <Link
        to="/home"
        className={`nav-item ${location.pathname === '/home' ? 'active' : ''}`}
      >
        <Compass size={22} />
        <span className="nav-label">Explorar</span>
      </Link>

      <Link
        to="/favorites"
        className={`nav-item ${location.pathname === '/favorites' ? 'active' : ''}`}
      >
        <Heart size={22} />
        <span className="nav-label">Favoritos</span>
      </Link>

      <Link
        to={isAuthenticated ? "/edit-profile" : "/login"}
        className={`nav-item ${location.pathname === '/edit-profile' ? 'active' : ''}`}
      >
        <User size={22} />
        <span className="nav-label">Perfil</span>
      </Link>

      {admin && (
        <Link
          to="/admin/inactive"
          className={`nav-item ${location.pathname === '/admin/inactive' ? 'active' : ''}`}
        >
          <ShieldCheck size={22} />
          <span className="nav-label">Inativos</span>
        </Link>
      )}
    </nav>
  );
};

export default BottomNav;