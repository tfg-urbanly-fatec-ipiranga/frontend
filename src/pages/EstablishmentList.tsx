import { useState, useRef, useEffect, type FC } from 'react';
import { Search, SlidersHorizontal, ArrowLeft, Heart, Home, Compass, User, Menu, Star, Plus } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { usePlaces } from '../hooks/usePlaces';
import type { Place } from '../types/place';
import './EstablishmentList.css';
import BottomNav from '../components/BottomNav';

const EstablishmentListPage: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const statePlaces = (location.state as { places?: Place[] } | null)?.places;

  const [activeChips, setActiveChips] = useState<string[]>(['VEGAN']);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { places: fetchedPlaces, loading, error } = usePlaces();

  // Usa os places vindos do router state (busca da home) ou os buscados da API
  const places = statePlaces ?? fetchedPlaces;

  const chips = ['VEGAN', 'COZY', 'ROOFTOP', 'FUN'];



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
          <div className="profile-pic">
            <img src="https://ui-avatars.com/api/?name=Admin+User&background=EB6B3D&color=fff" alt="Profile" style={{ width: '100%', borderRadius: '50%' }} />
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
                    // Clear token/user data (assuming localStorage for now)
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
          {chips.map(chip => (
            <div 
              key={chip} 
              className={`chip ${activeChips.includes(chip) ? 'active' : ''}`}
              onClick={() => toggleChip(chip)}
            >
              {chip}
            </div>
          ))}
        </div>
      </section>

      <main className="list-content">
        {statePlaces && (
          <div style={{ padding: '8px 16px 0', fontSize: '13px', color: '#6B7280' }}>
            {statePlaces.length} resultado{statePlaces.length !== 1 ? 's' : ''} da sua busca
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
                {place.tags?.map(tag => (
                  <span key={tag.id} className="card-tag">{tag.name}</span>
                ))}
              </div>
              <button className={`favorite-btn`} onClick={(e) => e.stopPropagation()}>
                <Heart size={20} fill={'none'} />
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
