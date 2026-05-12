import React, { useEffect, useState, type FC } from 'react';
import { ArrowLeft, Building2, MapPin, Coffee, Plus, ArrowRight, ChevronDown, Clock, Trash2, X, Star } from 'lucide-react';
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
        <button className="back-button" onClick={() => navigate(-1)}>Voltar</button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);

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
