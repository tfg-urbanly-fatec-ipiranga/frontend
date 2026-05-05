import React, { useEffect, useState, type FC } from 'react';
import { ArrowLeft, Building2, MapPin, Coffee, Plus, ArrowRight, ChevronDown, Clock, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import './EditEstablishment.css';
import { useUpdatePlace } from '../hooks/useUpdatePlace';
import { usePlaceDetails } from '../hooks/usePlaceDetails';
import { useCategories } from '../hooks/useCategories';
import api from '../services/api';
import { useTags } from "../hooks/useTags";
import { usePlaceTags } from "../hooks/usePlaceTags";
import { toast } from 'react-toastify';

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

  const { tags } = useTags();
  const { addTag, removeTag, loading: loadingTag } = usePlaceTags();
  

  useEffect(() => {
    if (place?.placeTags && activeTags.length === 0) {
      setActiveTags(place.placeTags.map(pt => pt.tag.name));
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

  if (placeError) {
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px' }}>
        <p style={{ color: 'red' }}>{placeError}</p>
        <button className="back-button" onClick={() => navigate(-1)}>Voltar</button>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px' }}>
        <p style={{ color: 'red' }}>Estabelecimento não encontrado.</p>
        <button className="back-button" onClick={() => navigate(-1)}>Voltar</button>
      </div>
    );
  }

  if (loadingUpdate) {
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Salvando alterações...</p>
      </div>
    );
  }

  if (loadingTag) {
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Salvando Tags...</p>
      </div>
    );
  }

  if (errorUpdate) {
    return (
      <div className="edit-establishment-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px' }}>
        <p style={{ color: 'red' }}>{errorUpdate}</p>
        <button className="back-button" onClick={() => navigate(-1)}>Voltar</button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!id) return;

    const name = (document.querySelector('input[placeholder="Insira o nome do estabelecimento"]') as HTMLInputElement)?.value.trim();
    const description = (document.querySelector('textarea') as HTMLTextAreaElement)?.value.trim();
    const city = (document.querySelector('input[placeholder="Insira a cidade"]') as HTMLInputElement)?.value.trim();
    const address = (document.querySelector('input[placeholder="Insira o endereço"]') as HTMLInputElement)?.value.trim();
    const openingTime = (document.querySelector('input[name="openingTime"]') as HTMLInputElement)?.value;
    const closingTime = (document.querySelector('input[name="closingTime"]') as HTMLInputElement)?.value;
    const categoryId = (document.querySelector('select') as HTMLSelectElement)?.value;

    // Validação
    if (!name || !description || !city || !address || !openingTime || !closingTime) {
      setErrorMessage("Preencha todos os campos obrigatórios.");
      return;
    }

    const payload: any = {
      name,
      description,
      city,
      address,
      openingTime,
      closingTime,
      categoryId: categoryId || undefined,
    };

    const updated = await updatePlace(id, payload);

    

    if (updated) {

      const currentTags = place?.placeTags?.map(pt => pt.tag.name) ?? [];

      // Adicionar novas
      for (const tagName of activeTags) {
        if (!currentTags.includes(tagName)) {
          await addTag(tagName, id);
        }
      }

      // Remover desmarcadas
      for (const pt of place?.placeTags ?? []) {
        if (!activeTags.includes(pt.tag.name)) {
          await removeTag(pt.tag.name, id); // hook cuida do DELETE
        }
      }

      toast.success('Atualizado com sucesso!');
      navigate(`/establishments`);
    }
  };



  return (
    <div className="edit-establishment-page">
      <header className="establishment-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="header-title" onClick={() => navigate('/home')}>Urbanly</h1>
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
          <label className="form-label">Cidade</label>
          <div className="input-container">
            <MapPin size={20} className="input-icon" />
            <input type="text" defaultValue={place.city} placeholder="Insira a cidade" className="input-element" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Endereço</label>
          <div className="input-container">
            <MapPin size={20} className="input-icon" />
            <input type="text" defaultValue={place.address} placeholder="Insira o endereço" className="input-element" />
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
                defaultValue={place.openingTime || '08:00'}
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
                defaultValue={place.closingTime || '18:00'}
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
              className="select-element" 
              defaultValue={place.categoryId || ''}
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
          onClick={async () => {
            if (!id) return;
            const confirmed = window.confirm(
              'Tem certeza que deseja desativar este estabelecimento? Ele poderá ser restaurado por um administrador.'
            );
            if (!confirmed) return;
            setDeleting(true);
            try {
              await api.delete(`/places/${id}`);
              navigate('/establishments');
            } catch (err: any) {
              setErrorMessage(err.response?.data?.message || 'Erro ao desativar estabelecimento');
              setDeleting(false);
            }
          }}
        >
          <Trash2 size={18} />
          {deleting ? 'Desativando...' : 'Desativar Estabelecimento'}
        </button>
      </main>
    </div>
  );
};

export default EditEstablishment;
