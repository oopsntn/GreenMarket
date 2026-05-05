import React, { useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { CheckCircle2, Clock, Plus, XCircle } from 'lucide-react-native'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import PostItem from '../components/PostItem'
import EditPostModal from '../components/EditPostModal'
import useMyPost from '../service/useMyPost'
import { postService } from '../service/postService'
import { useAuth } from '../../../context/AuthContext'

type EditData = {
    title: string;
    categoryId: number;
    location: string;
    contactPhone: string;
    attributes: Record<number, string>;
}

const emptyEditData: EditData = {
    title: '',
    categoryId: 0,
    location: '',
    contactPhone: '',
    attributes: {},
}

const MyPostLayout = () => {
    const navigation = useNavigation<any>()
    const route = useRoute<any>()
    const { state, actions } = useMyPost()
    const { user, shop } = useAuth()
    const [categories, setCategories] = useState<any[]>([])
    const [categoryAttributes, setCategoryAttributes] = useState<any[]>([])
    const showBackButton = route.name !== 'MyPostsTab'

    const [editData, setEditData] = useState<EditData>(emptyEditData)

    const fetchCategories = async () => {
        try {
            const res = await postService.getCategories()
            setCategories(Array.isArray(res) ? res : [])
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    const loadCategoryAttributes = async (categoryId: number, prefills?: Record<number, string>) => {
        if (!categoryId) {
            setCategoryAttributes([])
            setEditData((prev) => ({
                ...prev,
                categoryId: 0,
                attributes: prefills || {},
            }))
            return
        }

        try {
            const res = await postService.getCategoryAttributes(categoryId)
            setCategoryAttributes(Array.isArray(res) ? res : [])
            setEditData((prev) => ({
                ...prev,
                categoryId,
                attributes: prefills || prev.attributes,
            }))
        } catch (error) {
            console.error('Error fetching category attributes:', error)
            setCategoryAttributes([])
        }
    }

    React.useEffect(() => {
        fetchCategories()
    }, [])

    const getPrefilledAttributes = (post: any): Record<number, string> => {
        if (!Array.isArray(post?.attributes)) return {}

        return post.attributes.reduce((acc: Record<number, string>, item: any) => {
            const rawId = item?.attributeId ?? item?.id
            const rawValue = item?.value ?? item?.attributeValue
            const attributeId = Number(rawId)

            if (!Number.isNaN(attributeId) && rawValue !== undefined && rawValue !== null) {
                acc[attributeId] = String(rawValue)
            }

            return acc
        }, {})
    }

    const openEdit = async (post: any) => {
        const prefilledAttributes = getPrefilledAttributes(post)
        setEditData({
            title: post.postTitle || '',
            categoryId: Number(post.categoryId || 0),
            location: post.postLocation || '',
            contactPhone: post.postContactPhone || '',
            attributes: prefilledAttributes,
        })
        actions.setEditingPost(post)
        await loadCategoryAttributes(Number(post.categoryId || 0), prefilledAttributes)
    }

    const handleCategoryChange = async (categoryId: number) => {
        await loadCategoryAttributes(categoryId, {})
    }

    const renderStatus = (status: string) => {
        const configs: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
            pending: {
                label: 'Chờ duyệt',
                color: '#f59e0b',
                icon: <Clock size={12} color="#f59e0b" />,
            },
            pending_owner: {
                label: 'Chờ chủ vườn duyệt',
                color: '#2563eb',
                icon: <Clock size={12} color="#2563eb" />,
            },
            approved: {
                label: 'Đã duyệt',
                color: '#10b981',
                icon: <CheckCircle2 size={12} color="#10b981" />,
            },
            rejected: {
                label: 'Từ chối',
                color: '#ef4444',
                icon: <XCircle size={12} color="#ef4444" />,
            },
        }

        const config = configs[status] || configs.pending

        return (
            <View style={[styles.statusBadge, { borderColor: config.color }]}>
                {config.icon}
                <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
            </View>
        )
    }

    const handleCreatePost = () => {
        if (user?.businessRoleCode === 'COLLABORATOR') {
            navigation.navigate('MyActiveShops')
            return
        }

        navigation.navigate('CreatePost')
    }

    return (
        <MobileLayout
            title="Quản lý tin đăng"
            backButton={showBackButton ? () => navigation.goBack() : undefined}
            scrollEnabled={false}
            rightAction={
                <TouchableOpacity testID="my-post-create-button" onPress={handleCreatePost}>
                    <Plus color="#10b981" size={24} />
                </TouchableOpacity>
            }
        >
            {state.loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#10b981" />
                    <Text style={styles.loadingText}>Đang tải tin đăng...</Text>
                </View>
            ) : (
                <FlatList
                    data={state.posts}
                    renderItem={({ item }) => (
                        <PostItem
                            item={item}
                            onEdit={openEdit}
                            onDelete={actions.handleDelete}
                            styles={styles}
                            renderStatus={renderStatus}
                        />
                    )}
                    keyExtractor={(item) => item.postId.toString()}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>
                                Bạn chưa có tin đăng nào. Hãy nhấn nút "+" để tạo tin mới.
                            </Text>
                        </View>
                    }
                />
            )}

            <EditPostModal
                visible={!!state.editingPost}
                editingPost={state.editingPost}
                editData={editData}
                setEditData={setEditData}
                onClose={() => {
                    actions.setEditingPost(null)
                    setCategoryAttributes([])
                    setEditData(emptyEditData)
                }}
                onSave={actions.handleUpdate}
                onCategoryChange={handleCategoryChange}
                categories={categories}
                categoryAttributes={categoryAttributes}
                saving={state.saving}
                hideLocation={!!shop}
            />
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    tabContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#10b981',
    },
    tabText: {
        color: '#6b7280',
        fontWeight: '600',
        fontSize: 13,
    },
    activeTabText: {
        color: '#10b981',
    },
    postCard: {
        marginBottom: 12,
        marginHorizontal: 16,
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
    },
    postContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    imgPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    postImage: {
        width: '100%',
        height: '100%',
    },
    info: {
        flex: 1,
        marginLeft: 14,
    },
    postTitle: {
        fontWeight: '700',
        fontSize: 15,
        color: '#1f2937',
        marginBottom: 4,
    },
    contactBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#6ee7b7',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginBottom: 6,
    },
    contactBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#065f46',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        padding: 10,
        marginLeft: 6,
    },
    empty: {
        alignItems: 'center',
        marginTop: 120,
        paddingHorizontal: 40,
    },
    emptyText: {
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: 14,
        lineHeight: 22,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 50,
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
})

export default MyPostLayout
