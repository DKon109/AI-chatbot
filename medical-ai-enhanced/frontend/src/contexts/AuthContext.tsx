import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import ApiService from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, userType: 'patient' | 'doctor') => Promise<void>;
  register: (email: string, password: string, userType: 'patient' | 'doctor', name?: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = ApiService.getAuthToken();
        if (token) {
          const response = await ApiService.getProfile();
          if (response.success) {
            setUser(response.data);
          } else {
            ApiService.removeAuthToken();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        ApiService.removeAuthToken();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, userType: 'patient' | 'doctor') => {
    try {
      const response = await ApiService.login(email, password, userType);
      if (response.success) {
        ApiService.setAuthToken(response.data.token);
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, userType: 'patient' | 'doctor', name?: string) => {
    try {
      const response = await ApiService.register(email, password, userType, name);
      if (response.success) {
        ApiService.setAuthToken(response.data.token);
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    ApiService.removeAuthToken();
    setUser(null);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
