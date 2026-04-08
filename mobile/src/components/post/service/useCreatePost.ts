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
    type: 'image' | 'video';
}

interface CreatePostFormData {
    categoryId: string;
    postTitle: string;
    postContent: string;
    postPrice: string;
    postLocation: string;
    postContactPhone: string;
    attributes: Record<number, string>;
}

const initialFormData: CreatePostFormData = {
    categoryId: '',
    postTitle: '',
    postContent: '',
    postPrice: '',
    postLocation: '',
    postContactPhone: '',
    attributes: {},
}

const useCreatePost = () => {
    const [categories, setCategories] = useState<Category[]>([])
    const [attributes, setAttributes] = useState<CategoryAttribute[]>([])
    const [loadingInitialData, setLoadingInitialData] = useState(true)
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
            const res = await postService.getCategories()
            setCategories(Array.isArray(res) ? res : [])
        } catch (error) {
            console.error('Error fetching initial data:', error)
            CustomAlert('Error', 'Unable to load post categories.')
        } finally {
            setLoadingInitialData(false)
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
            CustomAlert('Error', 'Unable to load the attributes for the selected category.')
        } finally {
            setLoadingAttributes(false)
        }
    }

    const pickMedia = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permission.granted) {
            CustomAlert('Permission required', 'Please grant photo library access to select media.')
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            quality: 1,
            selectionLimit: 10,
        })

        if (!result.canceled) {
            const selectedMedia: SelectedMedia[] = result.assets.map((asset): SelectedMedia => ({
                uri: asset.uri,
                type: asset.type === 'video' ? 'video' : 'image',
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
            CustomAlert('Missing information', 'Please enter the post title.')
            return false
        }

        if (!formData.categoryId) {
            CustomAlert('Missing information', 'Please choose a category.')
            return false
        }

        if (!formData.postPrice.trim() || Number.isNaN(Number(formData.postPrice)) || Number(formData.postPrice) < 0) {
            CustomAlert('Invalid price', 'The selling price must be a number greater than or equal to 0.')
            return false
        }

        if (formData.postTitle.length > 200) {
            CustomAlert('Value too long', 'The post title cannot exceed 200 characters.')
            return false
        }

        if (formData.postContent.length > 2000) {
            CustomAlert('Value too long', 'The post description cannot exceed 2000 characters.')
            return false
        }

        if (formData.postLocation && formData.postLocation.length > 255) {
            CustomAlert('Value too long', 'The location cannot exceed 255 characters.')
            return false
        }

        if (formData.postContactPhone && (formData.postContactPhone.length > 20 || !/^\+?[0-9\s-]+$/.test(formData.postContactPhone))) {
            CustomAlert('Invalid phone', 'Please enter a valid contact phone number.')
            return false
        }

        if (media.length === 0) {
            CustomAlert('Missing media', 'Please select at least one image or video.')
            return false
        }

        const missingRequiredAttribute = attributes.find(
            (attr) => attr.required && !formData.attributes[attr.attributeId]?.trim()
        )

        if (missingRequiredAttribute) {
            CustomAlert('Missing attribute', `Please enter "${missingRequiredAttribute.attributeTitle}".`)
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

            //2. Logic phan loai URL thanh Image va Video
            const images: string[] = []
            const videos: string[] = []

            uploadedUrls.forEach((url: any) => {
                const extension = url.split('.').pop()?.toLowerCase()
                if (extension && ['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
                    images.push(url)
                }
                if (extension && ['mp4', 'mov', 'm4x', 'avi'].includes(extension)) {
                    videos.push(url)
                }
            })

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
                postContent: formData.postContent.trim() || undefined,
                postPrice: formData.postPrice ? Number(formData.postPrice.trim()) : undefined,
                postLocation: formData.postLocation.trim() || undefined,
                postContactPhone: formData.postContactPhone.replace(/\s+/g, '') || undefined,
                images,
                videos,
                attributes: attributePayload,
            })

            setSubmitted(true)
            resetForm()
        } catch (e) {
            console.error('Error submitting form:', e)
            CustomAlert('Post creation failed', 'Something went wrong while creating the post. Please try again.')
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
