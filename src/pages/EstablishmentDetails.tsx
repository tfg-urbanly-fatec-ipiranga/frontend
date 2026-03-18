import { type FC } from 'react';
import { ArrowLeft, Share2, Heart, Star, Clock, Map as MapIcon, Phone, Settings } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlaceDetails } from '../hooks/usePlaceDetails';
import './EstablishmentDetails.css';

const EstablishmentDetailsPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { place, loading, error } = usePlaceDetails(id);
  if (loading) {
    return (
      <div className="establishment-details-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Carregando detalhes...</p>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="establishment-details-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px' }}>
        <p style={{ color: 'red' }}>{error || 'Estabelecimento não encontrado.'}</p>
        <button className="action-button" onClick={() => navigate(-1)} style={{ marginTop: '16px' }}>Voltar</button>
      </div>
    );
  }

  // Fallbacks for missing data
  const imageUrl = place.photos?.[0] || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600&auto=format&fit=crop';
  const hours = `${place.openingTime} - ${place.closingTime}`;

  return (
    <div className="establishment-details-page">
      <header className="details-header">
        <button className="icon-button back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <span className="brand-text">Urbanly</span>
        <button className="icon-button share-button" onClick={() => navigate(`/edit-establishment/${id}`)}>
          <Settings size={20} />
        </button>
      </header>

      <main>
        <section className="hero-section">
          <img src={imageUrl} alt={place.name} className="hero-image" />
          <button className="floating-favorite">
            <Heart size={24} fill="none" />
          </button>
        </section>

        <section className="info-section">
          <div className="info-header">
            <h1 className="establishment-name">{place.name}</h1>
            {place.active && <span className="status-badge">Ativo</span>}
          </div>

          <div className="meta-info">
            <div className="rating-info">
              <Star size={16} className="rating-star" fill="currentColor" />
              <span>4.8</span>
              <span className="review-count">(124 reviews)</span>
            </div>
            {place.city && <span className="distance-text">{place.city}</span>}
          </div>

          <div className="tags-container">
            {place.tags?.map(tag => (
              <span key={tag.id} className="tag-pill">{tag.name}</span>
            ))}
          </div>

          <div className="details-card">
            <div className="detail-group">
              <span className="detail-label">Horários</span>
              <div className="hours-info">
                <div className="icon-circle">
                  <Clock size={20} />
                </div>
                <span>{hours}</span>
              </div>
            </div>

            <div className="detail-group">
              <span className="detail-label">Endereço</span>
              <p className="about-text">{place.address}</p>
            </div>

            <div className="detail-group">
              <span className="detail-label">Sobre</span>
              <p className="about-text">{place.description || 'Nenhuma descrição disponível.'}</p>
            </div>
          </div>
        </section>

        <section className="actions-row">
          <button className="action-button">
            <MapIcon size={20} className="action-icon" />
            <span>Directions</span>
          </button>
          <button className="action-button">
            <Phone size={20} className="action-icon" />
            <span>Contact</span>
          </button>
        </section>
      </main>
    </div>
  );
};

export default EstablishmentDetailsPage;
