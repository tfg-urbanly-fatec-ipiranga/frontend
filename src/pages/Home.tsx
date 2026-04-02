import React, { useState, useEffect, useRef, type FC } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { Search, SlidersHorizontal, Heart, Home, Compass, User, Menu, X, Store } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get<Place[]>('/places/searchByName', {
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

  // Lógica combinada: busca + chips
  // - Só busca: exibe resultados da busca
  // - Só chips: exibe places dos chips
  // - Ambos: interseção (places que estão na busca E têm a tag ativa)
  const displayedPlaces = (() => {
    const hasSearch = searchTerm.trim().length > 0;
    const hasChips = activeChips.length > 0;

    if (hasSearch && hasChips) {
      const chipIds = new Set(filteredPlaces.map(p => p.id));
      return searchPlaces.filter(p => chipIds.has(p.id));
    }
    if (hasSearch) return searchPlaces;
    if (hasChips) return filteredPlaces;
    return [];
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
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
            <div className="profile-pic">
              <img src="https://ui-avatars.com/api/?name=John+Doe&background=EB6B3D&color=fff" alt="Profile" style={{ width: '100%', borderRadius: '50%' }} />
            </div>
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
            <button className="filter-button">
              <SlidersHorizontal size={20} />
            </button>
          </div>

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
                navigate('/login');
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
