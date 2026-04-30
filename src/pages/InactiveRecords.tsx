import React, { useState, type FC } from "react";
import { ArrowLeft, RotateCcw, Users, Tag, MapPin, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useInactiveRecords,
  type RecordType,
} from "../hooks/useInactiveRecords";
import BottomNav from "../components/BottomNav";
import "./InactiveRecords.css";

const TABS: { key: RecordType; label: string; icon: React.ReactNode }[] = [
  { key: "users", label: "Usuários", icon: <Users size={16} /> },
  { key: "categories", label: "Categorias", icon: <Tag size={16} /> },
  { key: "places", label: "Places", icon: <MapPin size={16} /> },
];

const InactiveRecordsPage: FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<RecordType>("users");
  const { records, loading, error, restore, restoringId } =
    useInactiveRecords(activeTab);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="inactive-page">
      <header className="inactive-header">
        <button className="inactive-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <span className="inactive-header-title">Registros Inativos</span>
      </header>

      <nav className="inactive-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`inactive-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="inactive-content">
        {loading && (
          <div className="inactive-state">
            <p>Carregando...</p>
          </div>
        )}

        {error && (
          <div className="inactive-state">
            <p className="inactive-error">{error}</p>
          </div>
        )}

        {!loading && !error && records.length === 0 && (
          <div className="inactive-state">
            <Inbox size={48} className="inactive-empty-icon" />
            <p className="inactive-empty-text">
              Nenhum registro inativo em{" "}
              {TABS.find((t) => t.key === activeTab)?.label.toLowerCase()}.
            </p>
          </div>
        )}

        {!loading &&
          records.map((record) => (
            <div key={record.id} className="inactive-card">
              <div className="inactive-card-info">
                <span className="inactive-card-name">{record.name}</span>
                {record.extra && (
                  <span className="inactive-card-extra">{record.extra}</span>
                )}
                <span className="inactive-card-date">
                  Inativado em {formatDate(record.deletedAt)}
                </span>
              </div>
              <button
                className="inactive-restore-btn"
                disabled={restoringId === record.id}
                onClick={() => restore(record.id)}
              >
                <RotateCcw
                  size={16}
                  className={restoringId === record.id ? "spinning" : ""}
                />
                <span>
                  {restoringId === record.id ? "Restaurando..." : "Restaurar"}
                </span>
              </button>
            </div>
          ))}
      </main>

      <BottomNav />
    </div>
  );
};

export default InactiveRecordsPage;
