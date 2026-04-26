import { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { useAuth } from '../../../context/AuthContext'
import { ProfilePayload, ProfileService } from './ProfileService'
import { resolveImageUrl } from '@/utils/resolveImageUrl'

export interface ProfileFormData {
    displayName: string
    avatarUrl: string
    mobile: string
    email: string
    location: string
    bio: string
    shopName: string
    shopPhone: string
    shopLocation: string
    shopDescription: string
}

export const useProfile = () => {
    const { shop, updateUser, refreshShop } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState<ProfileFormData>({
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

    const isShop = !!shop

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const data = await ProfileService.getProfile()
            if (!data) {
                throw new Error('Thông tin hồ sơ trống')
            }

            setFormData({
                displayName: data.userDisplayName || '',
                avatarUrl: resolveImageUrl(shop?.shopLogoUrl || data.userAvatarUrl || ''),
                mobile: data.userMobile || '',
                email: data.userEmail || '',
                location: data.userLocation || '',
                bio: data.userBio || '',
                shopName: shop?.shopName || '',
                shopPhone: shop?.shopPhone || shop?.phones?.[0] || '',
                shopLocation: shop?.shopLocation || '',
                shopDescription: shop?.shopDescription || '',
            })
        } catch (error) {
            console.error('Không thể tải hồ sơ:', error)
            Alert.alert('Lỗi', 'Không thể tải thông tin hồ sơ')
        } finally {
            setLoading(false)
        }
    }, [shop])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleSave = async () => {
        const normalizedData = {
            displayName: formData.displayName.trim(),
            avatarUrl: formData.avatarUrl.trim(),
            mobile: formData.mobile.trim(),
            email: formData.email.trim(),
            location: formData.location.trim(),
            bio: formData.bio.trim(),
            shopName: formData.shopName.trim(),
            shopPhone: formData.shopPhone.trim(),
            shopLocation: formData.shopLocation.trim(),
            shopDescription: formData.shopDescription.trim(),
        }

        if (shop) {
            if (!normalizedData.shopName) {
                Alert.alert('Thông tin bị thiếu', 'Tên cửa hàng là bắt buộc')
                return
            }
            if (!normalizedData.shopLocation) {
                Alert.alert('Thông tin bị thiếu', 'Cần có địa chỉ cửa hàng.')
                return
            }
        } else if (!normalizedData.displayName) {
            Alert.alert('Thông tin bị thiếu', 'Tên hiển thị là bắt buộc')
            return
        }

        setSaving(true)
        try {
            if (shop) {
                const profilePayload: ProfilePayload = {
                    userEmail: normalizedData.email || undefined,
                }

                await ProfileService.updateShop(shop.shopId, {
                    shopName: normalizedData.shopName,
                    shopLocation: normalizedData.shopLocation,
                    shopDescription: normalizedData.shopDescription,
                })

                await ProfileService.updateProfile(profilePayload)
                await updateUser(profilePayload)
                await refreshShop()
                setFormData((prev) => ({
                    ...prev,
                    email: normalizedData.email,
                    shopName: normalizedData.shopName,
                    shopPhone: normalizedData.shopPhone,
                    shopLocation: normalizedData.shopLocation,
                    shopDescription: normalizedData.shopDescription,
                }))
            } else {
                const updatedData: ProfilePayload = {
                    userDisplayName: normalizedData.displayName,
                    userAvatarUrl: normalizedData.avatarUrl,
                    userEmail: normalizedData.email,
                    userLocation: normalizedData.location,
                    userBio: normalizedData.bio,
                }

                await ProfileService.updateProfile(updatedData)
                await updateUser(updatedData)
                setFormData((prev) => ({
                    ...prev,
                    displayName: normalizedData.displayName,
                    avatarUrl: normalizedData.avatarUrl,
                    email: normalizedData.email,
                    location: normalizedData.location,
                    bio: normalizedData.bio,
                }))
            }

            Alert.alert('Thành công', 'Thông tin đã được cập nhật thành công.')
        } catch (error) {
            console.error('Failed to save profile:', error)
            Alert.alert('Lỗi', 'Cập nhật thất bại')
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
        isShop,
    }
}
