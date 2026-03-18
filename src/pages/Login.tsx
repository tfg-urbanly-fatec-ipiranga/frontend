import { useState, type FC } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Login.css';

const LoginPage: FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { loginUser, loading, error } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const user = await loginUser(formData);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/home');
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <span className="urbanly-text">URBANLY</span>
      </header>

      <main className="login-card">
        <div className="logo-container">
          <span className="logo-u">U</span>
        </div>
        
        <h2 className="brand-name">Urbanly</h2>
        <p className="brand-tagline">Passeios que combinam com você</p>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <Mail size={20} className="input-icon" />
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="seu@email.com" 
                className="input-field" 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Digite sua senha" 
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

          <a href="#" className="forgot-password">Esqueceu sua senha?</a>
          {error && <div style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>Erro: {error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'} <ArrowRight size={20} />
          </button>
        </form>

        <p className="signup-text">
          Não tem uma conta? <Link to="/register" className="signup-link">Registre-se</Link>
        </p>
      </main>
    </div>
  );
};

export default LoginPage;
