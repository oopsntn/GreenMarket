import React, { useEffect, useState } from 'react'
import { postService } from './postService'
import * as ImagePicker from 'expo-image-picker'

const useCreatePost = () => {
    const [categories, setCategories] = useState<any[]>([])
    const [attributes, setAttributes] = useState<any[]>([])
    const [loadingAttributes, setLoadingAttributes] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [media, setMedia] = useState<{ uri: string, type: 'image' | 'video' }[]>([])

    const [formData, setFormData] = useState({
        categoryId: '',
        postTitle: '',
        postContent: '',
        postPrice: '',
        postLocation: '',
        attributes: {} as Record<number, string>
    })

    useEffect(() => {

    }, [])
    const fetchInitialData = async () => {
        try {
            const res = await postService.getCategories()
            setCategories(res)
        } catch (error) {
            console.error('Error fetching initial data:', error)
        }
    }

    const handleCategorySelect = async (catId: string) => {
        setFormData(prev => ({ ...prev, categoryId: catId, attributes: {} }))
        try {
            setLoadingAttributes(true)
            const res = await postService.getCategoryAttributes(Number(catId))
            setAttributes(res)
        } catch (e) {
            console.error('Error fetching category attributes:', e)
        } finally {
            setLoadingAttributes(false)
        }
    }

    const pickMedia = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,
            quality: 1,
        })
        if (!result.canceled) {
            const selectedMedia = result.assets.map(asset => ({
                uri: asset.uri,
                type: asset.type as 'image' | 'video'
            }))
            setMedia(prev => [...prev, ...selectedMedia])
        }
    }

    const removeMedia = (index: number) => {
        setMedia(prev => prev.filter((_, i) => i !== index))
    }

    const submitForm = async () => {
        if (!formData.postTitle || !formData.categoryId || media.length === 0) {
            alert("Điền đầy đủ thông tin và chọn ít nhất 1 ảnh nhó!")
            return
        }
        setSubmitting(true)
        try {
            await postService.createPost({
                ...formData,
                media: media.map(m => m.uri) // Gửi URI, backend sẽ xử lý upload
            })
            setSubmitted(true)
        } catch (e) {
            alert("Có lỗi xảy ra khi tạo bài đăng. Vui lòng thử lại.")
            console.error('Error submitting form:', e)
        } finally {
            setSubmitting(false)
        }
    }
    return {
        state: { categories, attributes, loadingAttributes, submitting, submitted, media, formData },
        actions: { setFormData, handleCategorySelect, pickMedia, removeMedia, submitForm }
    }
}

export default useCreatePost
