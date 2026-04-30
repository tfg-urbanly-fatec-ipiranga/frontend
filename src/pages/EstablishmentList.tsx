import { useState, useRef, useEffect, type FC } from 'react';
import { Search, SlidersHorizontal, ArrowLeft, Heart, User, Menu, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlaces } from '../hooks/usePlaces';
import { useFavorites } from '../hooks/useFavorites';
import { useAuthContext } from "../context/AuthContext";
import { useTags } from '../hooks/useTags';
import type { Place } from '../types/place';
import './EstablishmentList.css';
import BottomNav from '../components/BottomNav';
import React from 'react';

const EstablishmentListPage: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const statePlaces = (location.state as { places?: Place[] } | null)?.places;

  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { places: fetchedPlaces, loading, error } = usePlaces();
  const { logout, isAuthenticated  } = useAuthContext();
  const { isFavorite, isToggling, toggleFavorite } = useFavorites();
  const { tags, loading: tagsLoading } = useTags();
  const storedUser = localStorage.getItem("user");
  const parsedUser = storedUser ? JSON.parse(storedUser).user || JSON.parse(storedUser) : null;
  
  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "";
    const firstInitial = firstName ? firstName[0].toUpperCase() : "";
    const lastInitial = lastName ? lastName[0].toUpperCase() : "";
    return firstInitial + lastInitial;
  };


  // Usa os places vindos do router state (busca da home) ou os buscados da API
  const allPlaces = statePlaces ?? fetchedPlaces;

  // Filtra por chips ativos; se nenhum selecionado, exibe todos
  const places = activeChips.length === 0
    ? allPlaces
    : allPlaces?.filter(place =>
        place.placeTags?.some(pt => activeChips.includes(pt.tag.name))
      );


  const toggleChip = (chip: string) => {
    if (activeChips.includes(chip)) {
      setActiveChips(activeChips.filter((c: string) => c !== chip));
    } else {
      setActiveChips([...activeChips, chip]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="establishment-list-page">
      <header className="list-header">
        <button className="back-button" onClick={() => navigate('/home')}>
          <ArrowLeft size={24} />
        </button>
        <div className="brand-text">Urbanly</div>
        <div className="header-right">
          {isAuthenticated && (
            <div className="profile-pic">
              {parsedUser?.avatar ? (
                <img
                  src={parsedUser.avatar}
                  alt="Profile"
                  style={{ width: "100%", borderRadius: "50%" }}
                />
              ) : (
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#EB6B3D",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold"
                  }}
                >
                  {getInitials(parsedUser?.firstName, parsedUser?.lastName)}
                </div>
              )}
            </div>
          )}
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
                    // Clear token/user data (assuming localStorage for now)
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    logout();
                    navigate('/home');
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

      <section className="list-controls">
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="search-bar-container" style={{ flex: 1 }}>
            <input type="text" placeholder="Vegan" className="search-input" />
            <Search size={20} className="search-icon" />
          </div>
          <button className="filter-button">
            <SlidersHorizontal size={20} />
          </button>
        </div>

        <div className="chips-scroll">
          {tagsLoading && <span style={{ fontSize: '13px', color: '#9CA3AF', padding: '6px 0' }}>Carregando tags...</span>}
          {tags.map(tag => (
            <div
              key={tag.id}
              className={`chip ${activeChips.includes(tag.name) ? 'active' : ''}`}
              onClick={() => toggleChip(tag.name)}
            >
              {tag.name}
            </div>
          ))}
        </div>
      </section>

      <main className="list-content">
        {places && (
          <div style={{ padding: '8px 16px 0', fontSize: '13px', color: '#6B7280' }}>
            {places.length} resultado{places.length !== 1 ? 's' : ''}{statePlaces ? ' da sua busca' : ''}{activeChips.length > 0 ? ` filtrado${places.length !== 1 ? 's' : ''}` : ''}
          </div>
        )}
        {!statePlaces && loading && <div style={{ textAlign: 'center', padding: '20px' }}>Carregando estabelecimentos...</div>}
        {!statePlaces && error && <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>Erro ao buscar locais: {error}</div>}
        {places && places.map(place => (
          <div key={place.id} className="establishment-card" onClick={() => navigate(`/establishment/${place.id}`)}>
            {/* Placeholder until photos logic is added */}
            <img src={'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=200&auto=format&fit=crop'} alt={place.name} className="card-image" />
            <div className="card-info">
              <div className="card-header">
                <h3 className="card-title">{place.name}</h3>
                <span className="distance-badge">-- KM</span>
              </div>
              <p className="card-description">{place.description}</p>
              <div className="card-tags">
                {place.placeTags?.map(pt => (
                  <span key={pt.tag.name} className="card-tag">{pt.tag.name}</span>
                ))}
              </div>
              <button
                className={`favorite-btn ${isFavorite(place.id) ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); toggleFavorite(place.id); }}
                disabled={isToggling(place.id)}
                aria-label={isFavorite(place.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                style={{ opacity: isToggling(place.id) ? 0.5 : 1 }}
              >
                <Heart size={20} fill={isFavorite(place.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        ))}
      </main>

      <nav className="bottom-nav">
        <BottomNav />
      </nav>
    </div>
  );
};

export default EstablishmentListPage;

