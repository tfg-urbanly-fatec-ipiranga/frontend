import { useState, useRef, useEffect, type FC } from 'react';
import { Search, Heart, ArrowLeft, User, Menu, Plus, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import './Favorites.css';
import BottomNav from '../components/BottomNav';
import React from 'react';

const FavoritesPage: FC = () => {
  const navigate = useNavigate();
  const { favorites, loading, error, isFavorite, isToggling, toggleFavorite } = useFavorites();

  const [search, setSearch] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = favorites.filter((f) =>
    f.place.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="favorites-page">
      <header className="favorites-header">
        <button className="back-button" onClick={() => navigate('/home')}>
          <ArrowLeft size={24} />
        </button>
        <div className="brand-text">Urbanly</div>
        <div className="header-right">
          <div className="profile-pic">
            <img
              src="https://ui-avatars.com/api/?name=Admin+User&background=EB6B3D&color=fff"
              alt="Profile"
              style={{ width: '100%', borderRadius: '50%' }}
            />
          </div>
          <div className="menu-container" ref={menuRef}>
            <button className="menu-button" onClick={() => setShowMenu(!showMenu)}>
              <Menu size={24} />
            </button>
            {showMenu && (
              <div className="dropdown-menu">
                <button
                  className="dropdown-item"
                  onClick={() => navigate('/register-establishment')}
                >
                  <Plus size={18} />
                  <span>Cadastrar Estabelecimento</span>
                </button>
                <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' }} />
                <button
                  className="dropdown-item"
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                  }}
                  style={{ color: '#ef4444' }}
                >
                  <User size={18} />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="favorites-controls">
        <div className="search-bar-container">
          <input
            type="text"
            placeholder="Buscar favoritos..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={20} className="search-icon" />
        </div>
      </section>

      <main className="favorites-content">
        <div className="favorites-heading">
          <Heart size={18} fill="currentColor" />
          <span>Meus Favoritos</span>
          {!loading && <span className="favorites-count">{filtered.length}</span>}
        </div>

        {loading && (
          <div className="favorites-empty">
            <p>Carregando favoritos...</p>
          </div>
        )}

        {error && (
          <div className="favorites-empty">
            <p style={{ color: 'red' }}>{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="favorites-empty">
            <Heart size={48} className="empty-icon" />
            <p className="empty-title">Nenhum favorito ainda</p>
            <p className="empty-subtitle">
              Explore estabelecimentos e adicione seus favoritos
            </p>
            <button className="explore-btn" onClick={() => navigate('/establishments')}>
              Explorar estabelecimentos
            </button>
          </div>
        )}

        {!loading && filtered.map((item) => (
          <div
            key={item.id}
            className="fav-card"
            onClick={() => navigate(`/establishment/${item.place.id}`)}
          >
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=200&auto=format&fit=crop"
              alt={item.place.name}
              className="fav-card-image"
            />
            <div className="fav-card-info">
              <div className="fav-card-header">
                <h3 className="fav-card-title">{item.place.name}</h3>
              </div>
              {item.place.city && (
                <div className="fav-card-location">
                  <MapPin size={13} />
                  <span>{item.place.city}</span>
                </div>
              )}
              {item.place.category && (
                <div className="fav-card-tags">
                  <span className="fav-card-tag">{item.place.category.name}</span>
                </div>
              )}
            </div>
            <button
              className={`favorite-btn ${isFavorite(item.place.id) ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(item.place.id);
              }}
              disabled={isToggling(item.place.id)}
              aria-label={isFavorite(item.place.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              style={{ opacity: isToggling(item.place.id) ? 0.5 : 1 }}
            >
              <Heart size={20} fill={isFavorite(item.place.id) ? 'currentColor' : 'none'} />
            </button>
          </div>
        ))}
      </main>

      <nav className="bottom-nav">
        <BottomNav />
      </nav>
    </div>
  );
};

export default FavoritesPage;
