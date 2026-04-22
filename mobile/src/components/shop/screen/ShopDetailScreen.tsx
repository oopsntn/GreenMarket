import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { BarChart3, Plus, Settings2 } from 'lucide-react-native'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import ShopHeader from '../components/ShopHeader'
import PostItem from '../../post/components/PostItem'
import Button from '../../Reused/Button/Button'
import { useShopDetail } from '../service/useShopDetail'

const ShoDetailScreen = () => {
    const navigation = useNavigation<any>()
    const { shop, loading, actions } = useShopDetail()

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack()
            return
        }

        navigation.navigate('MainTabs', { screen: 'HomeStack' })
    }

    if (loading && !shop) {
        return (
            <MobileLayout title="Cửa hàng của tôi" backButton={handleBack}>
                <ActivityIndicator style={{ marginTop: 80 }} color="#10b981" />
            </MobileLayout>
        )
    }

    return (
        <MobileLayout
            title="Cửa hàng của tôi"
            backButton={handleBack}
            scrollEnabled={false}
            rightAction={
                shop && shop.shopStatus !== 'blocked' ? (
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => navigation.navigate('ShopDashboard')}>
                            <BarChart3 color="#10b981" size={24} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('CreatePost')}>
                            <Plus color="#10b981" size={24} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('EditShop', { shop })}>
                            <Settings2 color="#10b981" size={24} />
                        </TouchableOpacity>
                    </View>
                ) : null
            }
        >
            {!shop ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>Bạn chưa có cửa hàng nào</Text>
                    <Text style={styles.emptyText}>Đăng ký thông tin cửa hàng để bắt đầu bán hàng trên GreenMarket.</Text>
                    <Button onPress={() => navigation.navigate('RegisterShop')} style={styles.primaryButton}>
                        Mở cửa hàng ngay
                    </Button>
                </View>
            ) : (
                <FlatList
                    data={shop.posts || []}
                    keyExtractor={(item) => item.postId.toString()}
                    onRefresh={actions.refresh}
                    refreshing={loading}
                    ListHeaderComponent={
                        <View>
                            <ShopHeader shop={shop} isOwner={true} />

                            <View style={styles.headerButtons}>
                                <Button
                                    variant="outline"
                                    onPress={() => navigation.navigate('ShopDashboard')}
                                    style={styles.outlineButton}
                                    textStyle={{ color: '#10b981' }}
                                >
                                    Xem thống kê
                                </Button>
                                <Button
                                    testID="my-shop-create-post-button"
                                    variant="outline"
                                    onPress={() => navigation.navigate('CreatePost')}
                                    style={styles.outlineButton}
                                    textStyle={{ color: '#10b981' }}
                                >
                                    Đăng tin mới
                                </Button>
                                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                                    <Button
                                        testID="my-shop-manage-posts-button"
                                        onPress={() => navigation.navigate('MyPost')}
                                        style={[styles.primaryButton, { flex: 1 }]}
                                    >
                                        Quản lý tin đăng
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onPress={() => navigation.navigate('ShopCollaborators')}
                                        style={[styles.outlineButton, { flex: 1, backgroundColor: '#ECFDF5' }]}
                                        textStyle={{ color: '#10b981' }}
                                    >
                                        Quản lý CTV
                                    </Button>
                                </View>
                            </View>

                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Các tin đang hoạt động</Text>
                            </View>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.postWrapper}>
                            <PostItem
                                item={item}
                                onEdit={() => navigation.navigate('MyPost')}
                                onDelete={() => navigation.navigate('MyPost')}
                                styles={styles}
                            />
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyList}>
                            <Text style={styles.emptyText}>Cửa hàng của bạn chưa có tin đăng nào được duyệt.</Text>
                            <Button onPress={() => navigation.navigate('CreatePost')} style={styles.primaryButton}>
                                Tạo tin đăng đầu tiên của bạn
                            </Button>
                        </View>
                    }
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            )}
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    headerButtons: {
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 20,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingTop: 80,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
    },
    emptyText: {
        textAlign: 'center',
        color: '#64748b',
        lineHeight: 20,
        marginBottom: 18,
    },
    emptyList: {
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: 30,
    },
    primaryButton: {
        backgroundColor: '#10b981',
    },
    outlineButton: {
        borderColor: '#10b981',
    },
    postWrapper: {
        paddingHorizontal: 20,
    },
    postCard: {
        marginBottom: 12,
        padding: 12,
    },
    postContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    imgPlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
        marginLeft: 12,
    },
    postTitle: {
        fontWeight: '700',
        fontSize: 14,
        marginBottom: 4,
    },
    postPrice: {
        color: '#10b981',
        fontWeight: '800',
        fontSize: 13,
        marginBottom: 6,
    },
    actions: {
        flexDirection: 'row',
    },
    actionBtn: {
        padding: 8,
        marginLeft: 4,
    },
})

export default ShoDetailScreen
