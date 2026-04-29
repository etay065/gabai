import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [gabai, setGabai] = useState(() => {
    const u = localStorage.getItem('gabai_user');
    return u ? JSON.parse(u) : null;
  });
  const [memberName, setMemberName] = useState('');

  useEffect(() => {
    // Validate saved token on mount
    const token = localStorage.getItem('gabai_token');
    if (token && !gabai) {
      api.get('/auth/me')
        .then(res => setGabai(res.data))
        .catch(() => { localStorage.removeItem('gabai_token'); localStorage.removeItem('gabai_user'); });
    }
  }, []);

  const loginGabai = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    localStorage.setItem('gabai_token', res.data.token);
    localStorage.setItem('gabai_user', JSON.stringify({ username: res.data.username }));
    setGabai({ username: res.data.username });
    return res.data;
  };

  const logoutGabai = () => {
    localStorage.removeItem('gabai_token');
    localStorage.removeItem('gabai_user');
    setGabai(null);
  };

  return (
    <AuthContext.Provider value={{ gabai, loginGabai, logoutGabai, memberName, setMemberName }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
