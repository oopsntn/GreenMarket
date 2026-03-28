import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMyShop } from '../services/api';

interface User {
  id: number;
  userMobile: string;
  userDisplayName: string | null;
  userAvatarUrl?: string | null;
  userEmail?: string | null;
  userLocation?: string | null;
  userBio?: string | null;
}

interface Shop {
  shopId: number;
  shopName: string;
  shopStatus: string;
  shopDescription?: string;
  shopPhone?: string;
  shopLocation?: string;
  shopLat?: number;
  shopLng?: number;
}

interface AuthContextType {
  user: User | null;
  shop: Shop | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (newData: Partial<User>) => void;
  isAuthenticated: boolean;
  loading: boolean;
  refreshShop: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchShop = async () => {
    try {
      const res = await getMyShop();
      setShop(res.data || null);
    } catch {
      setShop(null);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setToken(storedToken);
      setUser(parsedUser);
      // Fetch shop in background
      fetchShop();
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    // Fetch shop after login
    fetchShop();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setShop(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (newData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...newData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const refreshShop = async () => {
    if (user?.id) await fetchShop();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      shop,
      token, 
      login, 
      logout,
      updateUser,
      isAuthenticated: !!token, 
      loading,
      refreshShop
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
