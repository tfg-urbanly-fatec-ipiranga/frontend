import React, { useState, type FC, type FormEvent } from 'react';
import { ArrowLeft, Building2, MapPin, Coffee, Plus, ArrowRight, ChevronDown, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreatePlace } from '../hooks/useCreatePlace';
import { useCategories } from '../hooks/useCategories';
import { useTags } from "../hooks/useTags";
import { usePlaceTags } from "../hooks/usePlaceTags";
import { usePlacePhotos } from '../hooks/usePlacePhotos';
import './RegisterEstablishment.css';
import { toast } from 'react-toastify';


const getPriceLabel = (level?: string) => {
  switch (level) {
    case 'ONE': return '$';
    case 'TWO': return '$$';
    case 'THREE': return '$$$';
    case 'FOUR': return '$$$$';
    case 'FIVE': return '$$$$$';
    default: return '—';
  }
};

const RegisterEstablishment: FC = () => {
  const navigate = useNavigate();
  const { createPlace, loading: createLoading, error: createError } = useCreatePlace();
  const { categories } = useCategories();
  const { tags, loading: tagsLoading } = useTags();
  const { addTag, loading: saveLoading } = usePlaceTags(); // aqui não precisa passar id ainda, pois é cadastro
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const { uploadPhotoNewPlace, loading: photoLoading} = usePlacePhotos(undefined);
  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  
  // Basic Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    openingTime: '',
    closingTime: '',
    categoryId: '',
    workingDays: '',
    priceLevel: '',
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

  if(photoLoading){
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Salvando Fotos...</p>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
     
    if(selectedFiles.length === 0){
      return toast.warn('Nenhuma foto adicionada! Adicione pelo menos uma foto!');
    }

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

      if (selectedFiles.length > 0) {
      await Promise.all(
        selectedFiles.map((file, index) => {
          //console.log('RegisterEstabilishment:', index);
          uploadPhotoNewPlace(
            createdPlace.id,
            file,            
            undefined,
            index === 0);}
          ));
      }

      toast.success('Estabelecimento cadastrado com sucesso!');
      navigate(`/establishment/${createdPlace.id}`);
    }
  };

  return (
    <div className="register-establishment-page">
      <header className="establishment-header">
        <button className="back-button-estab" type="button" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="header-title-estab" onClick={() => navigate('/home')}>Registrar Estabelecimento</h1>
      </header>

      <main className="establishment-card">
        <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label-estab">Nome</label>
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
          <label className="form-label-estab">Descrição</label>
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
          <label className="form-label-estab">Endereço</label>
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
          <label className="form-label-estab">Cidade</label>
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
            <label className="form-label-estab">Abre às</label>
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
            <label className="form-label-estab">Fecha às</label>
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
        {/* Campo de Dias de Funcionamento */}
        <div className="form-group">
          <label className="form-label-estab">Dias de Funcionamento</label>
          <div className="select-container">
            <Clock size={20} className="input-icon" />
            <select 
              name="workingDays"
              value={formData.workingDays}
              onChange={handleInputChange}
              className="select-element"
              required
            >
              <option value="">Selecione os dias</option>
              <option value="Segunda a Sexta">Seg - Sex</option>
              <option value="Segunda a Sábado">Seg - Sáb</option>
              <option value="Terça a Domingo">Ter - Dom</option>
              <option value="Todos os dias">Todos os dias</option>
              <option value="Finais de Semana">Finais de Semana</option>
            </select>
            <ChevronDown size={20} className="chevron-icon" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label-estab">Categoria</label>
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
          <label className="form-label-estab">Preço</label>

          <div className="select-container">
            <span className="input-icon">$</span>

            <select
              name="priceLevel"
              value={formData.priceLevel}
              onChange={handleInputChange}
              className="select-element"
            >
              <option value="">Selecione o preço</option>
              <option value="ONE">$</option>
              <option value="TWO">$$</option>
              <option value="THREE">$$$</option>
              <option value="FOUR">$$$$</option>
              <option value="FIVE">$$$$$</option>
            </select>

            <ChevronDown size={20} className="chevron-icon" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label-estab">Palavras-chave / Tags</label>
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
          <label className="form-label-estab">Galeria de fotos</label>

          <input
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            id="upload-photos"
            onChange={(e) => {
              const files = e.target.files;
              if (!files) return;

              const fileArray = Array.from(files);

              const total = selectedFiles.length + fileArray.length;

              if (total > 4) {
                toast.warning('Você pode adicionar no máximo 4 fotos');
                return;
              }
              setSelectedFiles(prev => [...prev, ...fileArray]);

              const previews = fileArray.map(file => URL.createObjectURL(file));
              setPreviewUrls(prev => [...prev, ...previews]);
            }}
          />

          <div className="gallery-grid">
            {previewUrls.map((url, index) => (
              <div key={index} className="gallery-item">
                <img src={url} className="gallery-image" />

                <button
                  type="button"
                  className="remove-photo-button"
                  onClick={() => removeImage(index)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {selectedFiles.length < 4 && (
              <button
                type="button"
                className="add-photo-button"
                onClick={() => document.getElementById('upload-photos')?.click()}
              >
                <Plus size={24} />
              </button>
            )}

          </div>
          <p className="footer-link-text"> A primeira foto cadastrada será registrada como principal. Ela pode ser alterada no Administrar Estabelecimentos.</p>
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
