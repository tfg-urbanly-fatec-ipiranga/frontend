import { useState, useRef, useEffect, type FC } from 'react';
import { Search, SlidersHorizontal, ArrowLeft, Heart, User, Menu, Plus, MessageSquare, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlaces } from '../hooks/usePlaces';
import { useFavorites } from '../hooks/useFavorites';
import { useAuthContext } from "../context/AuthContext";
import { useUserLocation } from "../context/LocationContext";
import { useTags } from '../hooks/useTags';
import type { Place } from '../types/place';
import './EstablishmentList.css';
import BottomNav from '../components/BottomNav';
import api from '../services/api';
import { toast } from 'react-toastify';
import React from 'react';

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

const priceOptions = [
  { label: '$', value: 'ONE' },
  { label: '$$', value: 'TWO' },
  { label: '$$$', value: 'THREE' },
  { label: '$$$$', value: 'FOUR' },
  { label: '$$$$$', value: 'FIVE' },
];

const ratingOptions = [
  { label: 'Sem avaliação', value: 'none' },
  { label: '1+', value: '1-2' },
  { label: '2+', value: '2-3' },
  { label: '3+', value: '3-4' },
  { label: '4+', value: '4-5' },
];

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

  // Estados adicionados para busca e filtros avançados
  const [searchTerm, setSearchTerm] = useState('');
  const [searchPlaces, setSearchPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState(25);
  const [isClearFlashing, setIsClearFlashing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Busca por nome com debounce de 500ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchTerm.trim()) {
      setSearchPlaces([]);
      setFilterOpen(false);
      setSelectedCities([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get<Place[]>('/places/vibe-search', {
          params: { q: searchTerm.trim() },
        });
        setSearchPlaces(res.data);
        if (!res.data || res.data.length === 0) {
          toast.warn("Nenhum local atende a busca solicitada!");
        }
      } catch {
        toast.error("Erro ao fazer busca!");
        setSearchPlaces([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  const allPlaces = statePlaces ?? fetchedPlaces;

  // Lógica combinada de filterBasePlaces
  const filterBasePlaces = React.useMemo(() => {
    const hasSearch = searchTerm.trim().length > 0;
    const hasChips = activeChips.length > 0;

    if (hasSearch && hasChips) {
      const chipIds = new Set(filteredPlaces.map(p => p.id));
      return searchPlaces.filter(p => chipIds.has(p.id));
    }

    if (hasSearch) {
      return searchPlaces;
    }

    if (hasChips) {
      return filteredPlaces;
    }

    return allPlaces || [];
  }, [
    searchTerm,
    activeChips,
    filteredPlaces,
    searchPlaces,
    allPlaces
  ]);

  const availableCities = React.useMemo(
    () =>
      [...new Set(
        filterBasePlaces
          .map(p => p.city)
          .filter((c): c is string => Boolean(c))
      )],
    [filterBasePlaces]
  );

  const availableCategories = React.useMemo(
    () =>
      [...new Set(
        filterBasePlaces
          .map(p => p.category?.name)
          .filter((c): c is string => Boolean(c))
      )],
    [filterBasePlaces]
  );

  const availablePrices = React.useMemo(() => {
    if (!filterBasePlaces.length) return [];

    return priceOptions.filter(option =>
      filterBasePlaces.some(
        place => place.priceLevel === option.value
      )
    );
  }, [filterBasePlaces]);

  const availableRatings = React.useMemo(() => {
    if (!filterBasePlaces.length) return [];

    return ratingOptions.filter(option => {
      return filterBasePlaces.some(place => {
        const r = place.avgRating;

        switch (option.value) {
          case 'none':
            return r == null;

          case '1-2':
            return r != null && r >= 1 && r < 2;

          case '2-3':
            return r != null && r >= 2 && r < 3;

          case '3-4':
            return r != null && r >= 3 && r < 4;

          case '4-5':
            return r != null && r >= 4 && r <= 5;

          default:
            return false;
        }
      });
    });
  }, [filterBasePlaces]);

  // Lógica combinada final dos locais exibidos
  const places = React.useMemo(() => {
    let result = filterBasePlaces;

    if (selectedCities.length > 0) {
      result = result.filter(p => p.city && selectedCities.includes(p.city));
    }

    if (selectedCategories.length > 0) {
      result = result.filter(p => p.category?.name && selectedCategories.includes(p.category.name));
    }

    if (selectedRatings.length > 0) {
      result = result.filter(place => {
        const r = place.avgRating;

        return selectedRatings.some(range => {
          switch (range) {
            case 'none':
              return r == null;

            case '1-2':
              return r != null && r >= 1 && r < 2;

            case '2-3':
              return r != null && r >= 2 && r < 3;

            case '3-4':
              return r != null && r >= 3 && r < 4;

            case '4-5':
              return r != null && r >= 4 && r <= 5;

            default:
              return false;
          }
        });
      });
    }

    if (userLocation) {
      result = result.filter(place => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          place.latitude,
          place.longitude
        );

        return distance <= maxDistance;
      });
    }

    if (selectedPrices.length > 0) {
      result = result.filter(place =>
        place.priceLevel &&
        selectedPrices.includes(place.priceLevel)
      );
    }

    return result;
  }, [
    filterBasePlaces,
    selectedCities,
    selectedCategories,
    selectedRatings,
    selectedPrices,
    userLocation,
    maxDistance
  ]);

  const clearFilters = () => {
    setActiveChips([]);
    setFilteredPlaces([]);
  };

  const handleClearClick = () => {
    setIsClearFlashing(true);
    setTimeout(() => {
      clearFilters();
      setIsClearFlashing(false);
    }, 350);
  };

  const toggleChip = async (tagName: string) => {
    const isActive = activeChips.includes(tagName);
    const newActive = isActive
      ? activeChips.filter(c => c !== tagName)
      : [...activeChips, tagName];

    setActiveChips(newActive);

    if (!isActive) {
      try {
        const res = await api.get<Place[]>('/places/findByTag', { params: { tag: tagName } });
        setFilteredPlaces(prev => {
          const ids = new Set(prev.map(p => p.id));
          return [...prev, ...res.data.filter(p => !ids.has(p.id))];
        });
      } catch (err: any) {
        // silent
      }
    } else {
      if (newActive.length === 0) {
        setFilteredPlaces([]);
      } else {
        try {
          const results = await Promise.all(
            newActive.map(t => api.get<Place[]>('/places/findByTag', { params: { tag: t } }))
          );
          const allRes = results.flatMap(r => r.data);
          const unique = Array.from(new Map(allRes.map(p => [p.id, p])).values());
          setFilteredPlaces(unique);
        } catch (err: any) {
          // silent
        }
      }
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
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar locais..."
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            disabled={isSearching}
            className={`filter-button${filterOpen ? ' filter-button--active' : ''}`}
            onClick={() => {
              if (!isSearching) {
                setFilterOpen(o => !o);
              }
            }}
            title="Filtros avançados"
          >
            {isSearching ? (
              <div className="spinner" />
            ) : (
              <SlidersHorizontal size={20} />
            )}
          </button>
        </div>

        {filterOpen && !isSearching && (
          <div className="filter-panel">
            <div className="filter-panel-header">
              <span className="filter-panel-title">Filtros Avançados</span>
              <button className="filter-panel-close" onClick={() => setFilterOpen(false)}>✕</button>
            </div>

            {availableCities.length > 0 && (
              <div className="filter-section">
                <div className="filter-section-title">Cidade</div>
                <div className="filter-options">
                  {availableCities.map(city => (
                    <label key={city} className="filter-option">
                      <input
                        type="checkbox"
                        checked={selectedCities.includes(city)}
                        onChange={() =>
                          setSelectedCities(prev =>
                            prev.includes(city)
                              ? prev.filter(c => c !== city)
                              : [...prev, city]
                          )
                        }
                      />
                      <span>{city}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {availableCategories.length > 0 && (
              <div className="filter-section">
                <div className="filter-section-title">Categoria</div>
                <div className="filter-options">
                  {availableCategories.map(category => (
                    <label key={category} className="filter-option">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() =>
                          setSelectedCategories(prev =>
                            prev.includes(category)
                              ? prev.filter(c => c !== category)
                              : [...prev, category]
                          )
                        }
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {availableRatings.length > 0 && (
              <div className="filter-section">
                <div className="filter-section-title">Avaliação</div>
                <div className="filter-options">
                  {availableRatings.map(option => (
                    <label key={option.value} className="filter-option">
                      <input
                        type="checkbox"
                        checked={selectedRatings.includes(option.value)}
                        onChange={() =>
                          setSelectedRatings(prev =>
                            prev.includes(option.value)
                              ? prev.filter(v => v !== option.value)
                              : [...prev, option.value]
                          )
                        }
                      />
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#FBBF24' }}>★</span>
                        <span>{option.label}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {availablePrices.length > 0 && (
              <div className="filter-section">
                <div className="filter-section-title">Preço médio</div>
                <div className="filter-options">
                  {availablePrices.map(option => (
                    <label key={option.value} className="filter-option">
                      <input
                        type="checkbox"
                        checked={selectedPrices.includes(option.value)}
                        onChange={() =>
                          setSelectedPrices(prev =>
                            prev.includes(option.value)
                              ? prev.filter(v => v !== option.value)
                              : [...prev, option.value]
                          )
                        }
                      />
                      <span style={{ fontWeight: 700, letterSpacing: '0.5px', color: '#15803D' }}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {userLocation && (
              <div className="filter-section">
                <div className="filter-section-title">Distância máxima</div>
                <div className="distance-slider-wrapper">
                  <input
                    type="range"
                    min={2}
                    max={100}
                    step={1}
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(Number(e.target.value))}
                    className="distance-slider"
                  />
                  <div className="distance-slider-value">
                    Até {maxDistance} KM
                  </div>
                </div>
              </div>
            )}

            {availableCities.length === 0 && availableCategories.length === 0 && availableRatings.length === 0 && availablePrices.length === 0 && (
              <p className="filter-empty">
                Nenhum filtro disponível para esses resultados.
              </p>
            )}

            <div className="filter-actions">
              <button
                className="filter-btn-clear"
                onClick={() => {
                  setSelectedCities([]);
                  setSelectedCategories([]);
                  setSelectedRatings([]);
                  setSelectedPrices([]);
                }}
              >
                Limpar
              </button>
              <button
                className="filter-btn-apply"
                onClick={() => setFilterOpen(false)}
              >
                Aplicar
              </button>
            </div>
          </div>
        )}

        <div className="chips-scroll">
          {activeChips.length > 0 && (
            <button
              className={`chip-clear-btn${isClearFlashing ? ' flashing' : ''}`}
              onClick={handleClearClick}
              title="Limpar filtros"
            >
              ✕
            </button>
          )}
          {tagsLoading ? (
            <span style={{ fontSize: '13px', color: '#9CA3AF', padding: '6px 0' }}>Carregando tags...</span>
          ) : (
            tags.map(tag => {
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
                  style={
                    !isActive
                      ? {
                          backgroundColor: colors.bg,
                          color: colors.color,
                          border: 'none'
                        }
                      : { border: 'none' }
                  }
                >
                  {tag.name.charAt(0).toUpperCase() + tag.name.slice(1)}
                </div>
              );
            })
          )}
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
        {places && places.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6B7280', fontSize: '15px' }}>
            Nenhum resultado encontrado para a sua busca ou filtros.
          </div>
        )}
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

