import React, { useState } from 'react'
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import useMyPost from '../service/useMyPost'
import { CheckCircle2, Clock, Plus, XCircle } from 'lucide-react-native'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import PostTabs from '../components/PostTabs'
import PostItem from '../components/PostItem'
import EditPostModal from '../components/EditPostModal'

const MyPostLayout = () => {
    const navigation = useNavigation<any>()
    const { state, actions } = useMyPost()

    const [editData, setEditData] = useState({ title: '', price: '' })
    const openEdit = (post: any) => {
        setEditData({ title: post.postTitle, price: String(post.postPrice) })
        actions.setEditingPost(post)
    }

    const renderStatus = (status: string) => {
        const configs: any = {
            pending: { label: 'Chờ duyệt', color: '#f59e0b', icon: <Clock size={12} color="#f59e0b" /> },
            approved: { label: 'Đã duyệt', color: '#10b981', icon: <CheckCircle2 size={12} color="#10b981" /> },
            rejected: { label: 'Bị từ chối', color: '#ef4444', icon: <XCircle size={12} color="#ef4444" /> }
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
        <MobileLayout title='Quản lý đăng tin' backButton={() => navigation.goBack()}
            rightAction={
                <TouchableOpacity onPress={() => navigation.navigate('CreatePost')}>
                    <Plus color='#10b981' size={24} />
                </TouchableOpacity>
            }>
            {/* Tabs */}
            {!state.shop && <PostTabs activeTab={state.activeTab} onTabChange={actions.setActiveTab} styles={styles} />}

            {/* List Body */}
            {state.loading ? (
                <ActivityIndicator style={{ marginTop: 50 }} />
            ) : (
                <FlatList data={state.posts}
                    renderItem={({ item }) => (
                        <PostItem
                            item={item}
                            onEdit={openEdit}
                            onDelete={() => actions.handleDelete}
                            styles={styles}
                            renderStatus={renderStatus}
                        />
                    )}
                />
            )}
            {/* Edit Modal */}
            <EditPostModal
                visible={!!state.editingPost}
                editingPost={state.editingPost}
                editData={editData}
                setEditData={setEditData}
                onClose={() => actions.setEditingPost(null)}
                onSave={actions.handleUpdate}
                styles={styles}
            />
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    tabContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff' },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#eee' },
    activeTab: { borderBottomColor: '#10b981' },
    tabText: { color: '#999', fontWeight: '600' },
    activeTabText: { color: '#10b981' },
    postCard: { marginBottom: 12, padding: 12 },
    postContent: { flexDirection: 'row', alignItems: 'center' },
    imgPlaceholder: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    info: { flex: 1, marginLeft: 12 },
    postTitle: { fontWeight: '700', fontSize: 14, marginBottom: 4 },
    postPrice: { color: '#10b981', fontWeight: '800', fontSize: 13, marginBottom: 6 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    statusText: { fontSize: 10, fontWeight: '700', marginLeft: 4 },
    actions: { flexDirection: 'row' },
    actionBtn: { padding: 8, marginLeft: 4 },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginVertical: 20, color: '#999' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalCard: { padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15 },
    modalButtons: { flexDirection: 'row', marginTop: 20 }
})

export default MyPostLayout
