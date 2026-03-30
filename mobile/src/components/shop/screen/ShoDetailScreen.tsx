import React from 'react'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import { useNavigation } from '@react-navigation/native'
import { useShopDetail } from '../service/useShopDetail'
import { FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { Settings2 } from 'lucide-react-native'
import ShopHeader from '../components/ShopHeader'
import PostItem from '../../post/components/PostItem'

const ShoDetailScreen = () => {
    const navigation = useNavigation<any>()
    const { shop, loading, actions } = useShopDetail()
    return (
        <MobileLayout title="Chi tiết nhà vườn"
            rightAction={
                <TouchableOpacity onPress={() => navigation.navigate('EditShop')}>
                    <Settings2 color="#10b981" size={24} />
                </TouchableOpacity>
            }
        >
            <FlatList
                data={shop?.posts || []}
                keyExtractor={(item) => item.postId.toString()}
                onRefresh={actions.refresh}
                refreshing={loading}
                ListHeaderComponent={
                    <ShopHeader shop={shop} isOwner={true} styles />
                }
                renderItem={({ item }) => (
                    <PostItem
                        item={item}
                        onEdit={() => navigation.navigate('EditPost', { post: item })}
                        onDelete={() => { }}
                        styles={styles}
                    />
                )}
                ListEmptyComponent={
                    <Text style={{ textAlign: 'center', marginTop: 40, color: '#999' }}>
                        Vườn của bạn chưa có bài đăng nào.
                    </Text>
                }
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    headerCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
    },
    headerTop: { flexDirection: 'row', alignItems: 'center' },
    shopAvatar: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#f0fdf4',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#dcfce7',
    },
    shopName: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
    verifyBadge: {
        backgroundColor: '#10b98110',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginTop: 5,
    },
    verifyText: { color: '#10b981', fontSize: 10, fontWeight: 'bold' },
    infoGrid: { marginTop: 20, gap: 10 },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoText: { color: '#666', fontSize: 14 },
    zaloBtn: {
        backgroundColor: '#2563eb',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        marginTop: 20,
        gap: 10,
    },
    zaloBtnText: { color: '#fff', fontWeight: 'bold' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },
    // Tận dụng lại style của PostItem từ file trước đó
    postCard: { backgroundColor: '#fff', marginBottom: 12, borderRadius: 16, padding: 12, flexDirection: 'row' },
    imgPlaceholder: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f5f5f5' },
    info: { flex: 1, marginLeft: 12 },
    postTitle: { fontWeight: 'bold', fontSize: 15 },
    postPrice: { color: '#10b981', fontWeight: 'bold', marginTop: 4 },
    mapPreview: {
        height: 100,
        backgroundColor: '#f0fdf4',
        borderRadius: 16,
        marginTop: 15,
        borderWidth: 1,
        borderColor: '#dcfce7',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    mapLinkText: {
        color: '#10b981',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default ShoDetailScreen
