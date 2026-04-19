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
  businessRoleCode?: string | null;
}

interface Shop {
  shopId: number;
  shopName: string;
  shopStatus: string;
  shopIsVipActive?: boolean;
  shopVipStartedAt?: string | null;
  shopVipExpiresAt?: string | null;
  shopDescription?: string;
  shopPhone?: string;
  shopLocation?: string;
  shopLogoUrl?: string | null;
  shopCoverUrl?: string | null;
  shopGalleryImages?: string[];
  shopPreviewImageUrl?: string | null;
  shopLat?: number;
  shopLng?: number;
  shopEmail?: string | null;
  shopEmailVerified?: boolean;
  shopFacebook?: string | null;
  shopInstagram?: string | null;
  shopYoutube?: string | null;
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

const normalizeUser = (rawUser: any): User | null => {
  if (!rawUser) return null;

  const id = Number(rawUser.id ?? rawUser.userId);
  if (!Number.isFinite(id)) return null;

  const userMobile = rawUser.userMobile ?? rawUser.mobile ?? "";
  const userDisplayName = rawUser.userDisplayName ?? rawUser.name ?? null;

  return {
    id,
    userMobile,
    userDisplayName,
    userAvatarUrl: rawUser.userAvatarUrl ?? null,
    userEmail: rawUser.userEmail ?? null,
    userLocation: rawUser.userLocation ?? null,
    userBio: rawUser.userBio ?? null,
    businessRoleCode: rawUser.businessRoleCode ?? null,
  };
};

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
      const parsedUser = normalizeUser(JSON.parse(storedUser));
      if (parsedUser) {
        setToken(storedToken);
        setUser(parsedUser);
        localStorage.setItem('user', JSON.stringify(parsedUser));
        // Fetch shop in background
        fetchShop();
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    const normalizedUser = normalizeUser(newUser);
    if (!normalizedUser) return;

    setToken(newToken);
    setUser(normalizedUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    // Fetch shop after login
    fetchShop();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setShop(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
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
