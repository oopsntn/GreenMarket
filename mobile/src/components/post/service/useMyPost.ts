import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { useAuth } from '../../../context/AuthContext'
import { postService } from './postService'
import CustomAlert from '../../../utils/AlertHelper'

type PostTab = 'personal' | 'shop' | 'trash'

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
                { text: 'Cancel', style: 'cancel' },
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

    const handleUpdate = async (postId: number, data: {
        postTitle: string;
        categoryId: number;
        postContent: string;
        postLocation: string;
        postContactPhone: string;
    }) => {
        if (!data.postTitle.trim()) {
            CustomAlert('Thông tin bị thiếu', 'Vui lòng nhập tiêu đề bài viết.')
            return
        }

        if (!data.categoryId) {
            CustomAlert('Thông tin bị thiếu', 'Vui lòng chọn một danh mục.')
            return
        }

        // Constraints mentioned in plan
        if (data.postContent.length > 2000) {
            CustomAlert('Thông tin quá dài', 'Phần mô tả không được vượt quá 2000 ký tự.')
            return
        }

        try {
            setSaving(true)
            const updatedPost = await postService.updatePost(postId, {
                postTitle: data.postTitle.trim(),
                categoryId: data.categoryId,
                postContent: data.postContent.trim() || undefined,
                postLocation: data.postLocation.trim() || undefined,
                postContactPhone: data.postContactPhone.replace(/\s+/g, '') || undefined,
            })

            setPosts((prev) => prev.map((post) => (
                post.postId === postId
                    ? { ...post, ...updatedPost }
                    : post
            )))
            setEditingPost(null)
            CustomAlert('Success', 'Bài viết đã được cập nhật thành công.')
            await fetchPosts() // Refresh to ensure data consistency
        } catch (e) {
            console.error('Lỗi khi cập nhật bài viết:', e)
            CustomAlert('Lỗi', 'Cập nhật thất bại. Vui lòng thử lại.')
        } finally {
            setSaving(false)
        }
    }

    const filteredPosts = posts;

    const hasShopPosts = posts.some((post) => post.postShopId !== null)

    return {
        state: { posts: filteredPosts, loading, activeTab, shop, editingPost, saving, hasShopPosts },
        actions: { setActiveTab, handleDelete, handleUpdate, setEditingPost, fetchPosts }
    }
}

export default useMyPost
