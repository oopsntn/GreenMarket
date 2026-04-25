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
            CustomAlert('Error', 'Unable to load the post list.')
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
            'Confirm deletion',
            'Are you sure you want to delete this post?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await postService.deletePost(postId)
                            await fetchPosts()
                            if (editingPost?.postId === postId) {
                                setEditingPost(null)
                            }
                            CustomAlert('Success', 'Post deleted successfully.')
                        } catch (e) {
                            console.error('Error deleting post:', e)
                            CustomAlert('Error', 'Failed to delete the post.')
                        }
                    }
                }
            ]
        )
    }

    const handleUpdate = async (postId: number, data: {
        postTitle: string;
        postPrice: string;
        categoryId: number;
        postContent: string;
        postLocation: string;
        postContactPhone: string;
    }) => {
        if (!data.postTitle.trim()) {
            CustomAlert('Missing information', 'Please enter the post title.')
            return
        }

        if (!data.categoryId) {
            CustomAlert('Missing information', 'Please select a category.')
            return
        }

        if (!data.postPrice.trim() || Number.isNaN(Number(data.postPrice)) || Number(data.postPrice) < 0) {
            CustomAlert('Invalid price', 'The price must be a number greater than or equal to 0.')
            return
        }

        // Constraints mentioned in plan
        if (data.postContent.length > 2000) {
            CustomAlert('Value too long', 'The description cannot exceed 2000 characters.')
            return
        }

        try {
            setSaving(true)
            const updatedPost = await postService.updatePost(postId, {
                postTitle: data.postTitle.trim(),
                postPrice: Number(data.postPrice.trim()),
                categoryId: data.categoryId,
                postLocation: data.postLocation.trim() || undefined,
                postContactPhone: data.postContactPhone.replace(/\s+/g, '') || undefined,
            })

            setPosts((prev) => prev.map((post) => (
                post.postId === postId
                    ? { ...post, ...updatedPost }
                    : post
            )))
            setEditingPost(null)
            CustomAlert('Success', 'Post updated successfully.')
            await fetchPosts() // Refresh to ensure data consistency
        } catch (e) {
            console.error('Error updating post:', e)
            CustomAlert('Error', 'Update failed. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const filteredPosts = posts.filter((post) => {
        if (activeTab === 'shop') {
            return post.postShopId !== null
        }

        return post.postShopId === null
    })

    const hasShopPosts = posts.some((post) => post.postShopId !== null)

    return {
        state: { posts: filteredPosts, loading, activeTab, shop, editingPost, saving, hasShopPosts },
        actions: { setActiveTab, handleDelete, handleUpdate, setEditingPost, fetchPosts }
    }
}

export default useMyPost
