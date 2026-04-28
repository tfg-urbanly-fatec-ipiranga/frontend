import { Link, useLocation } from 'react-router-dom';
import { Compass, Heart, User } from 'lucide-react';
import './BottomNav.css';
import { useAuthContext } from '../context/AuthContext';
import React from 'react';

const BottomNav = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthContext();

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

    </nav>
  );
};

export default BottomNav;