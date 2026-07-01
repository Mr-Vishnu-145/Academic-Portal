import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('portal_token');
    const storedUser = localStorage.getItem('portal_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setToken(data.token);
      const userDetails = {
        id: data.userId,
        name: data.name,
        email: data.email,
        role: data.role,
        departmentId: data.departmentId,
        departmentCode: data.departmentCode,
        year: data.year,
        registerNumber: data.registerNumber,
        staffIdCode: data.staffIdCode,
      };
      
      setUser(userDetails);
      localStorage.setItem('portal_token', data.token);
      localStorage.setItem('portal_user', JSON.stringify(userDetails));
      return userDetails;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_user');
  };

  const authenticatedFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });
    
    if (res.status === 401 || res.status === 403) {
      console.warn('Unauthorized or expired token session. Logging out...');
      logout();
    }
    
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, authenticatedFetch }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
