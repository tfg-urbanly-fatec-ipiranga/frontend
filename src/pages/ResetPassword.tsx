import React, { useState, type FC, type FormEvent } from 'react';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import './ResetPassword.css';

const ResetPasswordPage: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const errorParam = searchParams.get('error');

  const { resetPassword, loading, error } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Token de redefinição ausente.');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    try {
      await resetPassword(token, formData.password);
      toast.success('Senha redefinida com sucesso!');
      navigate('/login');
    } catch (err: any) {
      toast.error(error || 'Erro ao redefinir a senha.');
    }
  };

  const isLinkInvalid = !token || errorParam === 'invalid-token';

  return (
    <div className="reset-password-page">
      <main className="reset-password-card">
        <div className="logo-container">
          <span className="logo-u">U</span>
        </div>

        <h2 className="brand-name">Urbanly</h2>

        {isLinkInvalid ? (
          <div className="invalid-token-container">
            <h3 className="error-title">Link Inválido ou Expirado</h3>
            <p className="brand-tagline">
              O link de redefinição de senha que você utilizou é inválido ou já expirou. 
              Por favor, solicite uma nova redefinição de senha.
            </p>
            <button 
              type="button" 
              className="reset-password-button" 
              onClick={() => navigate('/login')}
            >
              Voltar para o Login
            </button>
          </div>
        ) : (
          <>
            <p className="brand-tagline">Escolha uma nova senha forte para acessar sua conta</p>

            <form onSubmit={handleSubmit} className="reset-password-form">
              <div className="form-group">
                <label className="form-label">Nova Senha</label>
                <div className="input-wrapper">
                  <Lock size={20} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
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

              <div className="form-group">
                <label className="form-label">Confirmar Nova Senha</label>
                <div className="input-wrapper">
                  <Lock size={20} className="input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    placeholder="Repita a nova senha"
                    className="input-field"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && <div className="error-message">Erro: {error}</div>}

              <button type="submit" className="reset-password-button" disabled={loading}>
                {loading ? 'Redefinindo...' : 'Redefinir Senha'} <ArrowRight size={20} />
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
};

export default ResetPasswordPage;
