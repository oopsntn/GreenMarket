import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { useAuth } from '../../../context/AuthContext'
import { postService } from './postService'

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
            Alert.alert('Error', 'Unable to load the post list.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPosts()
    }, [user?.id])

    useEffect(() => {
        setActiveTab(shop ? 'shop' : 'personal')
    }, [shop?.shopId])

    const handleDelete = (postId: number) => {
        Alert.alert(
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
                            Alert.alert('Success', 'Post deleted successfully.')
                        } catch (e) {
                            console.error('Error deleting post:', e)
                            Alert.alert('Error', 'Failed to delete the post.')
                        }
                    }
                }
            ]
        )
    }

    const handleUpdate = async (postId: number, data: { postTitle: string; postPrice: string }) => {
        if (!data.postTitle.trim()) {
            Alert.alert('Missing information', 'Please enter the post title.')
            return
        }

        if (!data.postPrice.trim() || Number.isNaN(Number(data.postPrice)) || Number(data.postPrice) < 0) {
            Alert.alert('Invalid price', 'The selling price must be a number greater than or equal to 0.')
            return
        }

        try {
            setSaving(true)
            const updatedPost = await postService.updatePost(postId, {
                postTitle: data.postTitle.trim(),
                postPrice: data.postPrice.trim(),
            })

            setPosts((prev) => prev.map((post) => (
                post.postId === postId
                    ? { ...post, ...updatedPost }
                    : post
            )))
            setEditingPost(null)
            Alert.alert('Success', 'Post updated successfully.')
        } catch (e) {
            console.error('Error updating post:', e)
            Alert.alert('Error', 'Update failed')
        } finally {
            setSaving(false)
        }
    }

    const filteredPosts = posts.filter((post) => {
        if (activeTab === 'trash') {
            return post.postStatus === 'hidden'
        }

        if (activeTab === 'shop') {
            return post.postShopId !== null
        }

        return post.postShopId === null
    })

    return {
        state: { posts: filteredPosts, loading, activeTab, shop, editingPost, saving },
        actions: { setActiveTab, handleDelete, handleUpdate, setEditingPost, fetchPosts }
    }
}

export default useMyPost
