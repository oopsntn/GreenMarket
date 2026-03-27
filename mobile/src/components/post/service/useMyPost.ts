import React, { useState } from 'react'

const useMyPost = () => {
    const { user, shop } = useAuth()
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'personal' | 'shop'>(shop ? 'shop' : 'personal')
    const [editingPost, setEditingPost] = useState<any | null>(null)
}

export default useMyPost
