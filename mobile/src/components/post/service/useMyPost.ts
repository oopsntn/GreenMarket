import { useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { postService } from './postService'
import CustomAlert from '../../../utils/AlertHelper'

type PostTab = 'personal' | 'shop' | 'trash'

type UpdatePostAttribute = {
    attributeId: number;
    value: string;
}

type UpdatePostInput = {
    postTitle: string;
    categoryId: number;
    postLocation: string;
    postContactPhone: string;
    attributes?: UpdatePostAttribute[];
}

const useMyPost = () => {
    const { user, shop } = useAuth()
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<PostTab>(shop ? 'shop' : 'personal')
    const [editingPost, setEditingPost] = useState<any | null>(null)
    const [saving, setSaving] = useState(false)

    const fetchPosts = async () => {
        if (!user?.id) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const res = await postService.getMyPosts()
            setPosts(Array.isArray(res) ? res : [])
        } catch (e) {
            console.error('Error fetching posts:', e)
            CustomAlert('Lỗi', 'Không thể tải danh sách bài viết.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPosts()
    }, [user?.id])

    useEffect(() => {
        const hasShopPosts = posts.some((post) => post.postShopId !== null)

        setActiveTab((currentTab) => {
            if (currentTab === 'shop' && !shop && !hasShopPosts) {
                return 'personal'
            }

            if (currentTab === 'personal' && !shop && hasShopPosts && posts.every((post) => post.postShopId !== null)) {
                return 'shop'
            }

            if (currentTab === 'personal' && shop && posts.every((post) => post.postShopId !== null)) {
                return 'shop'
            }

            return currentTab
        })
    }, [posts, shop?.shopId])

    const handleDelete = (postId: number) => {
        CustomAlert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa bài đăng này không?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await postService.deletePost(postId)
                            await fetchPosts()
                            if (editingPost?.postId === postId) {
                                setEditingPost(null)
                            }
                            CustomAlert('Thành công', 'Bài viết đã bị xóa thành công.')
                        } catch (e) {
                            console.error('Error deleting post:', e)
                            CustomAlert('Lỗi', 'Không thể xóa bài đăng.')
                        }
                    }
                }
            ]
        )
    }

    const handleUpdate = async (postId: number, data: UpdatePostInput) => {
        if (!data.postTitle.trim()) {
            CustomAlert('Thông tin bị thiếu', 'Vui lòng nhập tiêu đề bài viết.')
            return
        }

        if (!data.categoryId) {
            CustomAlert('Thông tin bị thiếu', 'Vui lòng chọn một danh mục.')
            return
        }

        if (data.postLocation.length > 255) {
            CustomAlert('Thông tin quá dài', 'Địa chỉ không được vượt quá 255 ký tự.')
            return
        }

        if (data.postContactPhone) {
            const cleanPhone = data.postContactPhone.trim()
            if (cleanPhone.length < 9 || cleanPhone.length > 20 || !/^\+?[0-9\s-]+$/.test(cleanPhone)) {
                CustomAlert('Giá trị không hợp lệ', 'Vui lòng nhập số điện thoại hợp lệ (ít nhất 9 số).')
                return
            }
        }

        const normalizedAttributes = Array.isArray(data.attributes)
            ? data.attributes
                .filter((item) => item?.attributeId && String(item?.value ?? '').trim())
                .map((item) => ({
                    attributeId: Number(item.attributeId),
                    value: String(item.value).trim(),
                }))
            : undefined

        if (normalizedAttributes?.some((item) => !Number.isFinite(item.attributeId) || item.attributeId <= 0)) {
            CustomAlert('Thuộc tính không hợp lệ', 'Vui lòng kiểm tra lại thuộc tính bài đăng.')
            return
        }

        try {
            setSaving(true)
            const updatedPost = await postService.updatePost(postId, {
                postTitle: data.postTitle.trim(),
                categoryId: data.categoryId,
                postLocation: data.postLocation.trim() || undefined,
                postContactPhone: data.postContactPhone.replace(/\s+/g, '') || undefined,
                attributes: normalizedAttributes,
            })

            setPosts((prev) => prev.map((post) => (
                post.postId === postId
                    ? { ...post, ...updatedPost }
                    : post
            )))
            setEditingPost(null)
            CustomAlert('Thành công', 'Bài viết đã được cập nhật thành công.')
            await fetchPosts()
        } catch (e) {
            console.error('Lỗi khi cập nhật bài viết:', e)
            CustomAlert('Lỗi', 'Cập nhật thất bại. Vui lòng thử lại.')
        } finally {
            setSaving(false)
        }
    }

    const filteredPosts = posts
    const hasShopPosts = posts.some((post) => post.postShopId !== null)

    return {
        state: { posts: filteredPosts, loading, activeTab, shop, editingPost, saving, hasShopPosts },
        actions: { setActiveTab, handleDelete, handleUpdate, setEditingPost, fetchPosts }
    }
}

export default useMyPost
