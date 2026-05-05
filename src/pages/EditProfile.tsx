import React, { useState, useEffect, useRef, type FC, type FormEvent } from 'react';
import { ArrowLeft, User, AtSign, Mail, Lock, Calendar, Camera, Eye, EyeOff, ArrowRight, Trash2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUploadAvatar } from '../hooks/useUploadAvatar';
import { useAuthContext } from "../context/AuthContext";
import { toast } from 'react-toastify';
import './EditProfile.css';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const EditProfilePage: FC = () => {
  const navigate = useNavigate();
  const { updateUser, changePassword, loading: loadingAuth } = useAuth();
  const [showPasswordOld, setShowPasswordOld] = useState(false);
  const [showPasswordNew, setShowPasswordNew] = useState(false);
  const [showPasswordCfr, setShowPasswordCfr] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { uploadAvatar, loading: uploadingAvatar, error: avatarError } = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { logout } = useAuthContext();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    birthDate: ''
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      const user = parsed.user || parsed;
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
      }));
      if (user.avatar) {
        setAvatarUrl(user.avatar);
      }
    }
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const userStr = localStorage.getItem('user');
    const parsed = userStr ? JSON.parse(userStr) : null;
    const authUser = parsed?.user || parsed;
    
    if (!authUser || !authUser.id) {
      toast.error('Usuário não logado. Faça o login primeiro!');
      navigate('/login');
      return;
    }

    if (file) {
      const updatedUser = await uploadAvatar(file, authUser.id);
      if (updatedUser && updatedUser.avatar) {
        setAvatarUrl(updatedUser.avatar);
        // Sync local storage with new avatar
        localStorage.setItem('user', JSON.stringify({ ...parsed, user: { ...authUser, avatar: updatedUser.avatar } }));
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      const userUp = parsed.user || parsed;
      const formDataUp = {
        firstName: userUp.firstName || '',
        lastName: userUp.lastName || '',
        username: userUp.username || '',
        email: userUp.email || '',
        birthDate: userUp.birthDate ? new Date(userUp.birthDate).toISOString().split('T')[0] : ''
      };

      if (JSON.stringify(formData) === JSON.stringify(formDataUp)) {
        setIsEditing(false);
        return toast.warn('Usuário não atualizado! Nenhum dado alterado!');
      }

      try { 
        const updatedUser = await updateUser(userUp.id, formData);
        if(updatedUser) {
        toast.success('Usuário atualziado com sucesso!');
        setIsEditing(false);
        localStorage.setItem('user', JSON.stringify({...parsed, user: { ...parsed.user , ...updatedUser}}));
      }
      } catch (err: any) {
        const status = err.response?.status;
        const message = err.response?.data?.message;

        if (status === 409) {
          if (message.includes('email')) {
            setFormData({...formData, email: formDataUp.email})
            return toast.error('Email já em uso');
          } else if (message.includes('username')) {
            setFormData({...formData, username: formDataUp.username})
            return toast.error('Usuário já em uso');
          } else {
            return toast.error('Dados já estão em uso');
          }
        } else {
          return toast.error('Erro ao atualizar usuário');
        }
      } finally {
        setIsEditing(false);
      }

    } else {
      toast.warning('Usuário não logado! Se logue para utilizar essa função!');
      navigate('/home');
      setIsEditing(false);
      return;
    }
  };

  const handleEditing = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    setIsEditing(true);
  };

  const handleCloseModal = async () => {
    setShowPasswordOld(false);
    setShowPasswordNew(false);
    setShowPasswordCfr(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowPasswordModal(false);
  }
  
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('As senhas não coincidem');
    }

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success('Senha alterada com sucesso!');
      handleCloseModal();

    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message;

      if (status === 401 && message.includes('Invalid current password')) {
        toast.error('Senha atual incorreta');
      } else if (status === 400 && passwordData.newPassword.length < 6){
        toast.error('Senha menor que 6 caracteres!');
      } else {
        toast.error('Erro ao alterar senha');
      }
    }
  };

  const handleDeactivateUser = async () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      const user = parsed.user || parsed;
      const confirmed = window.confirm(
        'Tem certeza que deseja desativar este Usuário? Ele poderá ser restaurado por um administrador.'
      );
      if (!confirmed) return;
        setDeleting(true);
        try {
          await api.delete(`/users/${user.id}`);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          logout();
          setDeleting(false);
          navigate('/home');
        } catch (err: any) {
          setErrorMessage(err.response?.data?.message || 'Erro ao desativar usuário');
          toast.error(errorMessage);
          setDeleting(false);
        }
    } else {
      toast.error('Erro ao desativar usuário. Usuário não encontrado.')
    }
  }

  return (
    <div className="edit-profile-page">
      <header className="profile-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="header-title" style={{ left: '50%', transform: 'translateX(-50%)', margin: 0, fontSize: '20px', color: 'white', fontWeight: 700 }}>Urbanly</h1>
          <button
            className="logout-button"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              logout();
              navigate('/home');
            }}
          >
            <LogOut size={22} />
          </button>
      </header>

      <main className="profile-card">
        <div className="avatar-section">
          <input 
            type="file" 
            accept="image/*" 
            style={{ display: 'none' }} 
            ref={fileInputRef} 
            onChange={handleFileChange}
          />
          <div className="avatar-container" onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
            <div className="avatar-image">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                <User size={60} />
              )}
            </div>
            <button className="camera-button">
              <Camera size={18} />
            </button>
          </div>
          <h2 className="avatar-title">{uploadingAvatar ? 'Enviando...' : 'Alterar avatar'}</h2>
          <p className="avatar-subtitle">
            {avatarError ? <span style={{ color: 'red' }}>Erro ao enviar</span> : 'Selecione uma imagem'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
        <div className="edit-form">
          <div className="form-group">
            <label className="form-label">Primeiro nome</label>
            <div className={`input-wrapper ${!isEditing ? 'disabled' : ''}`}>
              <User size={20} className="input-icon" />
              <input 
                type="text" 
                value={formData.firstName} 
                disabled={!isEditing} 
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="input-field" 
                required
                placeholder='João'
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Sobrenome</label>
            <div className={`input-wrapper ${!isEditing ? 'disabled' : ''}`}>
              <User size={20} className="input-icon" />
              <input 
                type="text" 
                value={formData.lastName} 
                disabled={!isEditing} 
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="input-field"
                required
                placeholder='Silva'
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nome de usuário</label>
            <div className={`input-wrapper ${!isEditing ? 'disabled' : ''}`}>
              <AtSign size={20} className="input-icon" />
              <input 
                type="text" 
                value={formData.username} 
                disabled={!isEditing}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="input-field" 
                required
                placeholder='username'
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className={`input-wrapper ${!isEditing ? 'disabled' : ''}`}>
              <Mail size={20} className="input-icon" />
              <input 
                type="email" 
                value={formData.email} 
                disabled={!isEditing}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="input-field" 
                placeholder='email@provider.com'
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Data de nascimento</label>
            <div className={`input-wrapper ${!isEditing ? 'disabled' : ''}`}>
              <Calendar size={20} className="input-icon" />
              <input 
                type="date" 
                name='email'
                value={formData.birthDate} 
                disabled={!isEditing}
                onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                className="input-field" 
                style={{ paddingRight: '12px' }}
                required
              />
            </div>
          </div>

          {isEditing ? (
            <button type="submit" className="save-button" disabled={loadingAuth}>
              {loadingAuth? 'Salvando alterações...' : 'Salvar alterações'} <ArrowRight size={20} />
            </button>
          ) : (
            <button type="button" className="save-button" onClick={handleEditing} style={{ backgroundColor: '#6B7280' }}>
              Editar Perfil <ArrowRight size={20} />
            </button>
          )}
        </div>
        <button type="button" className="change-password-button" onClick={() => {setShowPasswordModal(true);}}>
          Alterar senha
        </button>

        </form>

        {showPasswordModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Alterar senha</h2>

              <div className="edit-form">
                <div className="form-group">
                  <label className="form-label">Senha antiga</label>
                  <div className="input-wrapper">
                    <Lock size={20} className="input-icon" />
                    <input 
                      name='currentPassword'
                      type={showPasswordOld ? "text" : "password"} 
                      value={passwordData.currentPassword} 
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="input-field" 
                      placeholder='******'
                      minLength={6}
                    />
                    <button 
                      type="button"
                      className="password-toggle" 
                      onClick={() => setShowPasswordOld(!showPasswordOld)}
                      >
                      {showPasswordOld ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Senha nova</label>
                  <div className="input-wrapper">
                    <Lock size={20} className="input-icon" />
                    <input
                      name='newPassword' 
                      type={showPasswordNew ? "text" : "password"} 
                      value={passwordData.newPassword} 
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="input-field"
                      placeholder='******'
                      minLength={6}
                    />
                    <button 
                      type="button"
                      className="password-toggle" 
                      onClick={() => setShowPasswordNew(!showPasswordNew)}
                      >
                      {showPasswordNew ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirme a senha nova</label>
                  <div className="input-wrapper">
                    <Lock size={20} className="input-icon" />
                    <input
                      name='confirmPassword'
                      type={showPasswordCfr ? "text" : "password"} 
                      value={passwordData.confirmPassword} 
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="input-field" 
                      placeholder='******'
                      minLength={6}
                    />
                    <button 
                      type="button"
                      className="password-toggle" 
                      onClick={() => setShowPasswordCfr(!showPasswordCfr)}
                      >
                      {showPasswordCfr ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal} disabled={loadingAuth}>
                  Cancelar
                </button>

                <button type="button" onClick={handleChangePassword} disabled={loadingAuth}>
                  {loadingAuth? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}
        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
            <button
              className="delete-button"
              disabled={deleting}
              onClick={handleDeactivateUser}            >
              <Trash2 size={18} />
              {deleting ? 'Desativando...' : 'Desativar Usuário'}
            </button>
          </div>
      </main>
      
    </div>
  );
};

export default EditProfilePage;
