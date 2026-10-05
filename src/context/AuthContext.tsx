import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User } from '../types/index.ts';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  isStaff: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  fetchApi: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('dgs_session_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // Authenticated API fetcher
  const fetchApi = useMemo(() => {
    return async (url: string, options: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(options.headers || {});

      if (currentUser?.id) {
        headers.set('x-user-id', currentUser.id.toString());
      }

      if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }

      return fetch(url, { ...options, headers });
    };
  }, [currentUser]);

  // Verify current session with backend
  useEffect(() => {
    const verifySession = async () => {
      try {
        if (currentUser?.id) {
          const res = await fetch('/api/auth/me', {
            headers: {
              'x-user-id': currentUser.id.toString(),
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.authenticated && data.user) {
              setCurrentUser(data.user);
              localStorage.setItem('dgs_session_user', JSON.stringify(data.user));
            } else {
              setCurrentUser(null);
              localStorage.removeItem('dgs_session_user');
            }
          }
        }
      } catch (err) {
        console.warn('Session verification error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    verifySession();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid credentials' };
      }

      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('dgs_session_user', JSON.stringify(data.user));
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: err.message || 'Connection error' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('dgs_session_user');
  };

  const isAdmin = currentUser?.role === 'admin';
  const isStaff = currentUser?.role === 'staff' || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        isStaff,
        isLoading,
        login,
        logout,
        fetchApi,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
