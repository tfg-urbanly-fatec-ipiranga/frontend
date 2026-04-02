import { Link, useLocation } from 'react-router-dom';
import { Compass, Heart, User } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <Link
        to="/establishments"
        className={`nav-item ${location.pathname === '/establishments' ? 'active' : ''}`}
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
        to="/edit-profile"
        className={`nav-item ${location.pathname === '/edit-profile' ? 'active' : ''}`}
      >
        <User size={22} />
        <span className="nav-label">Perfil</span>
      </Link>
    </nav>
  );
};

export default BottomNav;