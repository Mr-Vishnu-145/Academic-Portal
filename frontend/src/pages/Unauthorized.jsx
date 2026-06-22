import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '20px' }}>
      <ShieldAlert size={64} style={{ color: 'var(--danger)' }} />
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px' }}>Access Denied</h1>
      <p style={{ color: 'var(--text-secondary)' }}>You do not have permission to access this page.</p>
      <button className="btn btn-primary" onClick={() => navigate('/login')}>Go to Login</button>
    </div>
  );
};

export default Unauthorized;
