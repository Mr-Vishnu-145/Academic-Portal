import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, AlertTriangle, X, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user.role === 'HOD') navigate('/hod/dashboard');
      else if (user.role === 'STAFF') navigate('/staff/dashboard');
      else navigate('/student/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(identifier, password);
      
      // Redirect based on role
      if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user.role === 'HOD') navigate('/hod/dashboard');
      else if (user.role === 'STAFF') navigate('/staff/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="login-container">
      {/* Background Decorative Glowing Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="animate-blob-1" style={{ position: 'absolute', top: '10%', left: '10%', width: '350px', height: '350px', backgroundColor: 'var(--primary-glow)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.6 }}></div>
        <div className="animate-blob-2" style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', backgroundColor: 'rgba(37, 99, 235, 0.08)', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.5 }}></div>
      </div>

      <div className="glass-card login-card" style={{ position: 'relative', zIndex: 1 }}>
        <h1 className="login-title">Academic Portal</h1>
        <p className="login-subtitle">Sign in to access your dashboard</p>

        {error && (
          <div className="alert-banner alert-banner-danger">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="identifier">User ID or Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="identifier"
                name="identifier"
                autoComplete="off"
                type="text"
                className="form-control"
                placeholder="Register Number, Staff ID, or Email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={{ paddingLeft: '48px', paddingRight: '40px' }}
                required
              />
              {identifier && (
                <button
                  type="button"
                  onClick={() => setIdentifier('')}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  aria-label="Clear username"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="password"
                name="password"
                autoComplete="new-password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '48px', paddingRight: '48px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  outline: 'none'
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>




      </div>
    </div>
  );
};

export default Login;
