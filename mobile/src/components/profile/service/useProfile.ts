import { useEffect, useState } from "react"
import { useAuth } from "../../../context/AuthContext"
import { Alert } from "react-native"
import { ProfileService } from "./ProfileService"

export const useProfile = () => {
    const { shop, updateUser, refreshShop } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        displayName: '',
        avatarUrl: '',
        mobile: '',
        email: '',
        location: '',
        bio: '',
        shopName: '',
        shopPhone: '',
        shopLocation: '',
        shopDescription: '',
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await ProfileService.getProfile()
            setFormData({
                displayName: data.userDisplayName || '',
                avatarUrl: data.userAvatarUrl || '',
                mobile: data.userMobile || '',
                email: data.userEmail || '',
                location: data.userLocation || '',
                bio: data.userBio || '',
                shopName: shop?.shopName || '',
                shopPhone: shop?.shopPhone || '',
                shopLocation: shop?.shopLocation || '',
                shopDescription: shop?.shopDescription || '',
            })
        } catch (e) {
            Alert.alert("Lỗi", "Không thể tải thông tin cá nhân");
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            if (shop) {
                await ProfileService.updateShop(shop.shopId, {
                    shopName: formData.shopName,
                    shopPhone: formData.shopPhone,
                    shopLocation: formData.shopLocation,
                    shopDescription: formData.shopDescription,
                })
                await refreshShop()
            } else {
                const updatedData = {
                    userDisplayName: formData.displayName,
                    userAvatarUrl: formData.avatarUrl,
                    userEmail: formData.email,
                    userLocation: formData.location,
                    userBio: formData.bio
                }
                await ProfileService.updateProfile(updatedData)
                updateUser(updatedData)
            }
        } catch (e) {
            Alert.alert("Lỗi", "Cập nhật thất bại");
        } finally {
            setSaving(false)
        }
    }

    return {
        formData,
        setFormData,
        loading,
        saving,
        handleSave,
        isShop: !!shop,
    }
}