import React, { useCallback, useState } from 'react';
import {
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Building2, ChevronRight, PenSquare } from 'lucide-react-native';
import { CollaboratorActiveShop, CollaboratorService } from '../services/collaboratorService';
import { resolveImageUrl } from '../../utils/resolveImageUrl';

const MyActiveShopsScreen = () => {
    const navigation = useNavigation<any>();
    const [shops, setShops] = useState<CollaboratorActiveShop[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchShops = async () => {
        try {
            setError(null);
            const res = await CollaboratorService.getMyActiveShops();
            setShops(Array.isArray(res?.data) ? res.data : []);
        } catch (e: any) {
            console.error('[MyActiveShops] getMyActiveShops failed:', e);
            setError(
                e?.response?.data?.error ||
                'Không thể tải danh sách shop đang cộng tác.',
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchShops();
        }, []),
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchShops();
    };

    const goShopDetail = (shop: CollaboratorActiveShop) => {
        navigation.navigate('PublicShopDetail', { shopId: shop.shopId });
    };

    const goCreatePost = (shop: CollaboratorActiveShop) => {
        navigation.navigate('CreateDelegatedPost', {
            shopId: shop.shopId,
            shopName: shop.shopName,
            shopLocation: shop.shopLocation
        });
    };

    const renderItem = ({ item }: { item: CollaboratorActiveShop }) => (
        <View style={styles.card}>
            <TouchableOpacity style={styles.cardMain} onPress={() => goShopDetail(item)} activeOpacity={0.85}>
                <View style={styles.cardLeft}>
                    {item.shopLogoUrl ? (
                        <Image
                            source={{ uri: resolveImageUrl(item.shopLogoUrl, { debugLabel: 'collaborator-active-shop-logo' }) }}
                            style={styles.logo}
                        />
                    ) : (
                        <View style={styles.logoFallback}>
                            <Building2 size={22} color="#64748B" />
                        </View>
                    )}
                    <View style={styles.info}>
                        <Text style={styles.shopName} numberOfLines={1}>
                            {item.shopName || `Shop #${item.shopId}`}
                        </Text>
                        <Text style={styles.meta} numberOfLines={1}>
                            Chủ shop: {item.ownerDisplayName || 'Chưa rõ'}
                        </Text>
                        {item.shopLocation ? (
                            <Text style={styles.meta} numberOfLines={1}>
                                {item.shopLocation}
                            </Text>
                        ) : null}
                    </View>
                </View>
                <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.cardActions}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => goShopDetail(item)}>
                    <Text style={styles.secondaryBtnText}>Xem shop</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => goCreatePost(item)}>
                    <PenSquare size={16} color="#fff" />
                    <Text style={styles.primaryBtnText}>Đăng bài cho shop</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Shop đang cộng tác</Text>
                <Text style={styles.subtitle}>
                    Chọn shop để xem thông tin, liên hệ Zalo hoặc đăng bài thay mặt chủ shop.
                </Text>
            </View>

            <FlatList
                data={shops}
                keyExtractor={(item) => item.shopId.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyTitle}>{loading ? 'Đang tải...' : error || 'Bạn chưa có shop nào đang active.'}</Text>
                        <Text style={styles.emptyDesc}>
                            Vào “Lời mời hợp tác” để chấp nhận lời mời từ chủ shop.
                        </Text>
                        <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('Invitations')}>
                            <Text style={styles.linkText}>Mở lời mời hợp tác</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: 16 },
    header: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    title: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
    subtitle: { fontSize: 13, color: '#64748B', lineHeight: 18 },
    listContent: { padding: 16, paddingBottom: 30, flexGrow: 1 },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
        marginBottom: 12,
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
    logo: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#E2E8F0', marginRight: 12 },
    logoFallback: {
        width: 52,
        height: 52,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: { flex: 1 },
    shopName: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 3 },
    meta: { fontSize: 12, color: '#64748B' },
    cardActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },
    secondaryBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#16A34A',
        borderRadius: 12,
        paddingVertical: 11,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0FDF4',
    },
    secondaryBtnText: {
        color: '#16A34A',
        fontSize: 13,
        fontWeight: '700',
    },
    primaryBtn: {
        flex: 1.4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 12,
        paddingVertical: 11,
        backgroundColor: '#111827',
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    empty: { marginTop: 90, paddingHorizontal: 20, alignItems: 'center' },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', textAlign: 'center', marginBottom: 6 },
    emptyDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18 },
    linkBtn: { marginTop: 14, backgroundColor: '#111827', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
    linkText: { color: 'white', fontWeight: '800' },
});

export default MyActiveShopsScreen;
