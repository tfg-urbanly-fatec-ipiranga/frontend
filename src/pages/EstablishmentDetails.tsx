import { type FC } from 'react';
import { ArrowLeft, Heart, Star, Clock, Map as MapIcon, Phone, Settings, MessageSquare, User } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlaceDetails } from '../hooks/usePlaceDetails';
import { useFavorites } from '../hooks/useFavorites';
import { usePlaceReviews } from '../hooks/usePlaceReviews';
import { usePlacePhotos } from '../hooks/usePlacePhotos';
import './EstablishmentDetails.css';
import React from 'react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600&auto=format&fit=crop';

const EstablishmentDetailsPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { place, loading: placeLoading, error } = usePlaceDetails(id);
  const { isFavorite, isToggling, toggleFavorite } = useFavorites();
  const { photos, loading: photosLoading } = usePlacePhotos(id);
  //const { reviews, loading: reviewsLoading } = usePlaceReviews(id);
  const { reviews, averageRating, loading: reviewsLoading } = usePlaceReviews(id);

  const loading = placeLoading || photosLoading || reviewsLoading;

  if (loading) {
    return (
      <div className="establishment-details-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Carregando detalhes...</p>
      </div>
    );
  }

  if (error || !place) {
    const isUnauthorized = error?.toLowerCase().includes('unauthorized') || error?.toLowerCase().includes('401');
    return (
      <div className="establishment-details-page" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        
        {/* Botão de voltar no topo */}
        <header className="details-force-login-header">
          <button className="icon-button back-button-force-login" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <span className="brand-text-force-login">Urbanly</span>
        </header>

        <main>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '24px', textAlign: 'center' }}>
            {isUnauthorized ? (
              <>
                <p style={{ fontSize: '18px', color: '#374151' }}>Crie uma conta para ver mais informações</p>
                <button
                  className="action-button"
                  onClick={() => navigate('/register')}
                  style={{ marginTop: '8px', backgroundColor: '#EB6B3D', color: '#fff', border: 'none', padding: '14px 64px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', width: '80%', maxWidth: '320px' }}
                >
                  Criar conta
                </button>
                <p style={{ fontSize: '14px', color: '#6B7280' }}>
                  Já tem uma conta?{" "}
                  <span style={{ color: '#EB6B3D', cursor: 'pointer' }} onClick={() => navigate('/login')}>
                    Entrar
                  </span>
                </p>
              </>
            ) : (
              <>
                <p style={{ color: 'red' }}>{error || 'Estabelecimento não encontrado.'}</p>
                <button className="action-button" onClick={() => navigate(-1)} style={{ marginTop: '16px' }}>
                  Voltar
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }


  // Resolve image: prefer primary photo, then first photo, then fallback
  const primaryPhoto = photos.find(p => p.isPrimary) ?? photos[0];
  const imageUrl = primaryPhoto?.url ?? FALLBACK_IMAGE;

  // Tags come from placeTags[].tag.name
  const tags = place.placeTags?.map(pt => pt.tag.name) ?? [];

  // Horários
  const hours = place.openingTime && place.closingTime
    ? `${place.openingTime} - ${place.closingTime}`
    : 'Horário não disponível';


  
  // Rating
  const ratingDisplay = averageRating !== null
    ? averageRating.toFixed(1)
    : '0';
  const reviewCount = reviews.length;
  

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
        {/* Hero */}
        <section className="hero-section">
          <img src={imageUrl} alt={place.name} className="hero-image" />
          <button
            className={`floating-favorite ${isFavorite(place.id) ? 'active' : ''}`}
            onClick={() => toggleFavorite(place.id)}
            disabled={isToggling(place.id)}
            aria-label={isFavorite(place.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            style={{ opacity: isToggling(place.id) ? 0.5 : 1 }}
          >
            <Heart size={24} fill={isFavorite(place.id) ? 'currentColor' : 'none'} />
          </button>
        </section>

        {/* Info */}
        <section className="info-section">
          <div className="info-header">
            <h1 className="establishment-name">{place.name}</h1>
            {place.active && <span className="status-badge">Aberto</span>}
          </div>

          <div className="meta-info">
            <div className="rating-info">
              <Star size={16} className="rating-star" fill="currentColor" />
              <span>{ratingDisplay}</span>
              <span className="review-count">({reviewCount} avaliações)</span>
            </div>
            {place.city && <span className="distance-text">{place.city}</span>}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="tags-container">
              {tags.map(tagName => (
                <span key={tagName} className="tag-pill">{tagName}</span>
              ))}
            </div>
          )}

          {/* Category */}
          {place.category && (
            <div className="tags-container" style={{ marginTop: tags.length > 0 ? '8px' : '0' }}>
              <span className="tag-pill" style={{ background: '#EEF2FF', color: '#4F46E5', borderColor: 'rgba(79,70,229,0.1)' }}>
                {place.category.name}
              </span>
            </div>
          )}

          {/* Details card */}
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

            {place.address && (
              <div className="detail-group">
                <span className="detail-label">Endereço</span>
                <p className="about-text">{place.address}</p>
              </div>
            )}

            <div className="detail-group">
              <span className="detail-label">Sobre</span>
              <p className="about-text">{place.description || 'Nenhuma descrição disponvel.'}</p>
            </div>
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="details-card">
              <div className="detail-group" style={{ marginBottom: '16px' }}>
                <span className="detail-label">
                  <MessageSquare size={12} style={{ display: 'inline', marginRight: '6px' }} />
                  Avaliações
                </span>
              </div>
              <div className="reviews-list">
                {reviews.map(review => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <div className="review-avatar">
                        <User size={16} />
                      </div>
                      <div className="review-meta">
                        <span className="reviewer-name">
                          {review.user.firstName} {review.user.lastName}
                        </span>
                        <div className="review-stars">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              fill={i < review.rating ? 'currentColor' : 'none'}
                              className={i < review.rating ? 'rating-star' : 'star-empty'}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="review-comment">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <section className="actions-row">
          <button
            className="action-button"
            onClick={() => {
              if (place.latitude && place.longitude) {
                window.open(`https://maps.google.com/?q=${place.latitude},${place.longitude}`, '_blank');
              }
            }}
          >
            <MapIcon size={20} className="action-icon" />
            <span>Direções</span>
          </button>
          <button className="action-button">
            <Phone size={20} className="action-icon" />
            <span>Contato</span>
          </button>
        </section>
      </main>
    </div>
  );
};

export default EstablishmentDetailsPage;
