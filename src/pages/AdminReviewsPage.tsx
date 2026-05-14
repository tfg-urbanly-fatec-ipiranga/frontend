import React from 'react';
import { ArrowLeft, Star, User, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePendingReviews } from '../hooks/usePendingReviews';
import api from '../services/api';
import './AdminReviewsPage.css';
import { toast } from 'react-toastify';

const AdminReviewsPage = () => {
  const navigate = useNavigate();

  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const { reviews, loading, error } = usePendingReviews();

  const [selectedPlace, setSelectedPlace] = React.useState('all');

    async function handleApprove(id: string) {
      try {
        setActionLoading(`approve-${id}`);

        await api.patch(`/reviews/${id}/approve`);

        setLocalReviews((prev) => prev.filter((r) => r.id !== id));

        toast.success('Avaliação aprovada com sucesso');
      } catch {
        toast.error('Erro ao aprovar avaliação');
      } finally {
        setActionLoading(null);
      }
    }

  // reject
    async function handleReject(id: string) {
      try {
        setActionLoading(`reject-${id}`);

        await api.patch(`/reviews/${id}/reject`);

        setLocalReviews((prev) => prev.filter((r) => r.id !== id));

        toast.success('Avaliação rejeitada com sucesso');
      } catch {
        toast.error('Erro ao rejeitar avaliação');
      } finally {
        setActionLoading(null);
      }
    }

  // estado local para atualizar UI
  const [localReviews, setLocalReviews] = React.useState(reviews);

  React.useEffect(() => {
    setLocalReviews(reviews);
  }, [reviews]);

  // lista única de estabelecimentos
  const places = React.useMemo(() => {
    const map = new Map<string, string>();

    localReviews.forEach((r) => {
      map.set(r.place.id, r.place.name);
    });

    return Array.from(map.entries())
      .map(([id, name]) => ({
        id,
        name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [localReviews]);

  // filtro por estabelecimento
  const filteredReviews = React.useMemo(() => {
    if (selectedPlace === 'all') return localReviews;

    return localReviews.filter(
      (review) => review.place.id === selectedPlace
    );
  }, [localReviews, selectedPlace]);

  return (
    <div className="admin-reviews-page">

      <header className="admin-reviews-header">
        <button
          className="admin-back-button"
          onClick={() => navigate('/establishments')}
        >
          <ArrowLeft size={22} />
        </button>

        <span className="admin-brand-text">Urbanly</span>
      </header>

      <main className="admin-reviews-content">

        <div className="admin-reviews-title-area">
          <h1>Gerenciar Avaliações</h1>
          <p>Aprove ou rejeite comentários enviados pelos usuários</p>
        </div>

        <div className="admin-search-container">
          <select
            value={selectedPlace}
            onChange={(e) => setSelectedPlace(e.target.value)}
            className="admin-search-input"
            
          >
            <span className="admin-select-arrow">⌄</span>
            <option value="all">Todos os estabelecimentos</option>

            {places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="admin-status-message">
            Carregando avaliações...
          </div>
        )}

        {error && (
          <div className="admin-status-message error">
            {error}
          </div>
        )}

        {!loading && filteredReviews.length === 0 && (
          <div className="empty-reviews-card">
            Nenhuma avaliação encontrada.
          </div>
        )}

        {filteredReviews.map((review) => (
          <div key={review.id} className="review-admin-card">

            <div className="review-admin-top">

              <div className="review-admin-user">

                <div className="review-admin-avatar">
                  <User size={16} />
                </div>

                <div>
                  <span className="review-admin-name">
                    {review.user.firstName} {review.user.lastName}
                  </span>

                  <p className="review-admin-place">
                    {review.place.name}
                  </p>
                </div>

              </div>

              <div className="review-admin-stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < review.rating ? 'currentColor' : 'none'}
                    className={i < review.rating ? 'filled-star' : 'empty-star'}
                  />
                ))}
              </div>

            </div>

            {review.comment && (
              <p className="review-admin-comment">
                {review.comment}
              </p>
            )}

            <div className="review-admin-actions">

              <button
                className="approve-review-button"
                onClick={() => handleApprove(review.id)}
                disabled={actionLoading !== null}
              >
                {actionLoading === `approve-${review.id}` ? (
                  <div className="button-spinner" />
                ) : (
                  <>
                    <Check size={18} />
                    Aprovar
                  </>
                )}
              </button>

              <button
                className="reject-review-button"
                onClick={() => handleReject(review.id)}
                disabled={actionLoading !== null}
              >
                {actionLoading === `reject-${review.id}` ? (
                  <div className="button-spinner" />
                ) : (
                  <>
                    <X size={18} />
                    Rejeitar
                  </>
                )}
              </button>

            </div>

          </div>
        ))}

      </main>
    </div>
  );
};

export default AdminReviewsPage;