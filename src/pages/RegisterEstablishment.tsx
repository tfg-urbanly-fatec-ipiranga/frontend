import React, { useState, type FC, type FormEvent } from 'react';
import { ArrowLeft, Building2, MapPin, Coffee, Plus, ArrowRight, ChevronDown, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreatePlace } from '../hooks/useCreatePlace';
import { useCategories } from '../hooks/useCategories';
import { useTags } from "../hooks/useTags";
import { usePlaceTags } from "../hooks/usePlaceTags";
import './RegisterEstablishment.css';
import { toast } from 'react-toastify';

// Using the generated paths directly in the component for now
// In a real app, these would be proper imports or URLs
const PLACEHOLDER_IMAGES = [
  '/coffee_shop_interior_1.png',
  '/barista_making_coffee_1.png',
  '/two_coffee_cups_on_table_1.png'
];

const RegisterEstablishment: FC = () => {
  const navigate = useNavigate();
  const { createPlace, loading: createLoading, error: createError } = useCreatePlace();
  const { categories } = useCategories();
  const { tags, loading: tagsLoading } = useTags();
  const { addTag, loading: saveLoading } = usePlaceTags(); // aqui não precisa passar id ainda, pois é cadastro
  const [activeTags, setActiveTags] = useState<string[]>([]);

  
  // Basic Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    openingTime: '',
    closingTime: '',
    categoryId: '',
  });

  if(tagsLoading){
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Carregando dados para criação...</p>
      </div>
    );
  }

  if(createLoading){
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Salvando estabelecimento...</p>
      </div>
    );
  }

  if(saveLoading){
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Salvando Tags...</p>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Format data for the backend DTO
    const payload: any = {
      ...formData,
      // Provide dummy coordinates since map selection isn't implemented yet
      latitude: -23.5505,
      longitude: -46.6333,
    };

    if (!payload.categoryId || payload.categoryId === '') {
      delete payload.categoryId; // Protect the backend expecting either valid UUID or omitted
    }

    const createdPlace = await createPlace(payload);

    if (createdPlace) {
      // adiciona tags selecionadas
      for (const tagName of activeTags) {
        await addTag(tagName, createdPlace.id); 
      }

      toast.success('Estabelecimento cadastrado com sucesso!');
      navigate(`/establishment/${createdPlace.id}`);
    }
  };

  return (
    <div className="register-establishment-page">
      <header className="establishment-header">
        <button className="back-button" type="button" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="header-title" onClick={() => navigate('/home')}>Urbanly</h1>
      </header>

      <main className="establishment-card">
        <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Nome</label>
          <div className="input-container">
            <Building2 size={20} className="input-icon" />
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Insira o nome do estabelecimento" 
              className="input-element" 
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Descrição</label>
          <textarea 
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            placeholder="Descreva o local" 
            className="textarea-element"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Endereço</label>
          <div className="input-container">
            <MapPin size={20} className="input-icon" />
            <input 
              type="text" 
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              placeholder="Insira o endereço" 
              className="input-element" 
            />
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Cidade</label>
          <div className="input-container">
            <MapPin size={20} className="input-icon" />
            <input 
              type="text" 
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              required
              placeholder="Insira a cidade" 
              className="input-element" 
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Abre às</label>
            <div className="input-container">
              <Clock size={20} className="input-icon" />
              <input 
                type="time" 
                name="openingTime"
                value={formData.openingTime}
                onChange={handleInputChange}
                required
                placeholder='08:00'
                className="input-element" 
              />
            </div>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Fecha às</label>
            <div className="input-container">
              <Clock size={20} className="input-icon" />
              <input 
                type="time" 
                name="closingTime"
                value={formData.closingTime}
                onChange={handleInputChange}
                required
                placeholder='18:00'
                className="input-element" 
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Categoria</label>
          <div className="select-container">
            <Coffee size={20} className="input-icon" />
            <select 
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              className="select-element"
            >
              <option value="">Selecione uma categoria (opcional)</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <ChevronDown size={20} className="chevron-icon" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Palavras-chave / Tags</label>
          <div className="tags-section">
            {tags.map(tag => (
              <span
                key={tag.id}
                className={`tag ${activeTags.includes(tag.name) ? 'tag-active' : 'tag-inactive'}`}
                onClick={() => {
                  if (activeTags.includes(tag.name)) {
                    setActiveTags(activeTags.filter(t => t !== tag.name));
                  } else {
                    setActiveTags([...activeTags, tag.name]);
                  }
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>


        <div className="form-group">
          <label className="form-label">Galeria de fotos</label>
          <div className="gallery-grid">
            <div className="gallery-item">
              <img src={PLACEHOLDER_IMAGES[0]} alt="Gallery 1" className="gallery-image" />
            </div>
            <div className="gallery-item">
              <img src={PLACEHOLDER_IMAGES[1]} alt="Gallery 2" className="gallery-image" />
            </div>
            <div className="gallery-item">
              <img src={PLACEHOLDER_IMAGES[2]} alt="Gallery 3" className="gallery-image" />
            </div>
            <button type="button" className="add-photo-button" onClick={() => alert('Galeria em construção')}>
              <Plus size={24} />
            </button>
          </div>
        </div>

        {createError && <div style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>Erro: {createError}</div>}

        <button type="submit" className="register-button" disabled={createLoading}>
          {createLoading ? 'Registrando...' : 'Registrar'} <ArrowRight size={20} />
        </button>

        <p className="footer-link-text">
          Estes dados serão salvos no banco Urbanly.
        </p>
        
        </form>
      </main>
    </div>
  );
};

export default RegisterEstablishment;
