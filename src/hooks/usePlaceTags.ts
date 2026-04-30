import { useState } from "react";
import api from "../services/api";

export const usePlaceTags = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTag = async (tagName: string, placeId: string) => {
    try {
      setLoading(true);
      await api.post(`/places/${placeId}/tags`, { tagName });
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao adicionar tag");
    } finally {
      setLoading(false);
    }
  };

  const removeTag = async (tagName: string, placeId: string) => {
    try {
        setLoading(true);
        const response = await api.get(`/tags/byname/${tagName}`);
        const tagId: string = response.data.id;
        await api.delete(`/places/${placeId}/tags/${tagId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao remover tag");
    } finally {
      setLoading(false);
    }
  };

  return { addTag, removeTag, loading, error };
};
