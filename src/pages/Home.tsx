import React, { useState, useEffect, useRef, useMemo, useCallback, type FC } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import { Search, SlidersHorizontal, Heart, Home, Compass, User, Menu, X, Store } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuthContext } from "../context/AuthContext";
import { usePlaces } from '../hooks/usePlaces';
import './Home.css';
import api from '../services/api';
import BottomNav from '../components/BottomNav';

// Handler for Map Bounds
const MapBoundsHandler: FC<{ onBoundsChange: (bounds: L.LatLngBounds) => void }> = ({ onBoundsChange }) => {
  const map = useMap();
  
  useEffect(() => {
    // Initial bounds
    onBoundsChange(map.getBounds());
    
    // Update on move/zoom
    const handleMoveEnd = () => {
      onBoundsChange(map.getBounds());
    };
    
    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, onBoundsChange]);

  return null;
};

// Fix for default marker icon issues in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Tag {
  id: string;
  name: string;
}

interface Place {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  placeTags?: Array<{ tag: { name: string } }>;
  latitude: number;
  longitude: number;
  avgRating?: number;
}

interface PlacePhoto {
  id: string;
  url: string;
  isPrimary: boolean;
  caption?: string;
}

interface PlaceReview {
  id: string;
  rating: number;
}

// ─── Rich Popup Component ──────────────────────────────────────────────────────
interface PlacePopupProps {
  place: Place;
}

