import React, { useState, type FC } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { Search, SlidersHorizontal, MapPin, Coffee, Utensils, Heart, Home, Compass, User, Menu, X, Star, Store } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Home.css';

// Fix for default marker icon issues in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const HomePage: FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeChips, setActiveChips] = useState<string[]>(['Vegan']);

  const chips = [
    { name: 'Vegan', icon: '🌱' },
    { name: 'Coffee', icon: '☕' },
    { name: 'Rooftop', icon: '🌇' },
    { name: 'Fuel', icon: '⛽' }
  ];

  const toggleChip = (name: string) => {
    if (activeChips.includes(name)) {
      setActiveChips(activeChips.filter(c => c !== name));
    } else {
      setActiveChips([...activeChips, name]);
    }
  };

  // Default coordinates (London as in reference, OR can use user location)
  const position: [number, number] = [-23.5505, -46.6333];

  return (
    <div className="home-page">
      {/* Leaflet Map */}
      <div className="map-container">
        <MapContainer 
          center={position} 
          zoom={13} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>
              The Green Bean Cafe
            </Popup>
          </Marker>
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
            <input type="text" placeholder="Procurar lugares" className="search-input" />
            <button className="filter-button">
              <SlidersHorizontal size={20} />
            </button>
          </div>

          <div className="chips-scroll">
            {chips.map(chip => (
              <div 
                key={chip.name} 
                className={`chip ${activeChips.includes(chip.name) ? 'active' : ''}`}
                onClick={() => toggleChip(chip.name)}
              >
                <span className="chip-icon">{chip.icon}</span>
                {chip.name}
              </div>
            ))}
          </div>
        </section>

        <div className="bottom-content">
          {/* Bottom Nav */}
          <nav className="bottom-nav">
            <Link to="/home" className="nav-item active">
              <Home size={22} />
              <span className="nav-label">Home</span>
            </Link>
            <Link to="/establishments" className="nav-item">
              <Compass size={22} />
              <span className="nav-label">Explorar</span>
            </Link>
            <Link to="#" className="nav-item">
              <Heart size={22} />
              <span className="nav-label">Favoritos</span>
            </Link>
            <Link to="/edit-profile" className="nav-item">
              <User size={22} />
              <span className="nav-label">Perfil</span>
            </Link>
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
