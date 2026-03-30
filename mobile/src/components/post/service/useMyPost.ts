import React, { useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { postService } from './postService'
import { Alert } from 'react-native'

const useMyPost = () => {
    const { user, shop } = useAuth()
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'personal' | 'shop' | 'trash'>(shop ? 'shop' : 'personal')
    const [editingPost, setEditingPost] = useState<any | null>(null)

    const fetchPosts = async () => {
        if (!user?.id) return
        try {
            setLoading(true)
            const res = await postService.getMyPosts(user.id)
            setPosts(res)
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPosts()
    }, [user?.id])

    const handleDelete = (postId: number) => {
        Alert.alert(
            "Xác nhận xóa",
            "Bạn có chắc chắn muốn xóa bài đăng này không?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: async () => {
                        // Gọi API xóa ở đây
                        // Sau đó gọi fetchPosts() để cập nhật lại danh sách
                    }
                }
            ]
        );
    }

    const handleUpdate = async (postId: number, data: any) => {
        try {

        } catch (e) {
            Alert.alert('Lỗi', 'Cập nhật thất bại')
        }
    }

    const filteredPosts = posts.filter(post => {
        if (shop) return true;
        return activeTab === 'shop' ? post.postShopId !== null : post.postShopId === null;
    })

    return {
        state: { posts: filteredPosts, loading, activeTab, shop, editingPost },
        actions: { setActiveTab, handleDelete, handleUpdate, setEditingPost, fetchPosts }
    }
}

export default useMyPost
