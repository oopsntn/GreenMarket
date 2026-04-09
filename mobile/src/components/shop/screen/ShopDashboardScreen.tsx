import React, { useCallback, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { ArrowRight, BadgeDollarSign, BarChart3, Eye, FileText, MessageCircle, Rocket, Store, Wallet } from 'lucide-react-native'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import Card from '../../Reused/Card/Card'
import Button from '../../Reused/Button/Button'
import CustomAlert from '../../../utils/AlertHelper'
import { ShopDashboardPayment, ShopDashboardResponse, ShopDashboardTopPost, ShopService } from '../service/shopService'

const ShopDashboardScreen = () => {
    const navigation = useNavigation<any>()
    const [dashboard, setDashboard] = useState<ShopDashboardResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchDashboard = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            const response = await ShopService.getDashboard()
            setDashboard(response || null)
        } catch (error: any) {
            console.error('Error fetching shop dashboard:', error)
            CustomAlert('Error', error?.response?.data?.error || 'Unable to load shop dashboard.')
            setDashboard(null)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchDashboard()
        }, [])
    )

    const summary = dashboard?.summary || {}
    const topPosts = Array.isArray(dashboard?.topPosts) ? dashboard?.topPosts : []
    const recentPayments = Array.isArray(dashboard?.recentPayments) ? dashboard?.recentPayments : []
    const shop = dashboard?.shop

    const statCards = [
        { label: 'Total Posts', value: summary.totalPosts ?? 0, icon: <FileText size={18} color="#047857" /> },
        { label: 'Approved', value: summary.approvedPosts ?? 0, icon: <Store size={18} color="#047857" /> },
        { label: 'Views', value: summary.totalViews ?? 0, icon: <Eye size={18} color="#2563eb" /> },
        { label: 'Contacts', value: summary.totalContacts ?? 0, icon: <MessageCircle size={18} color="#7c3aed" /> },
        { label: 'Active Promotions', value: summary.activePromotions ?? 0, icon: <Rocket size={18} color="#ea580c" /> },
        { label: 'Promotion Spend', value: `${new Intl.NumberFormat('en-US').format(Number(summary.totalPromotionSpend ?? 0))} VND`, icon: <Wallet size={18} color="#b91c1c" /> },
    ]

    const formatDateTime = (value?: string) => {
        if (!value) return 'N/A'
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return 'N/A'
        return date.toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const renderTopPost = (item: ShopDashboardTopPost) => (
        <TouchableOpacity
            key={item.postId}
            style={styles.listItem}
            onPress={() => {
                if (item.postSlug) {
                    navigation.navigate('PostDetail', { slug: item.postSlug })
                    return
                }

                navigation.navigate('MyPost')
            }}
        >
            <View style={styles.listBody}>
                <Text style={styles.listTitle} numberOfLines={1}>
                    {item.postTitle || `Post #${item.postId}`}
                </Text>
                <Text style={styles.listMeta}>
                    {item.postStatus || 'unknown'} • {item.postViewCount ?? 0} views • {item.postContactCount ?? 0} contacts
                </Text>
                <Text style={styles.listMeta}>
                    Updated: {formatDateTime(item.postUpdatedAt)}
                </Text>
            </View>

            <View style={styles.listAside}>
                {item.isPromoted ? (
                    <View style={styles.promotedBadge}>
                        <Text style={styles.promotedText}>Promoted</Text>
                    </View>
                ) : null}
                <ArrowRight size={16} color="#94a3b8" />
            </View>
        </TouchableOpacity>
    )

    const renderPayment = (item: ShopDashboardPayment, index: number) => (
        <View key={`${item.paymentId || item.orderId || index}`} style={styles.paymentRow}>
            <View style={{ flex: 1 }}>
                <Text style={styles.listTitle} numberOfLines={1}>
                    {item.promotionPackageTitle || item.packageTitle || 'Promotion Package'}
                </Text>
                <Text style={styles.listMeta} numberOfLines={1}>
                    {item.postTitle || 'No linked post'}
                </Text>
                <Text style={styles.listMeta}>
                    {formatDateTime(item.createdAt || item.updatedAt)}
                </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.amountText}>
                    {new Intl.NumberFormat('en-US').format(Number(item.amount || 0))} VND
                </Text>
                <Text style={styles.paymentStatus}>{item.paymentStatus || 'Pending'}</Text>
            </View>
        </View>
    )

    if (loading && !dashboard) {
        return (
            <MobileLayout title="Shop Dashboard" backButton={() => navigation.goBack()}>
                <ActivityIndicator style={{ marginTop: 80 }} color="#10b981" />
            </MobileLayout>
        )
    }

    return (
        <MobileLayout title="Shop Dashboard" backButton={() => navigation.goBack()}>
            <ScrollView
                contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchDashboard(true)} />}
            >
                {!dashboard ? (
                    <Card style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Dashboard unavailable</Text>
                        <Text style={styles.emptyText}>
                            Your shop dashboard is not ready yet. Please make sure your shop is active and try again.
                        </Text>
                    </Card>
                ) : (
                    <>
                        <Card style={styles.heroCard}>
                            <View style={styles.heroRow}>
                                <View style={styles.heroIcon}>
                                    <BarChart3 size={22} color="#047857" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.heroTitle}>{shop?.shopName || 'My Shop'}</Text>
                                    <Text style={styles.heroSubtitle}>
                                        Status: {shop?.shopStatus || 'unknown'} • Contact rate: {summary.contactRate ?? 0}%
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.heroActions}>
                                <Button
                                    variant="outline"
                                    style={styles.heroButton}
                                    textStyle={{ color: '#10b981' }}
                                    onPress={() => navigation.navigate('MyPost')}
                                >
                                    Manage Posts
                                </Button>
                                <Button
                                    style={styles.heroButton}
                                    onPress={() => navigation.navigate('CreatePost')}
                                >
                                    Create Post
                                </Button>
                            </View>
                        </Card>

                        <View style={styles.statsGrid}>
                            {statCards.map((item) => (
                                <Card key={item.label} style={styles.statCard}>
                                    <View style={styles.statIcon}>{item.icon}</View>
                                    <Text style={styles.statValue}>{item.value}</Text>
                                    <Text style={styles.statLabel}>{item.label}</Text>
                                </Card>
                            ))}
                        </View>

                        <Card style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Post Moderation Snapshot</Text>
                            </View>
                            <View style={styles.snapshotRow}>
                                <View style={styles.snapshotItem}>
                                    <Text style={styles.snapshotValue}>{summary.pendingPosts ?? 0}</Text>
                                    <Text style={styles.snapshotLabel}>Pending</Text>
                                </View>
                                <View style={styles.snapshotItem}>
                                    <Text style={styles.snapshotValue}>{summary.rejectedPosts ?? 0}</Text>
                                    <Text style={styles.snapshotLabel}>Rejected</Text>
                                </View>
                                <View style={styles.snapshotItem}>
                                    <Text style={styles.snapshotValue}>{summary.successfulPayments ?? 0}</Text>
                                    <Text style={styles.snapshotLabel}>Paid Orders</Text>
                                </View>
                            </View>
                        </Card>

                        <Card style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Top Posts</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('MyPost')}>
                                    <Text style={styles.sectionLink}>See all</Text>
                                </TouchableOpacity>
                            </View>
                            {topPosts.length === 0 ? (
                                <Text style={styles.emptyInline}>No post analytics yet.</Text>
                            ) : (
                                topPosts.map(renderTopPost)
                            )}
                        </Card>

                        <Card style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Recent Payments</Text>
                                <BadgeDollarSign size={18} color="#10b981" />
                            </View>
                            {recentPayments.length === 0 ? (
                                <Text style={styles.emptyInline}>No payment records yet.</Text>
                            ) : (
                                recentPayments.map(renderPayment)
                            )}
                        </Card>
                    </>
                )}
            </ScrollView>
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 32,
        gap: 16,
    },
    heroCard: {
        padding: 18,
        backgroundColor: '#ecfdf5',
        borderWidth: 1,
        borderColor: '#d1fae5',
    },
    heroRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    heroIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: '#d1fae5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#065f46',
    },
    heroSubtitle: {
        marginTop: 4,
        fontSize: 12,
        color: '#047857',
    },
    heroActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    heroButton: {
        flex: 1,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        width: '48%',
        padding: 16,
    },
    statIcon: {
        marginBottom: 10,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
    },
    sectionCard: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
    },
    sectionLink: {
        fontSize: 12,
        color: '#10b981',
        fontWeight: '700',
    },
    snapshotRow: {
        flexDirection: 'row',
        gap: 12,
    },
    snapshotItem: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
    },
    snapshotValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    snapshotLabel: {
        marginTop: 4,
        fontSize: 12,
        color: '#64748b',
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    listBody: {
        flex: 1,
        paddingRight: 12,
    },
    listAside: {
        alignItems: 'flex-end',
        gap: 8,
    },
    listTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    listMeta: {
        fontSize: 12,
        color: '#64748b',
        lineHeight: 18,
    },
    promotedBadge: {
        backgroundColor: '#fff7ed',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    promotedText: {
        color: '#ea580c',
        fontSize: 11,
        fontWeight: '700',
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    amountText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#10b981',
        marginBottom: 4,
    },
    paymentStatus: {
        fontSize: 11,
        color: '#64748b',
        textTransform: 'capitalize',
    },
    emptyCard: {
        padding: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
    },
    emptyText: {
        color: '#64748b',
        lineHeight: 20,
    },
    emptyInline: {
        color: '#64748b',
        lineHeight: 20,
    },
})

export default ShopDashboardScreen
