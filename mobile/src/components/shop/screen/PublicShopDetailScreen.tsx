import React, { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import ShopHeader from '../components/ShopHeader'
import Card from '../../Reused/Card/Card'
import { ShopService } from '../service/shopService'
import { logMediaResolveError, resolveImageUrl } from '../../../utils/resolveImageUrl'

const PublicShopDetailScreen = ({ route }: any) => {
    const navigation = useNavigation<any>()
    const { shopId } = route.params
    const [shop, setShop] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchShop = async () => {
        try {
            setLoading(true)
            const res = await ShopService.getShopById(Number(shopId))
            setShop(res)
        } catch (error) {
            console.error('Error fetching public shop detail:', error)
            setShop(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchShop()
    }, [shopId])

    if (loading && !shop) {
        return (
            <MobileLayout title="Chi tiết cửa hàng" backButton={() => navigation.goBack()}>
                <ActivityIndicator style={{ marginTop: 80 }} color="#10b981" />
            </MobileLayout>
        )
    }

    const approvedPosts = Array.isArray(shop?.posts)
        ? shop.posts.filter((p: any) => p.postStatus === 'approved')
        : []

    return (
        <MobileLayout scrollEnabled={false} title="Chi tiết cửa hàng" backButton={() => navigation.goBack()}>
            {!shop ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyTitle}>Không tìm thấy cửa hàng</Text>
                    <Text style={styles.emptyText}>Cửa hàng này có thể đã bị xóa hoặc chưa sẵn sàng hiển thị công khai.</Text>
                </View>
            ) : (
                <FlatList
                    data={approvedPosts}
                    keyExtractor={(item) => item.postId.toString()}
                    refreshing={loading}
                    onRefresh={fetchShop}
                    ListHeaderComponent={<ShopHeader shop={shop} isOwner={false} />}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    renderItem={({ item }) => {
                        const firstImage = item?.images?.[0]?.imageUrl || '';
                        const resolvedImage = resolveImageUrl(firstImage, { debugLabel: 'public-shop-post-image' });

                        return (
                            <Card onClick={() => navigation.navigate('PostDetail', { slug: item.postSlug })} style={styles.postCard}>
                                <View style={styles.postRow}>
                                    {resolvedImage ? (
                                        <Image
                                            source={{ uri: resolvedImage }}
                                            style={styles.postImage}
                                            onError={(error) => logMediaResolveError('public-shop-post-image', firstImage, error?.nativeEvent)}
                                        />
                                    ) : (
                                        <View style={styles.postImagePlaceholder} />
                                    )}
                                    <View style={styles.postInfo}>
                                        <Text style={styles.postTitle} numberOfLines={2}>{item.postTitle}</Text>
                                        <Text style={styles.postPrice}>
                                            {new Intl.NumberFormat('vi-VN').format(Number(item.postPrice || 0))}đ
                                        </Text>
                                        <Text style={styles.postMeta}>{item.postLocation || 'Chưa cập nhật vị trí'}</Text>
                                    </View>
                                </View>
                            </Card>
                        )
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyList}>
                            <Text style={styles.emptyText}>Cửa hàng này chưa có tin đăng nào được duyệt.</Text>
                        </View>
                    }
                />
            )}
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    postCard: {
        marginHorizontal: 20,
        marginBottom: 12,
        padding: 14,
    },
    postRow: {
        flexDirection: 'row',
        gap: 12,
    },
    postImage: {
        width: 84,
        height: 84,
        borderRadius: 12,
        backgroundColor: '#E2E8F0',
    },
    postImagePlaceholder: {
        width: 84,
        height: 84,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
    },
    postInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    postTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 6,
    },
    postPrice: {
        fontSize: 14,
        fontWeight: '800',
        color: '#10b981',
        marginBottom: 4,
    },
    postMeta: {
        fontSize: 12,
        color: '#64748b',
    },
    empty: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 90,
    },
    emptyList: {
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: 24,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
    },
    emptyText: {
        textAlign: 'center',
        color: '#64748b',
        lineHeight: 20,
    },
})

export default PublicShopDetailScreen
