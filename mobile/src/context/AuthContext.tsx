import React, { useContext, useEffect, useState } from "react"
import { ShopService } from "../components/shop/service/shopService";
import AsyncStorage from '@react-native-async-storage/async-storage';

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

    const loadStoredData = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token')
            const storedUser = await AsyncStorage.getItem('user')

            if (storedToken && storedUser) {
                setToken(storedToken);
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);

                await fetchShop(parsedUser.id)
            }

        } catch (e) {
            console.error("Lỗi load data:", e);
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        loadStoredData()
    }, [])

    //Luu Toke + User vao may
    const login = async (newToken: string, newUser: User) => {
        try {
            setToken(newToken)
            setUser(newUser)
            await AsyncStorage.setItem('token', newToken)
            await AsyncStorage.setItem('user', JSON.stringify(newUser))

            await fetchShop(newUser.id)
        } catch (e) {
            console.error("Lỗi lưu thông tin login:", e);
        }
    }

    //Xoa sach dau vet
    const logout = async () => {
        setToken(null)
        setUser(null)
        setShop(null)
        await AsyncStorage.removeItem('token')
        await AsyncStorage.removeItem('user')
    }
    const updateUser = async (newData: Partial<User>) => {
        try {
            if (user) {
                const updatedUser = { ...user, ...newData };
                setUser(updatedUser);
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (e) {
            console.error("Lỗi khi cập nhật thông tin user: ", e);
        }

    }
    const refreshShop = async () => {
        if (user?.id) await fetchShop(user.id)
    }

    return (
        <AuthContext.Provider value={{ user, shop, token, login, logout, updateUser, refreshShop, loading, isAuthenticated: !!token }}>
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