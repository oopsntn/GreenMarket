import React, { useCallback, useContext, useEffect, useState } from "react"
import { ShopService } from "../components/shop/service/shopService";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUnauthorizedHandler } from "../config/api";

interface User {
    id: number;
    userMobile: string;
    userDisplayName: string | null;
    userAvatarUrl?: string | null;
    userEmail?: string | null;
    userLocation?: string | null;
    userBio?: string | null;
    userRegisteredAt?: string | null;
    businessRoleCode?: string | null;
    businessRoleTitle?: string | null;
}

interface Shop {
    shopId: number;
    shopName: string;
    shopStatus: string;
    shopDescription?: string;
    shopPhone?: string;
    shopEmail?: string;
    shopLocation?: string;
    shopLogoUrl?: string;
    shopCoverUrl?: string;
    shopGalleryImages?: string | string[];
    shopFacebook?: string;
    shopInstagram?: string;
    shopYoutube?: string;
    shopLat?: number;
    shopLng?: number;
    phones?: string[];
    posts?: any[];
}

interface AuthContextType {
    user: User | null;
    shop: Shop | null;
    token: string | null;
    login: (token: string, user: User | Record<string, unknown>) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (newData: Partial<User>) => Promise<void>;
    isAuthenticated: boolean;
    loading: boolean;
    refreshShop: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

const toNullableString = (value: unknown): string | null => {
    return typeof value === "string" ? value : null
}

const normalizeUser = (rawUser: unknown): User | null => {
    if (!rawUser || typeof rawUser !== "object") {
        return null
    }

    const source = rawUser as Record<string, unknown>
    const id = Number(source.id ?? source.userId)

    if (!Number.isFinite(id)) {
        return null
    }

    const userMobileValue = source.userMobile ?? source.mobile
    const userDisplayNameValue = source.userDisplayName ?? source.name

    return {
        id,
        userMobile: typeof userMobileValue === "string" ? userMobileValue : "",
        userDisplayName: typeof userDisplayNameValue === "string" ? userDisplayNameValue : null,
        userAvatarUrl: toNullableString(source.userAvatarUrl ?? source.avatarUrl),
        userEmail: toNullableString(source.userEmail ?? source.email),
        userLocation: toNullableString(source.userLocation ?? source.location),
        userBio: toNullableString(source.userBio ?? source.bio),
        userRegisteredAt: toNullableString(source.userRegisteredAt ?? source.registeredAt),
        businessRoleCode: toNullableString(source.businessRoleCode),
        businessRoleTitle: toNullableString(source.businessRoleTitle),
    }
}

const shouldBootstrapShop = (businessRoleCode: string | null | undefined) => {
    return !['COLLABORATOR', 'MANAGER', 'OPERATION_STAFF'].includes(String(businessRoleCode || '').toUpperCase())
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [shop, setShop] = useState<Shop | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchShop = useCallback(async (businessRoleCode?: string | null) => {
        if (!shouldBootstrapShop(businessRoleCode)) {
            setShop(null)
            return
        }

        try {
            const res = await ShopService.getMyShop()
            console.log('Shop data from API:', res)
            setShop(res)

        } catch (e) {
            console.error('Error fetching shop:', e)
            setShop(null)
        }
    }, [])

    // Clear all persisted data and reset in-memory auth state.
    const logout = useCallback(async () => {
        setToken(null)
        setUser(null)
        setShop(null)
        await AsyncStorage.multiRemove(['token', 'user'])
    }, [])

    useEffect(() => {
        setUnauthorizedHandler(async () => {
            await logout()
        })

        return () => {
            setUnauthorizedHandler(null)
        }
    }, [logout])

    const loadStoredData = useCallback(async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token')
            const storedUser = await AsyncStorage.getItem('user')

            if (storedToken && storedUser) {
                const parsedUser = normalizeUser(JSON.parse(storedUser))
                if (parsedUser) {
                    setToken(storedToken)
                    setUser(parsedUser)

                    await fetchShop(parsedUser.businessRoleCode)
                    return
                }
            }

            if (storedToken || storedUser) {
                await logout()
            }

        } catch (e) {
            console.error('Error loading data:', e);
            await logout()
        } finally {
            setLoading(false)
        }
    }, [fetchShop, logout])

    useEffect(() => {
        loadStoredData()
    }, [loadStoredData])

    // Save token and user locally
    const login = useCallback(async (newToken: string, newUser: User | Record<string, unknown>) => {
        try {
            const normalizedUser = normalizeUser(newUser)
            if (!normalizedUser) {
                throw new Error('Invalid user payload from auth response')
            }

            setToken(newToken)
            setUser(normalizedUser)
            await AsyncStorage.setItem('token', newToken)
            await AsyncStorage.setItem('user', JSON.stringify(normalizedUser))

            await fetchShop(normalizedUser.businessRoleCode)
        } catch (e) {
            console.error('Error saving login data:', e);
        }
    }, [fetchShop])

    const updateUser = useCallback(async (newData: Partial<User>) => {
        try {
            if (user) {
                const updatedUser = normalizeUser({ ...user, ...newData })
                if (!updatedUser) {
                    throw new Error('Unable to normalize updated user data')
                }

                setUser(updatedUser)
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser))
            }
        } catch (e) {
            console.error('Error updating user information: ', e);
        }

    }, [user])

    const refreshShop = useCallback(async () => {
        if (user?.id) await fetchShop(user.businessRoleCode)
    }, [fetchShop, user?.businessRoleCode, user?.id])

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
