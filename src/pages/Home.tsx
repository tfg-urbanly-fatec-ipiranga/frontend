import React, { useState, useEffect, useRef, useMemo, type FC } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { Search, SlidersHorizontal, Heart, Home, Compass, User, Menu, X, Store } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuthContext } from "../context/AuthContext";
import './Home.css';
import api from '../services/api';
import BottomNav from '../components/BottomNav';

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
  latitude: number;
  longitude: number;
}

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get<Place[]>('/places/search', {
          params: { searchTerm: searchTerm.trim() },
        });
        setSearchPlaces(res.data);
      } catch {
        setSearchPlaces([]);
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
      result = [];
    }

    if (selectedCities.length > 0) {
      result = result.filter(p => p.city && selectedCities.includes(p.city));
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

    console.log('[chip click]', tagName, '| isActive:', isActive, '| newActive:', newActive);
    setActiveChips(newActive);

    if (!isActive) {
      try {
        console.log('[fetch] GET /places/findByTag?tag=', tagName);
        const res = await api.get<Place[]>('/places/findByTag', { params: { tag: tagName } });
        console.log('[fetch] resultado:', res.data);
        setFilteredPlaces(prev => {
          const ids = new Set(prev.map(p => p.id));
          return [...prev, ...res.data.filter(p => !ids.has(p.id))];
        });
      } catch (err: any) {
        console.error('[fetch] erro ao buscar places por tag:', err?.response?.status, err?.response?.data ?? err?.message);
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
          console.log('[fetch] places após remoção de chip:', unique);
          setFilteredPlaces(unique);
        } catch (err: any) {
          console.error('[fetch] erro ao atualizar places:', err?.response?.status, err?.response?.data ?? err?.message);
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
          {displayedPlaces
            .filter(place => place.latitude != null && place.longitude != null)
            .map(place => (
              <Marker key={place.id} position={[place.latitude, place.longitude]}>
                <Popup>{place.name}</Popup>
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
              className={`filter-button${searchPlaces.length > 0 ? ' filter-button--active' : ''}`}
              onClick={() => { if (searchPlaces.length > 0) setFilterOpen(o => !o); }}
              title={searchPlaces.length > 0 ? 'Filtros avançados' : 'Faça uma busca para usar filtros'}
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>

          {filterOpen && searchPlaces.length > 0 && (
            <div className="filter-panel">
              <div className="filter-panel-header">
                <span className="filter-panel-title">Filtros Avançados</span>
                <button className="filter-panel-close" onClick={() => setFilterOpen(false)}>✕</button>
              </div>

              {availableCities.length > 0 ? (
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
              ) : (
                <p className="filter-empty">Nenhum filtro disponível para esses resultados.</p>
              )}

              <div className="filter-actions">
                <button
                  className="filter-btn-clear"
                  onClick={() => setSelectedCities([])}
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

        <div className="bottom-content">
          {/* Botão flutuante de resultados */}
          {displayedPlaces.length > 0 && searchTerm.trim() && (
            <button
              className="view-results-btn"
              onClick={() => navigate('/establishments', { state: { places: displayedPlaces } })}
            >
              Ver {displayedPlaces.length} resultado{displayedPlaces.length !== 1 ? 's' : ''} na lista
            </button>
          )}
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
