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
  const [workingDaysOpen, setWorkingDaysOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);


const [openingOpen, setOpeningOpen] = useState(false);
const [closingOpen, setClosingOpen] = useState(false);

const timeOptions = [];

for (let hour = 0; hour < 24; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    const formattedHour = String(hour).padStart(2, '0');
    const formattedMinute = String(minute).padStart(2, '0');

    timeOptions.push(
      `${formattedHour}:${formattedMinute}`
    );
  }
}
  
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

  {/* ABERTURA */}
  <div className="form-group" style={{ flex: 1 }}>
    <label className="form-label-estab">
      Abre às
    </label>

    <div className="custom-select-wrapper">

      <div
        className="select-container"
        onClick={() =>
          setOpeningOpen(!openingOpen)
        }
      >
        <Clock size={20} className="input-icon" />

        <span
          className={`custom-select-value ${
            !formData.openingTime
              ? 'placeholder'
              : ''
          }`}
        >
          {formData.openingTime || '08:00'}
        </span>

        <ChevronDown
          size={20}
          className="chevron-icon"
        />
      </div>

      {openingOpen && (
        <div className="custom-dropdown custom-time-dropdown">

          {timeOptions.map(time => (
            <div
              key={time}
              className={`custom-option ${
                formData.openingTime === time
                  ? 'active'
                  : ''
              }`}
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  openingTime: time,
                }));

                setOpeningOpen(false);
              }}
            >
              {time}
            </div>
          ))}

        </div>
      )}

    </div>
  </div>

  {/* FECHAMENTO */}
  <div className="form-group" style={{ flex: 1 }}>
    <label className="form-label-estab">
      Fecha às
    </label>

    <div className="custom-select-wrapper">

      <div
        className="select-container"
        onClick={() =>
          setClosingOpen(!closingOpen)
        }
      >
        <Clock size={20} className="input-icon" />

        <span
          className={`custom-select-value ${
            !formData.closingTime
              ? 'placeholder'
              : ''
          }`}
        >
          {formData.closingTime || '18:00'}
        </span>

        <ChevronDown
          size={20}
          className="chevron-icon"
        />
      </div>

      {closingOpen && (
        <div className="custom-dropdown custom-time-dropdown">

          {timeOptions.map(time => (
            <div
              key={time}
              className={`custom-option ${
                formData.closingTime === time
                  ? 'active'
                  : ''
              }`}
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  closingTime: time,
                }));

                setClosingOpen(false);
              }}
            >
              {time}
            </div>
          ))}

        </div>
      )}

    </div>
  </div>

