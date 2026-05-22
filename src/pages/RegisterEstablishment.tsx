import React, { useState, type FC, type FormEvent, useEffect } from 'react';
import { ArrowLeft, Building2, MapPin, Coffee, Plus, ArrowRight, ChevronDown, Clock, X, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreatePlace } from '../hooks/useCreatePlace';
import { useCategories } from '../hooks/useCategories';
import { useTags } from "../hooks/useTags";
import { usePlaceTags } from "../hooks/usePlaceTags";
import { usePlacePhotos } from '../hooks/usePlacePhotos';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './RegisterEstablishment.css';
import { toast } from 'react-toastify';

// Fix for default Leaflet markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
};

const LocationMarker = ({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) => {
  const [localPos, setLocalPos] = useState<[number, number]>(position);

  useEffect(() => {
    setLocalPos(position);
  }, [position]);

  const map = useMapEvents({
    move() {
      const center = map.getCenter();
      setLocalPos([center.lat, center.lng]);
    },
    moveend() {
      const center = map.getCenter();
      setPosition([center.lat, center.lng]);
    }
  });

  return localPos === null ? null : (
    <Marker 
      position={localPos} 
      interactive={false}
    />
  );
};


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
  
  const [cep, setCep] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-23.550520, -46.633308]); // Default SP
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([-23.550520, -46.633308]);

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
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    addressNumber: '',
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

  const handleCepSearch = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      toast.error('CEP inválido.');
      return;
    }
    
    setCepLoading(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
      const data = await response.json();
      
      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          address: `${data.street || ''}${data.street && data.neighborhood ? ' - ' : ''}${data.neighborhood || ''}`,
          city: data.city || '',
        }));
        
        if (data.location?.coordinates?.latitude && data.location?.coordinates?.longitude) {
          const lat = parseFloat(data.location.coordinates.latitude);
          const lng = parseFloat(data.location.coordinates.longitude);
          setMapCenter([lat, lng]);
          setMarkerPosition([lat, lng]);
          toast.success('Endereço e localização encontrados!');
        } else {
          toast.info('Endereço encontrado, mas sem coordenadas exatas. Ajuste no mapa.');
        }
      } else {
        toast.error('CEP não encontrado.');
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
     
    if(selectedFiles.length === 0){
      return toast.warn('Nenhuma foto adicionada! Adicione pelo menos uma foto!');
    }

    if (activeTags.length === 0) {
      return toast.warn('Selecione pelo menos uma tag!');
    }

    let finalAddress = formData.address;
    if (formData.addressNumber) {
      if (finalAddress.includes(' - ')) {
        const parts = finalAddress.split(' - ');
        finalAddress = `${parts[0]}, ${formData.addressNumber} - ${parts.slice(1).join(' - ')}`;
      } else {
        finalAddress = `${finalAddress}, ${formData.addressNumber}`;
      }
    }

    // Format data for the backend DTO
    const payload: any = {
      ...formData,
      address: finalAddress,
      latitude: markerPosition[0],
      longitude: markerPosition[1],
    };
    
    delete payload.addressNumber;

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
          <label className="form-label-estab">CEP</label>
          <div className="input-container" style={{ paddingRight: '4px' }}>
            <MapPin size={20} className="input-icon" />
            <input 
              type="text" 
              name="cep"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              placeholder="00000-000" 
              className="input-element" 
            />
            <button 
              type="button" 
              onClick={handleCepSearch} 
              disabled={cepLoading}
              style={{
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '8px 12px',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                minWidth: '90px',
                justifyContent: 'center'
              }}
            >
              {cepLoading ? '...' : <><Search size={16} /> Buscar</>}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label-estab">Logradouro / Endereço</label>
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
          <label className="form-label-estab">Número</label>
          <div className="input-container">
            <MapPin size={20} className="input-icon" />
            <input 
              type="text" 
              name="addressNumber"
              value={formData.addressNumber}
              onChange={handleInputChange}
              required
              placeholder="Ex: 123, S/N" 
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

        <div className="form-group">
          <label className="form-label-estab">Localização no Mapa</label>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 8px 2px', lineHeight: '1.4' }}>
            Movimente o mapa para ajustar a localização exata do estabelecimento. O marcador central indica a posição selecionada.
          </p>
          <div style={{ height: '250px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e7eb', zIndex: 1 }}>
            <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%', zIndex: 1 }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              <MapController center={mapCenter} />
              <LocationMarker position={markerPosition} setPosition={setMarkerPosition} />
            </MapContainer>
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
