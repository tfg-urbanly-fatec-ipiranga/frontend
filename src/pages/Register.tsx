import React, { useState, type FC, type FormEvent } from 'react';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, ArrowRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Register.css';

const RegisterPage: FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { registerUser, loading, error } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    birthDate: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newUser = await registerUser(formData);
    
    if (newUser) {
      alert('Usuário cadastrado com sucesso!');
      navigate('/login');
    }
  };

  return (
    <div className="register-page">
      <header className="register-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="header-title">Criar uma conta</h1>
      </header>

      <main className="register-card">
        <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Nome completo</label>
          <div className="input-wrapper">
            <User size={20} className="input-icon" />
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="João Silva" 
              className="input-field" 
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Email</label>
          <div className="input-wrapper">
            <Mail size={20} className="input-icon" />
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="joao.silva@email.com" 
              className="input-field" 
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Senha</label>
          <div className="input-wrapper">
            <Lock size={20} className="input-icon" />
            <input 
              type={showPassword ? "text" : "password"} 
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
              placeholder="********" 
              className="input-field" 
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

        <div className="input-group">
          <label className="input-label">Data de nascimento</label>
          <div className="input-wrapper">
            <Calendar size={20} className="input-icon" />
            <input 
              type="date" 
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              required
              className="input-field" 
              style={{ paddingRight: '12px' }}
            />
          </div>
        </div>

        <p className="terms-text">
          Ao se cadastrar no Urbanly, você concorda com nossos <a href="#" className="terms-link">Termos de Serviço</a> e Política de Privacidade.
        </p>

        {error && <div style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>Erro: {error}</div>}

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Criando...' : 'Criar uma conta'} <ArrowRight size={20} />
        </button>

        <p className="footer-text">
          Já tem uma conta? <button type="button" onClick={() => navigate('/login')} className="login-link" style={{background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer'}}>Entrar</button>
        </p>
        </form>
      </main>
    </div>
  );
};

export default RegisterPage;