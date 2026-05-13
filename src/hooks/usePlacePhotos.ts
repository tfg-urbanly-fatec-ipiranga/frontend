import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { PlacePhoto } from '../types/placePhoto';


export const usePlacePhotos = (placeId: string | undefined) => {
  const [photos, setPhotos] = useState<PlacePhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

    // UPLOAD com id
  const uploadPhoto = async (
    file: File,
    caption?: string,
    isPrimary?: boolean
  ) => {
    if (!placeId) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('placeId', placeId);

      if (caption) formData.append('caption', caption);
      if (isPrimary !== undefined)
        formData.append('isPrimary', String(isPrimary));

      const response = await api.post('/place-photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Atualiza lista sem refetch
      setPhotos((prev) => [response.data, ...prev]);

      return response.data;

    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Erro ao enviar foto';

      setError(message);
      console.error(err);
      return null;

    } finally {
      setLoading(false);
    }
  };

  // UPLOAD sem id
  const uploadPhotoNewPlace = async (
    placeId: string,
    file: File,
    caption?: string,
    isPrimary?: boolean
  ) => {
    if (!placeId) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('placeId', placeId);

      if (caption) formData.append('caption', caption);
      if (isPrimary){
        formData.append('isPrimary', String(isPrimary));
      }
      
      const response = await api.post('/place-photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Atualiza lista sem refetch
      setPhotos((prev) => [response.data, ...prev]);

      return response.data;

    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Erro ao enviar foto';

      setError(message);
      console.error(err);
      return null;

    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    setLoading(true);
    setError(null);

    try {
      await api.delete(`/place-photos/${photoId}`);

      //Remove da lista local
      setPhotos((prev) => prev.filter(p => p.id !== photoId));

      return true;

    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Erro ao deletar foto';

      setError(message);
      console.error(err);
      return false;

    } finally {
      setLoading(false);
    }
  };

  const updatePhoto = async (
    photoId: string,
    data: {
      caption?: string;
      isPrimary?: boolean;
    }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.put(
        `/place-photos/${photoId}`,
        data
      );

      setPhotos(prev =>
        prev.map(photo =>
          photo.id === photoId
            ? response.data
            : data.isPrimary
              ? { ...photo, isPrimary: false }
              : photo
        )
      );

      return response.data;

    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        'Erro ao atualizar foto';

      setError(message);
      console.error(err);

      return null;

    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = useCallback(async () => {
    if (!placeId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<PlacePhoto[]>(`/place-photos/place/${placeId}`);
      setPhotos(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao buscar fotos');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return { photos, loading, error, uploadPhoto, uploadPhotoNewPlace, deletePhoto, updatePhoto, refetch: fetchPhotos };
};
