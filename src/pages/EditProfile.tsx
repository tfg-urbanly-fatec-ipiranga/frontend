import React, { useState, useEffect, useRef, type FC, type FormEvent } from 'react';
import { ArrowLeft, User, AtSign, Mail, Lock, Calendar, Camera, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUploadAvatar } from '../hooks/useUploadAvatar';
import { useAuthContext } from "../context/AuthContext";
import { toast } from 'react-toastify';
import './EditProfile.css';
//import { useAuth } from '../hooks/useAuth';

const EditProfilePage: FC = () => {
  const navigate = useNavigate();
  //const { registerUser, loading: loadingAuth, error: errorAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { uploadAvatar, loading: uploadingAvatar, error: avatarError } = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { logout } = useAuthContext();

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    console.log('submit 1', isEditing);
    e.preventDefault();

    setIsEditing(false);
    
    //const newUser = await registerUser(formData);
      
    //if (newUser) {
    //  toast.success('Usuário cadastrado com sucesso!');
    //  navigate('/login');
    //}
  };

  const handleEditing = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault(); // impede submit
    setIsEditing(true);
  };
  

  return (
    <div className="edit-profile-page">
      <header className="profile-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="header-title" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', margin: 0, fontSize: '20px', color: 'var(--accent)', fontWeight: 700 }}>Urbanly</h1>
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
            <label className="form-label">Senha</label>
            <div className={`input-wrapper ${!isEditing ? 'disabled' : ''}`}>
              <Lock size={20} className="input-icon" />
              <input 
                type={showPassword ? "text" : "password"} 
                defaultValue="********" 
                disabled={!isEditing}
                className="input-field" 
                required
                minLength={6}
                placeholder="********" 
              />
              <button 
                type="button"
                className="password-toggle" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
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
            <button type="submit" className="save-button">
              Salvar alterações <ArrowRight size={20} />
            </button>
          ) : (
            <button type="button" className="edit-button" onClick={handleEditing} style={{ backgroundColor: '#6B7280' }}>
              Editar Perfil <ArrowRight size={20} />
            </button>
          )}
        </div>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
            <button 
              type="button"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                logout();
                toast.success('Deslogado com sucesso!');
                navigate('/home');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <User size={20} /> Encerrar Sessão
            </button>
          </div>
      </main>
      
    </div>
  );
};

export default EditProfilePage;
