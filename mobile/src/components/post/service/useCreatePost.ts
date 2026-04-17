import { useEffect, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import CustomAlert from '../../../utils/AlertHelper'
import { postService } from './postService'

interface Category {
    categoryId: number;
    categoryTitle: string;
}

interface CategoryAttribute {
    attributeId: number;
    attributeTitle: string;
    attributeDataType?: string;
    required?: boolean;
}

interface SelectedMedia {
    uri: string;
    type: 'image';
}

interface CreatePostFormData {
    categoryId: string;
    postTitle: string;
    postPrice: string;
    postLocation: string;
    postContactPhone: string;
    attributes: Record<number, string>;
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
    effectivePolicyType: string;
    allowedNewPostsPerDay: number;
    usedNewPostsToday: number;
    isLimitReached: boolean;
    postCreationFee: number;
}

const useCreatePost = () => {
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
                postService.getPostingPolicy().catch(() => null)
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
        } catch (e) {
            console.error('Error fetching category attributes:', e)
            CustomAlert('Lỗi', 'Không thể tải thuộc tính cho danh mục đã chọn.')
        } finally {
            setLoadingAttributes(false)
        }
    }

    const pickMedia = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permission.granted) {
            CustomAlert('Yêu cầu quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để chọn ảnh.')
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 1,
            selectionLimit: 10,
        })

        if (!result.canceled) {
            const selectedMedia: SelectedMedia[] = result.assets.map((asset): SelectedMedia => ({
                uri: asset.uri,
                type: 'image',
            }))

            setMedia((prev) => [...prev, ...selectedMedia].slice(0, 10))
        }
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

        const priceStr = formData.postPrice.trim()
        if (!priceStr || Number.isNaN(Number(priceStr)) || Number(priceStr) < 0) {
            CustomAlert('Giá trị không hợp lệ', 'Giá bán phải là số lớn hơn hoặc bằng 0.')
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

        if (formData.postContactPhone) {
            const cleanPhone = formData.postContactPhone.trim();
            if (cleanPhone.length < 9 || cleanPhone.length > 20 || !/^\+?[0-9\s-]+$/.test(cleanPhone)) {
                CustomAlert('Giá trị không hợp lệ', 'Vui lòng nhập số điện thoại hợp lệ (ít nhất 9 số).')
                return false
            }
        }

        if (media.length === 0) {
            CustomAlert('Thiếu hình ảnh', 'Vui lòng chọn ít nhất một hình ảnh.')
            return false
        }

        const missingRequiredAttribute = attributes.find(
            (attr) => attr.required && !formData.attributes[attr.attributeId]?.trim()
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

            //1. Upload toan bo media len server
            const mediaUris = media.map((m) => m.uri)
            const uploadedMedia = await postService.uploadMedia(mediaUris)
            const uploadedUrls = Array.isArray(uploadedMedia?.urls) ? uploadedMedia.urls : []

            if (uploadedUrls.length !== media.length) {
                throw new Error('Uploaded media count mismatch')
            }

            //2. Prepare image payload in the same order as the selected media
            const images = uploadedUrls.filter((_: string, index: number) => media[index]?.type === 'image')

            //3. Chuan bi Attribute Payload
            const attributePayload = Object.entries(formData.attributes)
                .filter(([, value]) => value.trim())
                .map(([attributeId, value]) => ({
                    attributeId: Number(attributeId),
                    value: value.trim(),
                }))

            //4. Goi API tao Post
            await postService.createPost({
                categoryId: Number(formData.categoryId),
                postTitle: formData.postTitle.trim(),
                postPrice: Number(formData.postPrice.trim()),
                postLocation: formData.postLocation.trim() || undefined,
                postContactPhone: formData.postContactPhone.replace(/\s+/g, '') || undefined,
                images,
                attributes: attributePayload,
            })

            setSubmitted(true)
            resetForm()
        } catch (e: any) {
            console.error('Error submitting form:', {
                status: e?.response?.status,
                data: e?.response?.data,
                message: e?.message,
            })
            const serverMessage = e?.response?.data?.error || e?.response?.data?.message
            CustomAlert(
                'Dang tin that bai',
                serverMessage || 'Da co loi xay ra trong qua trinh tao bai dang. Vui long thu lai.'
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
        }
    }
}

export default useCreatePost
