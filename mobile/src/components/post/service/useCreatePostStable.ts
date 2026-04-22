import { useEffect, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import CustomAlert from '../../../utils/AlertHelper'
import { postService } from './postService'

interface Category {
    categoryId: number
    categoryTitle: string
}

interface CategoryAttribute {
    attributeId: number
    attributeTitle: string
    attributeDataType?: string
    required?: boolean
}

interface SelectedMedia {
    uri: string
    type: 'image'
}

interface CreatePostFormData {
    categoryId: string
    postTitle: string
    postPrice: string
    postLocation: string
    postContactPhone: string
    attributes: Record<number, string>
}

const initialFormData: CreatePostFormData = {
    categoryId: '',
    postTitle: '',
    postPrice: '',
    postLocation: '',
    postContactPhone: '',
    attributes: {},
}

export interface PostingPolicy {
    effectivePolicyType: string
    allowedNewPostsPerDay: number
    usedNewPostsToday: number
    isLimitReached: boolean
    postCreationFee: number
}

const useCreatePostStable = () => {
    const [categories, setCategories] = useState<Category[]>([])
    const [attributes, setAttributes] = useState<CategoryAttribute[]>([])
    const [policy, setPolicy] = useState<PostingPolicy | null>(null)
    const [loadingInitialData, setLoadingInitialData] = useState(true)
    const [loadingPolicy, setLoadingPolicy] = useState(true)
    const [loadingAttributes, setLoadingAttributes] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [media, setMedia] = useState<SelectedMedia[]>([])
    const [formData, setFormData] = useState<CreatePostFormData>(initialFormData)

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        try {
            setLoadingInitialData(true)
            setLoadingPolicy(true)
            const [resCategories, resPolicy] = await Promise.all([
                postService.getCategories(),
                postService.getPostingPolicy().catch(() => null),
            ])
            setCategories(Array.isArray(resCategories) ? resCategories : [])
            if (resPolicy) {
                setPolicy(resPolicy)
            }
        } catch (error) {
            console.error('Error fetching initial data:', error)
            CustomAlert('Loi', 'Khong the tai danh muc tin dang.')
        } finally {
            setLoadingInitialData(false)
            setLoadingPolicy(false)
        }
    }

    const handleCategorySelect = async (catId: string) => {
        setFormData((prev) => ({ ...prev, categoryId: catId, attributes: {} }))
        setAttributes([])
        try {
            setLoadingAttributes(true)
            const res = await postService.getCategoryAttributes(Number(catId))
            setAttributes(Array.isArray(res) ? res : [])
        } catch (error) {
            console.error('Error fetching category attributes:', error)
            CustomAlert('Loi', 'Khong the tai thuoc tinh cho danh muc da chon.')
        } finally {
            setLoadingAttributes(false)
        }
    }

    const pickMedia = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permission.granted) {
            CustomAlert('Yeu cau quyen truy cap', 'Vui long cap quyen truy cap thu vien anh de chon anh.')
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 1,
            selectionLimit: 10,
        })

        if (result.canceled) {
            return
        }

        const selectedMedia: SelectedMedia[] = result.assets.map((asset): SelectedMedia => ({
            uri: asset.uri,
            type: 'image',
        }))
        setMedia((prev) => [...prev, ...selectedMedia].slice(0, 10))
    }

    const removeMedia = (index: number) => {
        setMedia((prev) => prev.filter((_, i) => i !== index))
    }

    const resetForm = () => {
        setFormData(initialFormData)
        setAttributes([])
        setMedia([])
    }

    const validateForm = () => {
        if (!formData.postTitle.trim()) {
            CustomAlert('Thieu thong tin', 'Vui long nhap tieu de tin dang.')
            return false
        }

        if (!formData.categoryId) {
            CustomAlert('Thieu thong tin', 'Vui long chon danh muc.')
            return false
        }

        const selectedCategoryId = Number(formData.categoryId)
        const categoryExists = categories.some((cat) => cat.categoryId === selectedCategoryId)
        if (!categoryExists) {
            CustomAlert('Danh muc khong hop le', 'Danh muc da chon khong ton tai hoac da thay doi. Vui long chon lai.')
            return false
        }

        const priceStr = formData.postPrice.trim()
        const priceNumber = Number(priceStr)
        if (!priceStr || Number.isNaN(priceNumber) || priceNumber < 0) {
            CustomAlert('Gia tri khong hop le', 'Gia ban phai la so lon hon hoac bang 0.')
            return false
        }

        if (formData.postTitle.length > 200) {
            CustomAlert('Gia tri qua dai', 'Tieu de khong duoc vuot qua 200 ky tu.')
            return false
        }

        if (formData.postLocation && formData.postLocation.length > 255) {
            CustomAlert('Gia tri qua dai', 'Dia chi khong duoc vuot qua 255 ky tu.')
            return false
        }

        if (formData.postContactPhone) {
            const cleanPhone = formData.postContactPhone.trim()
            if (cleanPhone.length < 9 || cleanPhone.length > 20 || !/^\+?[0-9\s-]+$/.test(cleanPhone)) {
                CustomAlert('Gia tri khong hop le', 'Vui long nhap so dien thoai hop le (it nhat 9 so).')
                return false
            }
        }

        if (media.length === 0) {
            CustomAlert('Thieu hinh anh', 'Vui long chon it nhat mot hinh anh.')
            return false
        }

        const missingRequiredAttribute = attributes.find(
            (attr) => attr.required && !formData.attributes[attr.attributeId]?.trim(),
        )
        if (missingRequiredAttribute) {
            CustomAlert('Thieu thuoc tinh', `Vui long nhap "${missingRequiredAttribute.attributeTitle}".`)
            return false
        }

        return true
    }

    const submitForm = async () => {
        if (!validateForm()) {
            return
        }

        setSubmitting(true)
        try {
            const mediaUris = media.map((m) => m.uri)
            // Upload can intermittently fail when the server is still processing images.
            // Auto-retry a few times while keeping the loading spinner.
            const uploadedMedia = await postService.uploadMedia(mediaUris, { retries: 3 })
            const uploadedUrls = Array.isArray(uploadedMedia?.urls) ? uploadedMedia.urls : []

            if (uploadedUrls.length !== media.length) {
                throw new Error('Uploaded media count mismatch')
            }

            const images = uploadedUrls.filter((_: string, index: number) => media[index]?.type === 'image')

            const allowedAttributeIds = new Set(attributes.map((attr) => attr.attributeId))
            const attributeEntries = Object.entries(formData.attributes)
                .filter(([, value]) => value.trim())
                .map(([attributeId, value]) => ({
                    attributeId: Number(attributeId),
                    value: value.trim(),
                }))

            const hasInvalidAttribute = attributeEntries.some((item) => !allowedAttributeIds.has(item.attributeId))
            if (hasInvalidAttribute) {
                CustomAlert(
                    'Thuoc tinh khong hop le',
                    'Mot so thuoc tinh da thay doi tren he thong. Vui long chon lai danh muc va nhap lai thuoc tinh.',
                )
                return
            }

            const attributePayload = attributeEntries.filter((item) => allowedAttributeIds.has(item.attributeId))

            const createPayload = {
                categoryId: Number(formData.categoryId),
                postTitle: formData.postTitle.trim(),
                postPrice: Number(formData.postPrice.trim()),
                postLocation: formData.postLocation.trim() || undefined,
                postContactPhone: formData.postContactPhone.replace(/\s+/g, '').trim() || undefined,
                images,
                attributes: attributePayload,
            }

            // Some backends may respond 500 for a short time window right after upload.
            // Retry once (quietly) to avoid showing a scary error to the user.
            try {
                await postService.createPost(createPayload)
            } catch (e: any) {
                const status = e?.response?.status
                if (status === 500) {
                    await new Promise((resolve) => setTimeout(resolve, 1200))
                    await postService.createPost(createPayload)
                } else {
                    throw e
                }
            }

            setSubmitted(true)
            resetForm()
        } catch (error: any) {
            console.error('Error submitting form:', {
                status: error?.response?.status,
                data: error?.response?.data,
                message: error?.message,
            })
            const serverMessage = error?.response?.data?.error || error?.response?.data?.message
            CustomAlert(
                'Dang tin that bai',
                serverMessage || 'Da co loi xay ra trong qua trinh tao bai dang. Vui long thu lai.',
            )
        } finally {
            setSubmitting(false)
        }
    }

    return {
        state: {
            categories,
            attributes,
            loadingInitialData,
            loadingAttributes,
            loadingPolicy,
            policy,
            submitting,
            submitted,
            media,
            formData,
        },
        actions: {
            setFormData,
            setSubmitted,
            handleCategorySelect,
            pickMedia,
            removeMedia,
            submitForm,
        },
    }
}

export default useCreatePostStable