const PlacePopup: FC<PlacePopupProps> = ({ place }) => {
  const [details, setDetails] = useState<Place | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchAll = async () => {
      try {
        const [detailsRes, photosRes, reviewsRes] = await Promise.allSettled([
          api.get<Place>(`/places/${place.id}`),
          api.get<PlacePhoto[]>(`/place-photos/place/${place.id}`),
          api.get<PlaceReview[]>(`/reviews/place/${place.id}`),
        ]);

        if (cancelled) return;

        if (detailsRes.status === 'fulfilled') setDetails(detailsRes.value.data);

        if (photosRes.status === 'fulfilled') {
          const photos = photosRes.value.data;
          const primary = photos.find(p => p.isPrimary);
          setPhoto(primary?.url ?? photos[0]?.url ?? null);
        }

        if (reviewsRes.status === 'fulfilled') {
          const reviews = reviewsRes.value.data;
          if (reviews.length > 0) {
            const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            setAvgRating(Math.round(avg * 10) / 10);
          }
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [place.id]);

  const d = details ?? place;
  const categoryName = d.category?.name ?? (d.placeTags?.[0]?.tag?.name ?? null);

  return (
    <div className="map-popup">
      {photo && (
        <div className="map-popup__img-wrap">
          <img src={photo} alt={d.name} className="map-popup__img" />
        </div>
      )}
      {!photo && loading && (
        <div className="map-popup__img-wrap map-popup__img-wrap--skeleton" />
      )}
      <div className="map-popup__body">
        <p className="map-popup__name">{d.name}</p>
        {categoryName && (
          <span className="map-popup__category">{categoryName}</span>
        )}
        {d.address && (
          <p className="map-popup__address">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {d.address}{d.city ? `, ${d.city}` : ''}
          </p>
        )}
        {avgRating !== null && (
          <div className="map-popup__rating">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#FBBF24" stroke="#FBBF24" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>{avgRating.toFixed(1)}</span>
          </div>
        )}
        <a href={`/establishment/${place.id}`} className="map-popup__link">Ver detalhes →</a>
      </div>
    </div>
  );
};

const HomePage: FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchPlaces, setSearchPlaces] = useState<Place[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [isClearFlashing, setIsClearFlashing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const ratingOptions = [
    { label: 'Sem avaliação', value: 'none' },
    { label: '1+', value: '1-2' },
    { label: '2+', value: '2-3' },
    { label: '3+', value: '3-4' },
    { label: '4+', value: '4-5' },
  ];
  
  // Mantenha os estabelecimentos em um cache (buscados via hook usePlaces)
  const { places: allPlaces } = usePlaces();

  const { logout, isAuthenticated  } = useAuthContext();
  const storedUser = localStorage.getItem("user");
  const parsedUser = storedUser ? JSON.parse(storedUser).user || JSON.parse(storedUser) : null;

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "";
    const firstInitial = firstName ? firstName[0].toUpperCase() : "";
    const lastInitial = lastName ? lastName[0].toUpperCase() : "";
    return firstInitial + lastInitial;
  };


  // Fetch all tags on mount
  useEffect(() => {
    api.get<Tag[]>('/tags')
      .then(res => setTags(res.data))
      .catch(err => console.error('Erro ao buscar tags:', err))
      .finally(() => setLoadingTags(false));
  }, []);

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
        const res = await api.get<Place[]>('/places/search', {
          params: { searchTerm: searchTerm.trim() },
        });
        setSearchPlaces(res.data);
      } catch {
        setSearchPlaces([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  // Cidades únicas disponíveis nos resultados de busca
  const availableCities = useMemo(
    () => [...new Set(searchPlaces.map(p => p.city).filter((c): c is string => Boolean(c)))],
    [searchPlaces]
  );

  const availableCategories = useMemo(
    () => [...new Set(searchPlaces.map(p => p.category?.name).filter((c): c is string => Boolean(c))),],
    [searchPlaces]
  );

  const availableRatings = useMemo(() => {
    if (!searchPlaces.length) return [];

    return ratingOptions.filter(option => {
      return searchPlaces.some(place => {
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
  }, [searchPlaces]);


  // Lógica combinada: busca + chips + filtros avançados
  const displayedPlaces = (() => {
    const hasSearch = searchTerm.trim().length > 0;
    const hasChips = activeChips.length > 0;

    let result: Place[];
    if (hasSearch && hasChips) {
      const chipIds = new Set(filteredPlaces.map(p => p.id));
      result = searchPlaces.filter(p => chipIds.has(p.id));
    } else if (hasSearch) {
      result = searchPlaces;
    } else if (hasChips) {
      result = filteredPlaces;
    } else {
      // Ao abrir o app, sem haver feito nenhuma busca ou filtragem de tags,
      // todos os estabelecimentos da área visível no mapa devem aparecer.
      if (!allPlaces || !mapBounds) {
        result = [];
      } else {
        result = allPlaces.filter(p => {
          if (p.latitude == null || p.longitude == null) return false;
          return mapBounds.contains([p.latitude, p.longitude]);
        });
      }
    }

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

    return result;
  })();

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
          const allPlaces = results.flatMap(r => r.data);
          const unique = Array.from(new Map(allPlaces.map(p => [p.id, p])).values());
          setFilteredPlaces(unique);
        } catch (err: any) {
          // silent
        }
      }
    }
  };

  const defaultPosition: [number, number] = [-23.5505, -46.6333];

  return (
    <div className="home-page">
      {/* Leaflet Map */}
      <div className="map-container">
        <MapContainer
          center={defaultPosition}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <MapBoundsHandler onBoundsChange={setMapBounds} />
          
          {displayedPlaces
            .filter(place => place.latitude != null && place.longitude != null)
            .slice(0, 20)
            .map(place => (
              <Marker key={place.id} position={[place.latitude, place.longitude]}>
                <Popup minWidth={220} maxWidth={260} className="map-popup-leaflet">
                  <PlacePopup place={place} />
                </Popup>
              </Marker>
            ))}
          <ZoomControl position="bottomright" />
        </MapContainer>
      </div>

      {/* UI Overlays */}
      <div className="home-overlay">
      <header className="home-header">
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
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

        <section className="search-filter-area">
          <div className="search-bar-container">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Procurar lugares"
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button
            disabled={isSearching}
              className={`filter-button${searchPlaces.length > 0 ? ' filter-button--active' : ''}`}
              onClick={() => { if (searchTerm.trim().length > 0) { setFilterOpen(o => !o); }}}
              title={searchTerm.trim().length > 0 ? 'Filtros avançados' : 'Faça uma busca para usar filtros'}
            >
              {isSearching ? (
                <div className="spinner" />
              ) : (
                <SlidersHorizontal size={20} />
              )}
            </button>
          </div>

          {filterOpen && searchTerm.trim().length > 0 && (
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

          {availableCities.length === 0 && availableCategories.length === 0 && (
            <p className="filter-empty">
              Nenhum filtro disponível para esses resultados.
            </p>
          )}

              <div className="filter-actions">
                <button
                  className="filter-btn-clear"
                  onClick={() => {
                    setSelectedCities([])
                    setSelectedCategories([]);
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
            {loadingTags ? (
              <span className="chip-loading">Carregando...</span>
            ) : (
              tags.map(tag => (
                <div
                  key={tag.id}
                  className={`chip ${activeChips.includes(tag.name) ? 'active' : ''}`}
                  onClick={() => toggleChip(tag.name)}
                >
                  {tag.name.charAt(0).toUpperCase() + tag.name.slice(1)}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Botão flutuante de resultados - fixo acima da navbar */}
          {displayedPlaces.length > 0 && (searchTerm.trim() || activeChips.length > 0) && (
            <div className="view-results-wrapper">
              <button
                className="view-results-btn"
                onClick={() => navigate('/establishments', { state: { places: displayedPlaces } })}
              >
                <span className="view-results-btn__icon">▤</span>
                Ver {displayedPlaces.length} resultado{displayedPlaces.length !== 1 ? 's' : ''} na lista
                {activeChips.length > 0 && !searchTerm.trim() && (
                  <span className="view-results-btn__badge">{activeChips.length} filtro{activeChips.length !== 1 ? 's' : ''}</span>
                )}
              </button>
            </div>
          )}

        <div className="bottom-content">
          {/* Bottom Nav */}
          <nav className="bottom-nav">
            <BottomNav />
          </nav>
        </div>
      </div>

      {/* Hamburger Menu Modal */}
      {menuOpen && (
        <div className="menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="menu-content" onClick={e => e.stopPropagation()}>
            <Link to="/establishments" className="menu-item" onClick={() => setMenuOpen(false)}>
              <Store size={20} /> Estabelecimento
            </Link>
            <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '8px 0' }} />
            <button
              className="menu-item"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                logout();
                window.location.reload();
              }}
              style={{ color: '#ef4444', border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <User size={20} /> Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
