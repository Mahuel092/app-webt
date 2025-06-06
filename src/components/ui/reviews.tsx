'use client';

import { useState, useEffect } from 'react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Textarea } from './textarea';
import { Badge } from './badge';

interface Review {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  comment: string;
  created_at: string;
  user_name: string;
}

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  five_stars: number;
  four_stars: number;
  three_stars: number;
  two_stars: number;
  one_star: number;
}

interface ReviewsProps {
  productId: number;
  userId?: number;
  isAdmin?: boolean;
}

export function Reviews({ productId, userId, isAdmin = false }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?product_id=${productId}`);
      const data = await response.json();

      if (data.success) {
        setReviews(data.reviews);
        setStats(data.stats);

        // Verificar si el usuario ya reseñó
        if (userId) {
          const userReview = data.reviews.find((r: Review) => r.user_id === userId);
          if (userReview) {
            setUserHasReviewed(true);
            setUserRating(userReview.rating);
            setUserComment(userReview.comment || '');
          }
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitReview = async () => {
    if (!userId || userRating === 0) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          product_id: productId,
          rating: userRating,
          comment: userComment
        })
      });

      const data = await response.json();

      if (data.success) {
        await loadReviews();
        setUserHasReviewed(true);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error al enviar reseña');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteReview = async (reviewId: number) => {
    if (!isAdmin) return;

    if (!confirm('¿Estás seguro de que quieres eliminar esta reseña?')) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        await loadReviews();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Error al eliminar reseña');
    }
  };

  const renderStars = (rating: number, interactive = false, onStarClick?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => {
              if (interactive && onStarClick) {
                onStarClick(star);
              }
            }}
            className={`text-3xl ${
              interactive ? 'hover:scale-125 transition-all duration-200 cursor-pointer hover:drop-shadow-lg' : ''
            } ${
              star <= rating ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-300'
            }`}
            disabled={!interactive}
            style={{
              filter: star <= rating ? 'brightness(1.2)' : 'brightness(0.7)',
              textShadow: star <= rating ? '0 0 8px rgba(255, 193, 7, 0.6)' : 'none'
            }}
          >
            ⭐
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Cargando reseñas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {stats && stats.total_reviews > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Calificaciones</span>
              <Badge variant="secondary">{stats.total_reviews} reseñas</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Promedio */}
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {Number(stats.average_rating).toFixed(1)}
                </div>
                {renderStars(Math.round(Number(stats.average_rating)))}
                <p className="text-sm text-gray-600 mt-2">
                  Promedio de {stats.total_reviews} reseñas
                </p>
              </div>

              {/* Distribución */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = Number(stats[`${stars === 1 ? 'one' : stars === 2 ? 'two' : stars === 3 ? 'three' : stars === 4 ? 'four' : 'five'}_star${stars === 1 ? '' : 's'}`]);
                  const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;

                  return (
                    <div key={stars} className="flex items-center space-x-2">
                      <span className="text-sm w-3">{stars}</span>
                      <span className="text-yellow-400">⭐</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario para nueva reseña */}
      {userId && (
        <Card>
          <CardHeader>
            <CardTitle>
              {userHasReviewed ? 'Actualizar tu reseña' : 'Escribir una reseña'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tu calificación
              </label>
              {renderStars(userRating, true, setUserRating)}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Comentario (opcional)
              </label>
              <Textarea
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="Comparte tu experiencia con este producto..."
                className="min-h-[100px]"
              />
            </div>

            <Button
              onClick={submitReview}
              disabled={userRating === 0 || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Enviando...' : userHasReviewed ? 'Actualizar Reseña' : 'Enviar Reseña'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lista de reseñas */}
      <Card>
        <CardHeader>
          <CardTitle>Reseñas de clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">💭</div>
              <p className="text-gray-600">
                Aún no hay reseñas para este producto.
              </p>
              {userId && (
                <p className="text-sm text-gray-500 mt-2">
                  ¡Sé el primero en dejar una reseña!
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-200 pb-4 last:border-b-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="font-medium">{review.user_name}</span>
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDate(review.created_at)}
                      </p>
                    </div>

                    {isAdmin && (
                      <Button
                        onClick={() => deleteReview(review.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        🗑️ Eliminar
                      </Button>
                    )}
                  </div>

                  {review.comment && (
                    <p className="text-gray-700 mt-2">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
