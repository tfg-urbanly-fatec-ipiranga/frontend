import React, { useState, type FC } from 'react';
import { ArrowLeft, Building2, MapPin, Coffee, Plus, ArrowRight, ChevronDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlaceDetails } from '../hooks/usePlaceDetails';
import './EditEstablishment.css';

const EditEstablishment: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { place, loading, error } = usePlaceDetails(id);
  const [activeTags, setActiveTags] = useState<string[]>(['Natural', 'Aconchegante']);
  
  const tags = ['Vegano', 'Natural', 'Aconchegante', 'Saudável'];

  const toggleTag = (tag: string) => {
    if (activeTags.includes(tag)) {
      setActiveTags(activeTags.filter(t => t !== tag));
    } else {
      setActiveTags([...activeTags, tag]);
    }
  };

  if (loading) {
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Carregando dados do estabelecimento...</p>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px' }}>
        <p style={{ color: 'red' }}>{error || 'Estabelecimento não encontrado.'}</p>
        <button className="back-button" onClick={() => navigate(-1)}>Voltar</button>
      </div>
    );
  }

  return (
    <div className="edit-establishment-page">
      <header className="establishment-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="header-title">Urbanly</h1>
      </header>

      <main className="establishment-card">
        <div className="form-group">
          <label className="form-label">Nome</label>
          <div className="input-container">
            <Building2 size={20} className="input-icon" />
            <input type="text" defaultValue={place.name} placeholder="Insira o nome do estabelecimento" className="input-element" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Descrição</label>
          <textarea 
            placeholder="Descreva o local" 
            defaultValue={place.description}
            className="textarea-element"
          ></textarea>
        </div>

        <div className="form-group">
          <label className="form-label">Endereço</label>
          <div className="input-container">
            <MapPin size={20} className="input-icon" />
            <input type="text" defaultValue={place.address} placeholder="Insira o endereço" className="input-element" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Categoria</label>
          <div className="select-container">
            <Coffee size={20} className="input-icon" />
            <select className="select-element" defaultValue="cafe">
              <option value="cafe">Café & Restaurante</option>
              <option value="bar">Bar & Pub</option>
              <option value="store">Loja</option>
            </select>
            <ChevronDown size={20} className="chevron-icon" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Palavras-chave / Tags</label>
          <div className="tags-section">
            {tags.map(tag => (
              <span 
                key={tag} 
                className={`tag ${activeTags.includes(tag) ? 'tag-active' : 'tag-inactive'}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </span>
            ))}
            <button className="add-tag-button">
              <Plus size={14} /> Adicionar
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Galeria de fotos</label>
          <div className="gallery-grid">
            <div className="gallery-item">
              <img src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=200&auto=format&fit=crop" alt="Galeria 1" className="gallery-image" />
            </div>
            <div className="gallery-item">
              <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=200&auto=format&fit=crop" alt="Galeria 2" className="gallery-image" />
            </div>
            <div className="gallery-item">
              <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=200&auto=format&fit=crop" alt="Galeria 3" className="gallery-image" />
            </div>
            <button className="add-photo-button">
              <Plus size={24} />
            </button>
          </div>
        </div>

        <button className="save-button">
          Salvar Alterações <ArrowRight size={20} />
        </button>
      </main>
    </div>
  );
};

export default EditEstablishment;
