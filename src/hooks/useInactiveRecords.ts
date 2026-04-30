import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

export type RecordType = "users" | "categories" | "places";

export interface InactiveRecord {
  id: string;
  name: string;
  deletedAt: string | null;
  extra?: string;
}

function normalize(type: RecordType, raw: any): InactiveRecord {
  switch (type) {
    case "users":
      return {
        id: raw.id,
        name: `${raw.firstName} ${raw.lastName}`,
        deletedAt: raw.deletedAt,
        extra: raw.email,
      };
    case "categories":
      return {
        id: raw.id,
        name: raw.name,
        deletedAt: raw.deletedAt,
        extra: raw.description || undefined,
      };
    case "places":
      return {
        id: raw.id,
        name: raw.name,
        deletedAt: raw.deletedAt,
        extra: raw.city || raw.address || undefined,
      };
  }
}

export const useInactiveRecords = (type: RecordType) => {
  const [records, setRecords] = useState<InactiveRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchInactive = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/${type}/inactive`);
      setRecords(res.data.map((r: any) => normalize(type, r)));
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao buscar registros inativos");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchInactive();
  }, [fetchInactive]);

  const restore = async (id: string) => {
    setRestoringId(id);
    try {
      await api.patch(`/${type}/${id}/restore`);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao restaurar registro");
    } finally {
      setRestoringId(null);
    }
  };

  return { records, loading, error, restore, restoringId, refetch: fetchInactive };
};
