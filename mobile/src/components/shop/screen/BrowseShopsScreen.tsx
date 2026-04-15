import React, { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { ChevronRight, Store } from 'lucide-react-native'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import Card from '../../Reused/Card/Card'
import { ShopService } from '../service/shopService'

const BrowseShopsScreen = () => {
    const navigation = useNavigation<any>()
    const [shops, setShops] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchShops = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            const res = await ShopService.getAllShops({ page: 1, limit: 50 })
            setShops(Array.isArray(res?.data) ? res.data : [])
        } catch (error) {
            console.error('Error fetching shops:', error)
            setShops([])
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchShops()
    }, [])

    return (
        <MobileLayout scrollEnabled={false} title="Explore Shops" backButton={() => navigation.goBack()}>
            {loading ? (
                <ActivityIndicator style={{ marginTop: 80 }} color="#10b981" />
            ) : (
                <FlatList
                    data={shops}
                    keyExtractor={(item) => item.shopId.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshing={refreshing}
                    onRefresh={() => fetchShops(true)}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => navigation.navigate('PublicShopDetail', { shopId: item.shopId })}>
                            <Card style={styles.card}>
                                <View style={styles.cardRow}>
                                    <View style={styles.logoWrap}>
                                        {item.shopLogoUrl ? (
                                            <Image source={{ uri: item.shopLogoUrl }} style={styles.logo} />
                                        ) : (
                                            <Store color="#10b981" size={28} />
                                        )}
                                    </View>

                                    <View style={styles.info}>
                                        <Text style={styles.shopName}>{item.shopName}</Text>
                                        <Text style={styles.shopLocation} numberOfLines={1}>
                                            {item.shopLocation || 'Address not updated'}
                                        </Text>
                                        <Text style={styles.shopDescription} numberOfLines={2}>
                                            {item.shopDescription || 'This shop does not have a description yet.'}
                                        </Text>
                                    </View>

                                    <ChevronRight color="#94a3b8" size={18} />
                                </View>

                                <View style={styles.metaRow}>
                                    <Text style={styles.postCountText}>{item.posts?.length || 0} products</Text>
                                </View>
                            </Card>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyTitle}>No active shops yet</Text>
                            <Text style={styles.emptyText}>Approved and activated shops will appear here.</Text>
                        </View>
                    }
                />
            )}
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    listContent: {
        padding: 16,
        paddingBottom: 100,
        gap: 12,
    },
    card: {
        padding: 14,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoWrap: {
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundColor: '#f0fdf4',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    info: {
        flex: 1,
        marginHorizontal: 12,
    },
    shopName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 4,
    },
    shopLocation: {
        fontSize: 12,
        color: '#10b981',
        marginBottom: 4,
    },
    shopDescription: {
        fontSize: 12,
        lineHeight: 18,
        color: '#64748b',
    },
    empty: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 90,
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
    postCountText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    metaRow: {
        marginTop: 10,
        alignItems: 'flex-end',
    },
})

export default BrowseShopsScreen
