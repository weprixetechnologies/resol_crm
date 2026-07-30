'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const token = Cookies.get('accessToken');
      if (token) {
        const res = await fetchApi('/auth/me');
        if (res.success) {
          setUser(res.data);
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (res.success) {
      Cookies.set('accessToken', res.data.accessToken, { expires: 1 });
      Cookies.set('refreshToken', res.data.refreshToken, { expires: 7 }); // Refresh token lasts longer
      setUser(res.data.user);
      router.push('/');
    }
    return res;
  };

  const logout = async () => {
    await fetchApi('/auth/logout', { method: 'POST' });
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
