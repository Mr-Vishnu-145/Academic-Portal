import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, Phone, Building, Calendar, Key, Shield, Eye, EyeOff } from 'lucide-react';

const Profile = () => {
  const { authenticatedFetch } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    authenticatedFetch('/api/profile')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load profile');
        return res.json();
      })
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Could not load profile details.');
        setLoading(false);
      });
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }

    setUpdating(true);
    try {
      const res = await authenticatedFetch('/api/profile/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Failed to update password.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading profile details...</div>;

  return (
    <div className="profile-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', width: '100%' }}>
      
      {/* 1. Account Details Card */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <User size={24} style={{ color: 'var(--primary)' }} />
          <h2 style={{ margin: 0 }}>Account Profile Details</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" value={profile?.name || ''} disabled style={{ paddingLeft: '48px', opacity: 0.8, cursor: 'not-allowed' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="email" className="form-control" value={profile?.email || ''} disabled style={{ paddingLeft: '48px', opacity: 0.8, cursor: 'not-allowed' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" value={profile?.phone || 'N/A'} disabled style={{ paddingLeft: '48px', opacity: 0.8, cursor: 'not-allowed' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Account Role</label>
            <div style={{ position: 'relative' }}>
              <Shield size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" value={profile?.role || ''} disabled style={{ paddingLeft: '48px', opacity: 0.8, cursor: 'not-allowed', textTransform: 'capitalize' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Department</label>
            <div style={{ position: 'relative' }}>
              <Building size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" value={profile?.departmentName ? `${profile.departmentName} (${profile.departmentCode})` : 'N/A'} disabled style={{ paddingLeft: '48px', opacity: 0.8, cursor: 'not-allowed' }} />
            </div>
          </div>

          {profile?.year && (
            <div className="form-group">
              <label className="form-label">{profile?.role === 'STUDENT' ? 'Study Year' : 'Assigned Year'}</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="form-control" value={`Year ${profile.year}`} disabled style={{ paddingLeft: '48px', opacity: 0.8, cursor: 'not-allowed' }} />
              </div>
            </div>
          )}

          {profile?.registerNumber && (
            <div className="form-group">
              <label className="form-label">Register Number</label>
              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="form-control" value={profile.registerNumber} disabled style={{ paddingLeft: '48px', opacity: 0.8, cursor: 'not-allowed' }} />
              </div>
            </div>
          )}

          {profile?.staffIdCode && (
            <div className="form-group">
              <label className="form-label">Staff Code</label>
              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="form-control" value={profile.staffIdCode} disabled style={{ paddingLeft: '48px', opacity: 0.8, cursor: 'not-allowed' }} />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 2. Change Password Card */}
      <div className="glass-card" style={{ maxWidth: '500px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <Lock size={24} style={{ color: 'var(--primary)' }} />
          <h2 style={{ margin: 0 }}>Security Settings</h2>
        </div>

        {error && (
          <div className="alert-banner alert-banner-danger" style={{ marginBottom: '16px' }}>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="alert-banner alert-banner-success" style={{ marginBottom: '16px' }}>
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange}>
          
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showCurrent ? 'text' : 'password'} 
                className="form-control" 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
                required 
                placeholder="Enter current password" 
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
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
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showNew ? 'text' : 'password'} 
                className="form-control" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
                placeholder="Enter new password" 
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
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
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showConfirm ? 'text' : 'password'} 
                className="form-control" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                placeholder="Confirm new password" 
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
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
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={updating}>
            {updating ? 'Updating Password...' : 'Update Password'}
          </button>
          
        </form>
      </div>

    </div>
  );
};

export default Profile;
