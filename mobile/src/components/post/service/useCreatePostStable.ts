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
    type: 'image' | 'video'
}

interface CreatePostFormData {
    categoryId: string
    postTitle: string
    postLocation: string
    attributes: Record<number, string>
}

const initialFormData: CreatePostFormData = {
    categoryId: '',
    postTitle: '',
    postLocation: '',
    attributes: {},
}

export interface PostingPolicy {
    effectivePolicyType: string
    allowedNewPostsPerDay: number
    usedNewPostsToday: number
    isLimitReached: boolean
    postCreationFee: number
}

const useCreatePostStable = (options?: { shopId?: number; shopName?: string; shopLocation?: string }) => {
    const [categories, setCategories] = useState<Category[]>([])
    const [attributes, setAttributes] = useState<CategoryAttribute[]>([])
    const [policy, setPolicy] = useState<PostingPolicy | null>(null)
    const [loadingInitialData, setLoadingInitialData] = useState(true)
    const [loadingPolicy, setLoadingPolicy] = useState(true)
    const [loadingAttributes, setLoadingAttributes] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [media, setMedia] = useState<SelectedMedia[]>([])
    const [formData, setFormData] = useState<CreatePostFormData>(() => ({
        ...initialFormData,
        postLocation: options?.shopLocation || '',
    }))

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
            CustomAlert('Lỗi', 'Không thể tải danh mục tin đăng.')
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
            CustomAlert('Lỗi', 'Không thể tải thuộc tính cho danh mục đã chọn.')
        } finally {
            setLoadingAttributes(false)
        }
    }

    const pickMedia = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permission.granted) {
            CustomAlert('Yêu cầu quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện để chọn ảnh và video.')
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            quality: 1,
            selectionLimit: 10,
        })

        if (result.canceled) {
            return
        }

        const selectedMedia: SelectedMedia[] = result.assets.map((asset): SelectedMedia => ({
            uri: asset.uri,
            type: asset.type === 'video' ? 'video' : 'image',
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
            CustomAlert('Thiếu thông tin', 'Vui lòng nhập tiêu đề tin đăng.')
            return false
        }

        if (!formData.categoryId) {
            CustomAlert('Thiếu thông tin', 'Vui lòng chọn danh mục.')
            return false
        }

        const selectedCategoryId = Number(formData.categoryId)
        const categoryExists = categories.some((cat) => cat.categoryId === selectedCategoryId)
        if (!categoryExists) {
            CustomAlert('Danh mục không hợp lệ', 'Danh mục đã chọn không tồn tại hoặc đã thay đổi. Vui lòng chọn lại.')
            return false
        }

        if (formData.postTitle.length > 200) {
            CustomAlert('Giá trị quá dài', 'Tiêu đề không được vượt quá 200 ký tự.')
            return false
        }

        if (formData.postLocation && formData.postLocation.length > 255) {
            CustomAlert('Giá trị quá dài', 'Địa chỉ không được vượt quá 255 ký tự.')
            return false
        }


        const imageCount = media.filter((m) => m.type === 'image').length
        if (imageCount === 0) {
            CustomAlert('Thiếu hình ảnh', 'Vui lòng chọn ít nhất một hình ảnh.')
            return false
        }

        const missingRequiredAttribute = attributes.find(
            (attr) => attr.required && !formData.attributes[attr.attributeId]?.trim(),
        )
        if (missingRequiredAttribute) {
            CustomAlert('Thiếu thuộc tính', `Vui lòng nhập "${missingRequiredAttribute.attributeTitle}".`)
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

            // Tách images và videos từ danh sách đã upload
            const images = uploadedUrls.filter((_: string, index: number) => media[index]?.type === 'image')
            const videos = uploadedUrls.filter((_: string, index: number) => media[index]?.type === 'video')

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
                    'Thuộc tính không hợp lệ',
                    'Một số thuộc tính đã thay đổi trên hệ thống. Vui lòng chọn lại danh mục và nhập lại thuộc tính.',
                )
                return
            }

            const attributePayload = attributeEntries.filter((item) => allowedAttributeIds.has(item.attributeId))

            const createPayload = {
                categoryId: Number(formData.categoryId),
                postTitle: formData.postTitle.trim(),
                postLocation: formData.postLocation.trim() || undefined,
                ...(options?.shopId ? { shopId: Number(options.shopId) } : {}),
                images,
                // videos được gửi để backend xử lý trong tương lai (hiện backend bỏ qua)
                ...(videos.length > 0 ? { videos } : {}),
                attributes: attributePayload,
            }

            // Some backends may respond 500 for a short time window right after upload.
            // Retry once (quietly) to avoid showing a scary error to the user.
            try {
                await postService.createPost(createPayload)
            } catch (e: any) {
                const status = e?.response?.status
                if (status === 500) {
                    await new Promise((resolve: any) => setTimeout(resolve, 1200))
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
                'Đăng tin thất bại',
                serverMessage || 'Đã có lỗi xảy ra trong quá trình tạo bài đăng. Vui lòng thử lại.',
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
