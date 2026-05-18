import React, { useEffect, useState, type FC } from 'react';
import { ArrowLeft, Building2, MapPin, Coffee, Plus, ArrowRight, ChevronDown, Clock, Trash2, X, Star, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import './EditEstablishment.css';
import { useUpdatePlace } from '../hooks/useUpdatePlace';
import { usePlaceDetails } from '../hooks/usePlaceDetails';
import { useCategories } from '../hooks/useCategories';
import api from '../services/api';
import { useTags } from "../hooks/useTags";
import { usePlaceTags } from "../hooks/usePlaceTags";
import { toast } from 'react-toastify';
import { usePlacePhotos } from '../hooks/usePlacePhotos';
import type { PlacePhoto } from '../types/placePhoto';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
    default: return '';
  }
};

const EditEstablishment: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { place, loading: placeLoading, error: placeError } = usePlaceDetails(id);
  const { updatePlace, loading: loadingUpdate, error: errorUpdate } = useUpdatePlace();
  const { categories } = useCategories();
  const [activeTags, setActiveTags] = useState<string[]>(
    place?.placeTags?.map(pt => pt.tag.name) ?? []
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { tags } = useTags();
  const { addTag, removeTag, loading: loadingTag } = usePlaceTags();
  const { photos, uploadPhoto, deletePhoto, updatePhoto, loading: photoLoading} = usePlacePhotos(id);
  const [selectedFiles, setSelectedFiles] = useState<
    { id: string; file: File }[]
  >([]);  
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
  const [primaryPhoto, setPrimaryPhoto] = useState<string | null>( photos.find((photo: { isPrimary: any; }) => photo.isPrimary)?.id ?? null );
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [workingDaysOpen, setWorkingDaysOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);

  const [selectedWorkingDays, setSelectedWorkingDays] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');

  const [openingOpen, setOpeningOpen] = useState(false);
  const [closingOpen, setClosingOpen] = useState(false);

  const [selectedOpeningTime, setSelectedOpeningTime] = useState('');
  const [selectedClosingTime, setSelectedClosingTime] = useState('');

  const [cep, setCep] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-23.550520, -46.633308]); // Default SP
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([-23.550520, -46.633308]);

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
        const addrInput = document.querySelector('input[placeholder="Insira o endereço"]') as HTMLInputElement;
        const cityInput = document.querySelector('input[placeholder="Insira a cidade"]') as HTMLInputElement;
        if (addrInput) addrInput.value = `${data.street || ''}${data.street && data.neighborhood ? ' - ' : ''}${data.neighborhood || ''}`;
        if (cityInput) cityInput.value = data.city || '';
        
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

  useEffect(() => {
  if (place) {
    setSelectedWorkingDays(place.workingDays || '');
    setSelectedCategory(place.categoryId || '');
    setSelectedPrice(place.priceLevel || '');

    setSelectedOpeningTime(place.openingTime || '08:00');
    setSelectedClosingTime(place.closingTime || '18:00');

    if (place.latitude && place.longitude) {
      setMapCenter([place.latitude, place.longitude]);
      setMarkerPosition([place.latitude, place.longitude]);
    }
  }
}, [place]);

  //const [primaryPhoto, setPrimaryPhoto] = useState<string | null>();

  useEffect(() => {
    if (place?.placeTags && activeTags.length === 0) {
      setActiveTags(place.placeTags.map(pt => pt.tag.name));
    }
  }, [place]);

  useEffect(() => {
    if (photos.length) {
      const primary = photos.find((photo: PlacePhoto) => photo.isPrimary);
      if (primary) {
        setPrimaryPhoto(primary.id);
      }
    }
  }, [place]);


  const toggleTag = (tagName: string) => {
    if (activeTags.includes(tagName)) {
      setActiveTags(activeTags.filter(t => t !== tagName));
    } else {
      setActiveTags([...activeTags, tagName]);
    }
  };

  if (placeLoading) {
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Carregando dados do estabelecimento...</p>
      </div>
    );
  }

  if (photoLoading && !isSaving) {
    console.log('primaryPhoto', primaryPhoto);
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Carregando fotos do estabelecimento...</p>
      </div>
    );
  }

  if (placeError) {
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px' }}>
        <p style={{ color: 'red' }}>{placeError}</p>
        <button className="back-button-estab" onClick={() => navigate(-1)}>Voltar</button>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px' }}>
        <p style={{ color: 'red' }}>Estabelecimento não encontrado.</p>
        <button className="back-button-estab" onClick={() => navigate(-1)}>Voltar</button>
      </div>
    );
  }

  if (isSaving && !loadingUpdate && !loadingTag && !photoLoading) {
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Salvando alterações...</p>
      </div>
    );
  }

  if (loadingUpdate && isSaving) {
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Salvando informações do estabelecimento...</p>
      </div>
    );
  }

  if (loadingTag && isSaving) {
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Salvando Tags...</p>
      </div>
    );
  }

  if (photoLoading && isSaving) {
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Salvando Fotos...</p>
      </div>
    );
  }

  if (errorUpdate) {
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px' }}>
        <p style={{ color: 'red' }}>{errorUpdate}</p>
        <button className="back-button-estab" onClick={() => navigate(-1)}>Voltar</button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);

    const priceLevel = selectedPrice;
    const workingDays = selectedWorkingDays;
    const name = (document.querySelector('input[placeholder="Insira o nome do estabelecimento"]') as HTMLInputElement)?.value.trim();
    const description = (document.querySelector('textarea') as HTMLTextAreaElement)?.value.trim();
    const city = (document.querySelector('input[placeholder="Insira a cidade"]') as HTMLInputElement)?.value.trim();
    const baseAddress = (document.querySelector('input[placeholder="Insira o endereço"]') as HTMLInputElement)?.value.trim();
    const addressNumber = (document.querySelector('input[placeholder="Ex: 123, S/N"]') as HTMLInputElement)?.value.trim();
    
    let address = baseAddress;
    if (addressNumber) {
      if (address.includes(' - ')) {
        const parts = address.split(' - ');
        address = `${parts[0]}, ${addressNumber} - ${parts.slice(1).join(' - ')}`;
      } else {
        address = `${address}, ${addressNumber}`;
      }
    }
    const openingTime = selectedOpeningTime;
    const closingTime = selectedClosingTime;
    const categoryId = selectedCategory;

    // Validação
    if (!name || !description || !city || !address || !openingTime || !closingTime) {
      setErrorMessage("Preencha todos os campos obrigatórios.");
      return setIsSaving(false);
    }

    const payload: any = {
      name,
      description,
      city,
      address,
      openingTime,
      closingTime,
      categoryId: categoryId || undefined,
      workingDays,
      priceLevel,
      latitude: markerPosition[0],
      longitude: markerPosition[1],
    };

    const updated = await updatePlace(id, payload);

    if (updated) {

      const currentTags = place?.placeTags?.map(pt => pt.tag.name) ?? [];

      // Adicionar tags novas
      for (const tagName of activeTags) {
        if (!currentTags.includes(tagName)) {
          await addTag(tagName, id);
        }
      }

      // Remover tags desmarcadas
      for (const pt of place?.placeTags ?? []) {
        if (!activeTags.includes(pt.tag.name)) {
          await removeTag(pt.tag.name, id); // hook cuida do DELETE
        }
      }

      // DELETAR FOTOS
      await Promise.all(
        photosToDelete.map(photoId =>
          deletePhoto(photoId)
        )
      );

      // UPLOAD NOVAS
      const uploadedPhotos = await Promise.all(
        selectedFiles.map(async (photo) => {
          const uploaded = await uploadPhoto(
            photo.file,
            id
          );

          return {
            tempId: photo.id,
            uploaded,
          };
        })
      );

      // descobrir foto primária final
      let finalPrimary = primaryPhoto;

      // se a primária é uma foto nova
      const uploadedPrimary = uploadedPhotos.find(
        p => p.tempId === primaryPhoto
      );

      // se a primária é uma foto antiga e se mudou a primaria
      const oldPrimary = photos.find((oldPhoto: PlacePhoto) => oldPhoto.isPrimary);
      const existingPrimary = photos.find((ep => ep.id === primaryPhoto));

      // se não mudar, ele nem carrega nada
      if (oldPrimary?.id != existingPrimary?.id){
        if (uploadedPrimary?.uploaded?.id) {
          finalPrimary = uploadedPrimary.uploaded.id;
          if (finalPrimary) {
            await updatePhoto(finalPrimary, {
              isPrimary: true,
            });
          }
        } else if (existingPrimary?.id){
          finalPrimary = existingPrimary.id;
          if(oldPrimary){
            existingPrimary.isPrimary = false;
            await updatePhoto(oldPrimary.id, {isPrimary: false} );
          }
          if(existingPrimary){
            existingPrimary.isPrimary = true;
            await updatePhoto(existingPrimary.id, {isPrimary: true} );
          }
        }
      }
        toast.success('Atualizado com sucesso!');
        setIsSaving(false);
        navigate(`/establishments`);
      }
    };

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const total = photos.length + selectedFiles.length + files.length;

    if (total > 4) {
      toast.error('Máximo de 4 fotos permitido');
      return;
    }

    const mappedFiles = files.map(file => ({
      id: crypto.randomUUID(),
      file,
    }));

    setSelectedFiles(prev => [...prev, ...mappedFiles]);

    e.target.value = '';
  };

  const toggleDelete = (photoId: string) => {
  setPhotosToDelete(prev =>
    prev.includes(photoId)
      ? prev.filter(id => id !== photoId)
      : [...prev, photoId]
    );
  };

  const timeOptions = [
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
];

  return (
    <div className="edit-establishment-page">
      <header className="establishment-header">
        <button className="back-button-estab" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="header-title-estab" onClick={() => navigate('/home')}>Editar Estabelecimento</h1>
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
          <label className="form-label">CEP</label>
          <div className="input-container" style={{ paddingRight: '4px' }}>
            <MapPin size={20} className="input-icon" />
            <input 
              type="text" 
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
          <label className="form-label">Logradouro / Endereço</label>
          <div className="input-container">
            <MapPin size={20} className="input-icon" />
            <input type="text" defaultValue={place.address} placeholder="Insira o endereço" className="input-element" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Número</label>
          <div className="input-container">
            <MapPin size={20} className="input-icon" />
            <input type="text" placeholder="Ex: 123, S/N" className="input-element" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Cidade</label>
          <div className="input-container">
            <MapPin size={20} className="input-icon" />
            <input type="text" defaultValue={place.city} placeholder="Insira a cidade" className="input-element" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Localização no Mapa</label>
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
          <label className="form-label">
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

              <span className="custom-select-value">
                {selectedOpeningTime || '08:00'}
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
                      selectedOpeningTime === time
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => {
                      setSelectedOpeningTime(time);
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
          <label className="form-label">
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

              <span className="custom-select-value">
                {selectedClosingTime || '18:00'}
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
                      selectedClosingTime === time
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => {
                      setSelectedClosingTime(time);
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
        <div className="form-group">
          <label className="form-label">
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
                  !selectedWorkingDays
                    ? 'placeholder'
                    : ''
                }`}
              >
                {selectedWorkingDays || 'Selecione os dias'}
              </span>

              <ChevronDown
                size={20}
                className="chevron-icon"
              />
            </div>

            {workingDaysOpen && (
              <div className="custom-dropdown">

                {[
                  'Seg - Sex',
                  'Seg - Sáb',
                  'Ter - Dom',
                  'Todos os dias',
                  'Finais de Semana'
                ].map((option) => (
                  <div
                    key={option}
                    className={`custom-option ${
                      selectedWorkingDays === option
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => {
                      setSelectedWorkingDays(option);
                      setWorkingDaysOpen(false);
                    }}
                  >
                    {option}
                  </div>
                ))}

              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Categoria</label>

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
                  !selectedCategory
                    ? 'placeholder'
                    : ''
                }`}
              >
                {
                  categories.find(
                    c => c.id === selectedCategory
                  )?.name ||
                  'Selecione uma categoria'
                }
              </span>

              <ChevronDown
                size={20}
                className="chevron-icon"
              />
            </div>

            {categoryOpen && (
              <div className="custom-dropdown">

                {categories.map(category => (
                  <div
                    key={category.id}
                    className={`custom-option ${
                      selectedCategory === category.id
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => {
                      setSelectedCategory(category.id);
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

        <div className="form-group">
          <label className="form-label">Preço</label>

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
                  !selectedPrice
                    ? 'placeholder'
                    : ''
                }`}
              >
                {getPriceLabel(selectedPrice) ||
                  'Selecione o preço'}
              </span>

              <ChevronDown
                size={20}
                className="chevron-icon"
              />
            </div>

            {priceOpen && (
              <div className="custom-dropdown">

                {[
                  'ONE',
                  'TWO',
                  'THREE',
                  'FOUR',
                  'FIVE'
                ].map((option) => (
                  <div
                    key={option}
                    className={`custom-option ${
                      selectedPrice === option
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => {
                      setSelectedPrice(option);
                      setPriceOpen(false);
                    }}
                  >
                    {getPriceLabel(option)}
                  </div>
                ))}

              </div>
            )}

          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Palavras-chave / Tags</label>
          <div className="tags-section">
            {tags.map(tag => (
              <span
                key={tag.id}
                className={`tag ${activeTags.includes(tag.name) ? 'tag-active' : 'tag-inactive'}`}
                onClick={() => toggleTag(tag.name)}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Galeria de fotos</label>
            <div className="gallery-grid">

              {/* FOTOS EXISTENTES */}
              {photos?.map((photo) => {
                const isDeleted = photosToDelete.includes(photo.id);
                const isPrimary = primaryPhoto === photo.id;

                return (
                  <div
                    key={photo.id}
                    className={`gallery-item ${isDeleted ? 'marked-delete' : ''}`}
                  >
                    <img src={photo.url} className="gallery-image" />

                    {/* OVERLAY DE EXCLUSÃO */}
                    {isDeleted && (
                      <div className="delete-overlay">
                        <span className="delete-overlay-text">Removida</span>
                        <button
                          type="button"
                          onClick={() => toggleDelete(photo.id)}
                        >
                          Desfazer
                        </button>
                      </div>
                    )}

                    {/* BOTÃO EXCLUIR */}
                    {!isDeleted && (
                      <button
                        type="button"
                        className="remove-photo-button"
                        disabled={isPrimary}
                        onClick={() => toggleDelete(photo.id)}
                      >
                        <X size={14} />
                      </button>
                    )}

                    {/* BOTÃO PRIMÁRIA */}
                    {!isDeleted && (
                      <button
                        type="button"
                        className={`primary-badge ${isPrimary ? 'active' : ''}`}
                        onClick={() => setPrimaryPhoto(photo.id)}
                      >
                        <Star size={14} fill={primaryPhoto === photo.id ? 'currentColor' : 'none'}/>
                      </button>
                    )}
                  </div>
                );
              })}

              {/* FOTOS NOVAS (PREVIEW) */}
              {selectedFiles.map((photo) => {
                const isPrimary = primaryPhoto === photo.id;

                return (
                  <div className="gallery-item" key={photo.id}>
                    <img
                      src={URL.createObjectURL(photo.file)}
                      className="gallery-image"
                    />

                    {/* BADGE NOVA */}
                    <div className="new-photo-badge">
                      N
                    </div>

                    {/* REMOVER FOTO NOVA */}
                    <button
                      type="button"
                      className="remove-photo-button"
                      disabled={isPrimary}
                      onClick={() =>
                        setSelectedFiles(prev =>
                          prev.filter(p => p.id !== photo.id)
                        )
                      }
                    >
                      <X size={14} />
                    </button>

                    {/* DEFINIR COMO PRIMÁRIA */}
                    <button
                      type="button"
                      className={`primary-badge ${isPrimary ? 'active' : ''}`}
                      onClick={() => setPrimaryPhoto(photo.id)}
                    >
                      <Star
                        size={14}
                        fill={isPrimary ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>
                );
              })}

              {/* BOTÃO ADICIONAR FOTO */}
              {(photos.length + selectedFiles.length) < 4 && (
                <label className="add-photo-button">
                  <Plus size={24} />
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    hidden
                    onChange={handleAddPhotos}
                  />
                </label>
              )}

            </div>
        </div>

        {errorMessage && (
          <p style={{ color: 'red', marginBottom: '16px' }}>
            {errorMessage}
          </p>
        )}

        <button className="save-button" onClick={handleSave}>
          Salvar Alterações <ArrowRight size={20} />
        </button>

        <button
          className="delete-button"
          disabled={deleting}
          onClick={() => setShowDeleteModal(true)}
        >
          <Trash2 size={18} />
          {deleting ? 'Desativando...' : 'Desativar Estabelecimento'}
        </button>

        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Desativar estabelecimento</h3>

              <p>
                Tem certeza que deseja desativar este estabelecimento?
                Ele poderá ser restaurado por um administrador.
              </p>

              <div className="modal-actions">
                <button
                  className="modal-cancel"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
                  Cancelar
                </button>

                <button
                  className="modal-confirm"
                  disabled={deleting}
                  onClick={async () => {
                    if (!id) return;

                    setDeleting(true);

                    try {
                      await api.delete(`/places/${id}`);
                      navigate('/establishments');
                    } catch (err: any) {
                      setErrorMessage(
                        err.response?.data?.message ||
                          'Erro ao desativar estabelecimento'
                      );
                    }
                    finally{
                      setDeleting(false);
                      setShowDeleteModal(false);

                    }
                  }}
                >
                  <Trash2 size={18} />
                  {deleting ? 'Desativando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EditEstablishment;
