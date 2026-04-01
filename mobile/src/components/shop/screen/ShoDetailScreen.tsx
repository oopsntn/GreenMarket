import React from 'react'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import { useNavigation } from '@react-navigation/native'
import { useShopDetail } from '../service/useShopDetail'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Settings2, Plus } from 'lucide-react-native' // Thêm icon Plus
import ShopHeader from '../components/ShopHeader'
import PostItem from '../../post/components/PostItem'
import Button from '../../Reused/Button/Button' // Import Button có sẵn

const ShoDetailScreen = () => {
    const navigation = useNavigation<any>()
    const { shop, loading, actions } = useShopDetail()

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Profile');
        }
    };

    return (
        <MobileLayout title="Chi tiết nhà vườn"
            backButton={handleBack}
            rightAction={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                    {/* Nút thêm bài đăng nhanh trên Header */}
                    <TouchableOpacity onPress={() => navigation.navigate('CreatePost')}>
                        <Plus color="#10b981" size={24} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('EditShop', { shop })}>
                        <Settings2 color="#10b981" size={24} />
                    </TouchableOpacity>
                </View>
            }
        >
            <FlatList
                data={shop?.posts || []}
                keyExtractor={(item) => item.postId.toString()}
                onRefresh={actions.refresh}
                refreshing={loading}
                ListHeaderComponent={
                    <View>
                        {shop ? <ShopHeader shop={shop} isOwner={true} styles={styles} /> : null}

                        {/* Nút Đăng bài nổi bật dưới Header */}
                        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                            <Button
                                variant="outline"
                                icon={<Plus size={18} color="#10b981" />}
                                onPress={() => navigation.navigate('CreatePost')}
                                style={{ borderColor: '#10b981', borderWidth: 1 }}
                                textStyle={{ color: '#10b981' }}
                            >
                                Đăng sản phẩm mới
                            </Button>
                        </View>

                        <View style={{ paddingHorizontal: 20 }}>
                            <Text style={styles.sectionTitle}>Danh sách bài đăng</Text>
                        </View>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={{ paddingHorizontal: 20 }}>
                        <PostItem
                            item={item}
                            onEdit={() => navigation.navigate('EditPost', { post: item })}
                            onDelete={() => { }}
                            styles={styles}
                        />
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            Vườn của bạn chưa có bài đăng nào.
                        </Text>
                        <Button
                            onPress={() => navigation.navigate('CreatePost')}
                            style={{ marginTop: 15, backgroundColor: '#10b981' }}
                        >
                            Tạo bài đăng đầu tiên
                        </Button>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 100 }} // Cách ra để không bị đè
            />

            {/* Floating Action Button (Nút nổi góc phải dưới) */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreatePost')}
            >
                <Plus color="#fff" size={28} />
            </TouchableOpacity>
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    // ... giữ nguyên các styles cũ của bạn ...
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
    // ... các style khác ...
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    emptyContainer: { alignItems: 'center', marginTop: 40, paddingHorizontal: 40 },
    emptyText: { textAlign: 'center', color: '#999' },

    // Thêm style cho nút nổi (FAB)
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 30,
        backgroundColor: '#10b981',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
    // Giữ lại style của PostItem
    postCard: { backgroundColor: '#fff', marginBottom: 12, borderRadius: 16, padding: 12, flexDirection: 'row' },
    info: { flex: 1, marginLeft: 12 },
    postTitle: { fontWeight: 'bold', fontSize: 15 },
    postPrice: { color: '#10b981', fontWeight: 'bold', marginTop: 4 },
});

export default ShoDetailScreen;