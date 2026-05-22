import { useState, useRef, useEffect, type FC } from 'react';
import { Search, SlidersHorizontal, ArrowLeft, Heart, User, Menu, Plus, MessageSquare } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlaces } from '../hooks/usePlaces';
import { useFavorites } from '../hooks/useFavorites';
import { useAuthContext } from "../context/AuthContext";
import { useUserLocation } from "../context/LocationContext";
import { useTags } from '../hooks/useTags';
import type { Place } from '../types/place';
import './EstablishmentList.css';
import BottomNav from '../components/BottomNav';
import React from 'react';

const getPriceLabel = (level?: string) => {
  switch (level) {
    case 'ONE': return '$';
    case 'TWO': return '$$';
    case 'THREE': return '$$$';
    case 'FOUR': return '$$$$';
    case 'FIVE': return '$$$$$';
    default: return '';
  }
};

const EstablishmentListPage: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { location: userLocation } = useUserLocation();
  const statePlaces = (location.state as { places?: Place[] } | null)?.places;

  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { places: fetchedPlaces, loading, error } = usePlaces();
  const { logout, isAuthenticated  } = useAuthContext();
  const { isFavorite, isToggling, toggleFavorite } = useFavorites();
  const { tags, loading: tagsLoading } = useTags();
  const storedUser = localStorage.getItem("user");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const parsedUser = React.useMemo(() => {
  try {
    if (!storedUser) return null;

    const parsed = JSON.parse(storedUser);
    return parsed.user ?? parsed;
  } catch {
    return null;
  }
  }, [storedUser]);
  const isAdmin = parsedUser?.role === 'ADMIN';


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

  const fallbackImage =
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=200&auto=format&fit=crop';

  const getPlaceImage = (place: Place) => {
    const primaryPhoto = place.photos?.find(
      (photo: { isPrimary: any; }) => photo.isPrimary
    );

    const firstPhoto = place.photos?.[0];

    return primaryPhoto?.url || firstPhoto?.url || fallbackImage;
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const toRad = (value: number) => (value * Math.PI) / 180;

    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  type TagStyle = {
    bg: string;
    border: string;
    color: string;
  };

  const tagColors: Record<string, TagStyle> = {
    vegano: {
      bg: '#ECFDF5',
      border: '#10B981',
      color: '#064E3B'
    },

    saudável: {
      bg: '#F0FDF4',
      border: '#22C55E',
      color: '#14532D'
    },

    'pet-friendly': {
      bg: '#FFFBEB',
      border: '#F59E0B',
      color: '#78350F'
    },

    wifi: {
      bg: '#EFF6FF',
      border: '#3B82F6',
      color: '#1E3A8A'
    },

    acessível: {
      bg: '#F0F9FF',
      border: '#0EA5E9',
      color: '#0C4A6E'
    },

    delivery: {
      bg: '#FFF1F2',
      border: '#E11D48',
      color: '#881337'
    },

    brunch: {
      bg: '#FFFBEB',
      border: '#FBBF24',
      color: '#713F12'
    },

    artesanal: {
      bg: '#FFF7ED',
      border: '#F97316',
      color: '#7C2D12'
    },

    aconchegante: {
      bg: '#FDF2F8',
      border: '#EC4899',
      color: '#831843'
    },

    romântico: {
      bg: '#FCE7F3',
      border: '#DB2777',
      color: '#831843'
    },

    'música ao vivo': {
      bg: '#F5F3FF',
      border: '#7C3AED',
      color: '#3B0764'
    },

    rooftop: {
      bg: '#EEF2FF',
      border: '#4F46E5',
      color: '#1E1B4B'
    },

    'ao ar livre': {
      bg: '#F7FEE7',
      border: '#84CC16',
      color: '#365314'
    },

    família: {
      bg: '#FFFBEB',
      border: '#F59E0B',
      color: '#78350F'
    },

    estacionamento: {
      bg: '#F3F4F6',
      border: '#6B7280',
      color: '#111827'
    }
  };
  const handleFavorites = (
    e: React.MouseEvent<HTMLButtonElement>,
    placeId: string
  ) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    toggleFavorite(placeId);
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
        <div className="brand-text" onClick={() => navigate('/home')} >Urbanly</div>
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
                  {isAdmin && (
                    <>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate('/register-establishment')}
                      >
                        <Plus size={18} />
                        <span>Cadastrar Estabelecimento</span>
                      </button>

                      <button
                        className="dropdown-item"
                        onClick={() => navigate('/admin/reviews')}
                      >
                        <MessageSquare size={18} />
                        <span>Gerenciar Avaliações</span>
                      </button>

                      <div
                        style={{
                          height: '1px',
                          backgroundColor: '#e5e7eb',
                          margin: '4px 0'
                        }}
                      />
                    </>
                  )}
                  {isAuthenticated? (
                    <button
                      className="dropdown-item"
                      onClick={() => {
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
                  ) : (
                    <button
                      className="dropdown-item"
                      onClick={() => navigate('/login')}
                      style={{ color: '#ef4444' }}
                    >
                      <User size={18} />
                      <span>Logar</span>
                    </button>                    
                  )
                  }
                </div>
              )}
          </div>
        </div>
      </header>

      <section className="list-controls">
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="search-bar-container" style={{ flex: 1 }}>
            <input type="text" placeholder="Buscar locais..." className="search-input" />
            <Search size={20} className="search-icon" />
          </div>
          <button className="filter-button">
            <SlidersHorizontal size={20} />
          </button>
        </div>
        
        <div className="chips-scroll">
          {tagsLoading && <span style={{ fontSize: '13px', color: '#9CA3AF', padding: '6px 0' }}>Carregando tags...</span>}
            {tags.map(tag => {
              const colors = tagColors[tag.name] || {
                bg: '#F3F4F6',
                color: '#374151'
              };

              const isActive = activeChips.includes(tag.name);

              return (
                <div
                  key={tag.id}
                  className={`chip ${isActive ? 'active' : ''}`}
                  onClick={() => toggleChip(tag.name)}
                  style={{
                    backgroundColor: isActive ? '#EB6B3D' : colors.bg,
                    color: isActive ? '#FFFFFF' : colors.color,
                    border: 'none'
                  }}
                >
                  {tag.name.charAt(0).toUpperCase() + tag.name.slice(1)}
                </div>
              );
            })}
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
            
            <img src={getPlaceImage(place)} alt={place.name} className="card-image"/>
            <div className="card-info">
              {place.priceLevel && (
                <div className="card-price">
                  <span className="price-icon">
                    {getPriceLabel(place.priceLevel)}
                  </span>
                </div>
              )}
              <div className="card-header">
                <h3 className="card-title">{place.name}</h3>
                <span className="distance-badge">
                  {userLocation
                    ? `${calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        place.latitude,
                        place.longitude
                      ).toFixed(1)} KM`
                    : '-- KM'}
                </span>
                
              </div>
              <p className="card-description">{place.description}</p>
              <div className="card-tags">
                {place.placeTags?.slice(0, 3).map((pt) => (
                  <span key={pt.tag.name} className="card-tag">
                    {pt.tag.name}
                  </span>
                ))}

                {place.placeTags && place.placeTags.length > 3 && (
                  <span className="card-tag more-tags">
                    +{place.placeTags.length - 3}
                  </span>
                )}
              </div>
              <button
                className={`favorite-btn ${isFavorite(place.id) ? 'active' : ''}`}
                onClick={(e) => handleFavorites(e, place.id)}
                disabled={isToggling(place.id)}
                aria-label={
                  isFavorite(place.id)
                    ? 'Remover dos favoritos'
                    : 'Adicionar aos favoritos'
                }
                style={{ opacity: isToggling(place.id) ? 0.5 : 1 }}>
                <Heart size={20} fill={isFavorite(place.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        ))}
      </main>

      {showLoginModal && (
        <div
          className="login-modal-overlay"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="login-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Salvar nos favoritos?</h3>

            <p>
              Faça login para adicionar o estabelecimentos aos seus favoritos.
            </p>

            <div className="login-modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowLoginModal(false)}
              >
                Cancelar
              </button>

              <button
                className="login-btn"
                onClick={() => navigate('/login')}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bottom-nav">
        <BottomNav />
      </nav>
    </div>
  );
};

export default EstablishmentListPage;

