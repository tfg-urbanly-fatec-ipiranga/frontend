import React, { useState, type FC, type FormEvent } from 'react';
import { ArrowLeft, Mail, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import './ForgotPassword.css';

const ForgotPasswordPage: FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const { forgotPassword, loading, error } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword(email);
      toast.success('Link de recuperação enviado com sucesso!');
      setEmail('');
      // Optionally redirect user back to login after some delay or immediately
      navigate('/login');
    } catch (err: any) {
      toast.error(error || 'Erro ao solicitar recuperação de senha.');
    }
  };

  return (
    <div className="forgot-password-page">
      <header className="forgot-password-header">
        <button className="forgot-password-back-button" onClick={() => navigate('/login')}>
          <ArrowLeft size={24} />
        </button>
      </header>

      <main className="forgot-password-card">
        <div className="logo-container">
          <span className="logo-u">U</span>
        </div>

        <h2 className="brand-name">Recuperar Senha</h2>
        <p className="brand-tagline">Insira seu e-mail para receber um link de redefinição de senha</p>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <Mail size={20} className="input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="input-field"
              />
            </div>
          </div>

          {error && <div className="error-message">Erro: {error}</div>}

          <button type="submit" className="forgot-password-button" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Link'} <ArrowRight size={20} />
          </button>
        </form>

        <p className="signup-text">
          Lembrou a senha? <button type="button" onClick={() => navigate('/login')} className="signup-link-btn">Voltar para o Login</button>
        </p>
      </main>
    </div>
  );
};

export default ForgotPasswordPage;