</div>

        {/* Campo de Dias de Funcionamento */}
        <div className="form-group">
          <label className="form-label-estab">
            Dias de Funcionamento
          </label>

          <div className="custom-select-wrapper">

            <div
              className="select-container"
              onClick={() =>
                setWorkingDaysOpen(!workingDaysOpen)
              }
            >
              <Clock size={20} className="input-icon" />

              <span
                className={`custom-select-value ${
                  !formData.workingDays ? 'placeholder' : ''
                }`}
              >
                {formData.workingDays || 'Selecione os dias'}
              </span>

              <ChevronDown
                size={20}
                className="chevron-icon"
              />
            </div>

            {workingDaysOpen && (
              <div className="custom-dropdown">

                <div
                  className={`custom-option ${
                    formData.workingDays ===
                    'Seg - Sex'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      workingDays: 'Seg - Sex',
                    }));

                    setWorkingDaysOpen(false);
                  }}
                >
                  Seg - Sex
                </div>

                <div
                  className={`custom-option ${
                    formData.workingDays ===
                    'Seg - Sáb'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      workingDays: 'Seg - Sáb',
                    }));

                    setWorkingDaysOpen(false);
                  }}
                >
                  Seg - Sáb
                </div>

                <div
                  className={`custom-option ${
                    formData.workingDays ===
                    'Ter - Dom'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      workingDays: 'Ter - Dom',
                    }));

                    setWorkingDaysOpen(false);
                  }}
                >
                  Ter - Dom
                </div>

                <div
                  className={`custom-option ${
                    formData.workingDays ===
                    'Todos os dias'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      workingDays: 'Todos os dias',
                    }));

                    setWorkingDaysOpen(false);
                  }}
                >
                  Todos os dias
                </div>

                <div
                  className={`custom-option ${
                    formData.workingDays ===
                    'Finais de Semana'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      workingDays: 'Finais de Semana',
                    }));

                    setWorkingDaysOpen(false);
                  }}
                >
                  Finais de Semana
                </div>

              </div>
            )}

          </div>
        </div>

        {/* Campo de Categoria */}
        <div className="form-group">
          <label className="form-label-estab">
            Categoria
          </label>

          <div className="custom-select-wrapper">

            <div
              className="select-container"
              onClick={() =>
                setCategoryOpen(!categoryOpen)
              }
            >
              <Coffee size={20} className="input-icon" />

              <span
                className={`custom-select-value ${
                  !formData.categoryId
                    ? 'placeholder'
                    : ''
                }`}
              >
                {formData.categoryId
                  ? categories.find(
                      category =>
                        category.id ===
                        formData.categoryId
                    )?.name
                  : 'Selecione uma categoria'}
              </span>

              <ChevronDown
                size={20}
                className="chevron-icon"
              />
            </div>

            {categoryOpen && (
              <div className="custom-dropdown">

                <div
                  className={`custom-option ${
                    formData.categoryId === ''
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      categoryId: '',
                    }));

                    setCategoryOpen(false);
                  }}
                >
                  Sem categoria
                </div>

                {categories.map(category => (
                  <div
                    key={category.id}
                    className={`custom-option ${
                      formData.categoryId ===
                      category.id
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        categoryId: category.id,
                      }));

                      setCategoryOpen(false);
                    }}
                  >
                    {category.name}
                  </div>
                ))}

              </div>
            )}

          </div>
        </div>


        {/* Campo de Preço */}    
        <div className="form-group">
          <label className="form-label-estab">
            Preço
          </label>

          <div className="custom-select-wrapper">

            <div
              className="select-container"
              onClick={() =>
                setPriceOpen(!priceOpen)
              }
            >
              <span className="input-icon">$</span>

              <span
                className={`custom-select-value ${
                  !formData.priceLevel
                    ? 'placeholder'
                    : ''
                }`}
              >
                {formData.priceLevel
                  ? getPriceLabel(formData.priceLevel)
                  : 'Selecione o preço'}
              </span>

              <ChevronDown
                size={20}
                className="chevron-icon"
              />
            </div>

            {priceOpen && (
              <div className="custom-dropdown">

                <div
                  className={`custom-option ${
                    formData.priceLevel === ''
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      priceLevel: '',
                    }));

                    setPriceOpen(false);
                  }}
                >
                  Sem preço
                </div>

                <div
                  className={`custom-option ${
                    formData.priceLevel === 'ONE'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      priceLevel: 'ONE',
                    }));

                    setPriceOpen(false);
                  }}
                >
                  $
                </div>

                <div
                  className={`custom-option ${
                    formData.priceLevel === 'TWO'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      priceLevel: 'TWO',
                    }));

                    setPriceOpen(false);
                  }}
                >
                  $$
                </div>

                <div
                  className={`custom-option ${
                    formData.priceLevel === 'THREE'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      priceLevel: 'THREE',
                    }));

                    setPriceOpen(false);
                  }}
                >
                  $$$
                </div>

                <div
                  className={`custom-option ${
                    formData.priceLevel === 'FOUR'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      priceLevel: 'FOUR',
                    }));

                    setPriceOpen(false);
                  }}
                >
                  $$$$
                </div>

                <div
                  className={`custom-option ${
                    formData.priceLevel === 'FIVE'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      priceLevel: 'FIVE',
                    }));

                    setPriceOpen(false);
                  }}
                >
                  $$$$$
                </div>

              </div>
            )}

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
