import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [gabai, setGabai] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gabai_user') || 'null'); } catch { return null; }
  });
  const [memberName, setMemberName] = useState('');
  const [memberSynagogue, setMemberSynagogue] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('member_synagogue') || 'null'); } catch { return null; }
  });

  useEffect(() => {
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
    localStorage.setItem('gabai_user', JSON.stringify({ username: res.data.username, synagogue: res.data.synagogue }));
    setGabai({ username: res.data.username, synagogue: res.data.synagogue });
    return res.data;
  };

  const logoutGabai = () => {
    localStorage.removeItem('gabai_token');
    localStorage.removeItem('gabai_user');
    setGabai(null);
  };

  const chooseMemberSynagogue = (syn) => {
    sessionStorage.setItem('member_synagogue', JSON.stringify(syn));
    setMemberSynagogue(syn);
  };

  return (
    <AuthContext.Provider value={{
      gabai, loginGabai, logoutGabai,
      memberName, setMemberName,
      memberSynagogue, chooseMemberSynagogue,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
