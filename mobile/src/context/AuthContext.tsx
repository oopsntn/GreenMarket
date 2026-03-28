import React, { useContext, useEffect, useState } from "react"
import { ShopService } from "../components/shop/service/shopService";

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

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [shop, setShop] = useState<Shop | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchShop = async (userId: number) => {
        try {
            const res = await ShopService.getMyShop(userId)
            setShop(res)
        } catch (e) {
            console.error('Error fetching shop:', e)
            setShop(null)
        }
    }

    useEffect(() => {

    }, [])

    const login = async (newToken: string, newUser: User) => {

    }
    const logout = async () => {

    }
    const updateUser = async (newData: Partial<User>) => {

    }
    const refreshShop = async () => {
        if (user?.id) await fetchShop(user.id)
    }

    return (
        <AuthContext.Provider value={{ user, shop, token, login, logout, updateUser, refreshShop }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}