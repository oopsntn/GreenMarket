import React, { useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import useMyPost from '../service/useMyPost'
import { CheckCircle2, Clock, Plus, XCircle } from 'lucide-react-native'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import PostTabs from '../components/PostTabs'
import PostItem from '../components/PostItem'
import EditPostModal from '../components/EditPostModal'
import { postService } from '../service/postService'

const MyPostLayout = () => {
    const navigation = useNavigation<any>()
    const { state, actions } = useMyPost()
    const [categories, setCategories] = useState<any[]>([])

    const [editData, setEditData] = useState({
        title: '',
        price: '',
        categoryId: 0,
        content: '',
        location: '',
        contactPhone: ''
    })

    const fetchCategories = async () => {
        try {
            const res = await postService.getCategories()
            setCategories(res)
        } catch (e) {
            console.error('Error fetching categories: ', e)
        }
    }

    React.useEffect(() => {
        fetchCategories()
    }, [])

    const openEdit = (post: any) => {
        setEditData({
            title: post.postTitle,
            price: String(post.postPrice),
            categoryId: post.categoryId,
            content: post.postContent || '',
            location: post.postLocation || '',
            contactPhone: post.postContactPhone || ''
        })
        actions.setEditingPost(post)
    }

    const renderStatus = (status: string) => {
        const configs: any = {
            pending: { label: 'Pending Approval', color: '#f59e0b', icon: <Clock size={12} color="#f59e0b" /> },
            approved: { label: 'Approved', color: '#10b981', icon: <CheckCircle2 size={12} color="#10b981" /> },
            rejected: { label: 'Rejected', color: '#ef4444', icon: <XCircle size={12} color="#ef4444" /> }
        };
        const config = configs[status] || configs.pending
        return (
            <View style={[styles.statusBadge, { borderColor: config.color }]}>
                {config.icon}
                <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
            </View>
        )
    }
    return (
        <MobileLayout title='Manage My Posts' backButton={() => navigation.goBack()}
            rightAction={
                <TouchableOpacity testID="my-post-create-button" onPress={() => navigation.navigate('CreatePost')}>
                    <Plus color='#10b981' size={24} />
                </TouchableOpacity>
            }>
            <PostTabs activeTab={state.activeTab} onTabChange={actions.setActiveTab} hasShop={!!state.shop} styles={styles} />

            {state.loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 }}>
                    <ActivityIndicator color="#10b981" />
                    <Text style={{ marginTop: 10, color: '#666' }}>Fetching your posts...</Text>
                </View>
            ) : (
                <FlatList data={state.posts}
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
                                {state.activeTab === 'shop'
                                        ? 'No shop posts yet.'
                                        : 'You haven\'t created any personal posts yet.'}
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
                onClose={() => actions.setEditingPost(null)}
                onSave={actions.handleUpdate}
                categories={categories}
                saving={state.saving}
                styles={styles}
            />
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    tabContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: '#10b981' },
    tabText: { color: '#6b7280', fontWeight: '600', fontSize: 13 },
    activeTabText: { color: '#10b981' },
    postCard: { marginBottom: 12, marginHorizontal: 16, padding: 12, backgroundColor: '#fff', borderRadius: 16 },
    postContent: { flexDirection: 'row', alignItems: 'center' },
    imgPlaceholder: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    postImage: { width: '100%', height: '100%' },
    info: { flex: 1, marginLeft: 14 },
    postTitle: { fontWeight: '700', fontSize: 15, color: '#1f2937', marginBottom: 4 },
    postPrice: { color: '#10b981', fontWeight: '800', fontSize: 14, marginBottom: 6 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: '700', marginLeft: 4 },
    actions: { flexDirection: 'row', alignItems: 'center' },
    actionBtn: { padding: 10, marginLeft: 6 },
    empty: { alignItems: 'center', marginTop: 120, paddingHorizontal: 40 },
    emptyText: { textAlign: 'center', color: '#9ca3af', fontSize: 14, lineHeight: 22 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalCard: { padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15 },
    modalButtons: { flexDirection: 'row', marginTop: 20 }
})

export default MyPostLayout
