import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    FlatList,
} from 'react-native';
import { 
    Wallet, 
    ArrowUpRight, 
    ArrowDownLeft, 
    ChevronRight,
    TrendingUp,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle
} from 'lucide-react-native';
import { CollaboratorService, EarningEntry, PayoutRequest } from '../services/collaboratorService';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const StatusBadge = ({ status }: { status: string }) => {
    let color = '#94A3B8';
    let bgColor = '#F1F5F9';
    let Icon = Clock;

    if (status === 'approved' || status === 'completed') {
        color = '#10B981';
        bgColor = '#ECFDF5';
        Icon = CheckCircle2;
    } else if (status === 'rejected' || status === 'cancelled') {
        color = '#EF4444';
        bgColor = '#FEF2F2';
        Icon = XCircle;
    } else if (status === 'pending') {
        color = '#F59E0B';
        bgColor = '#FFFBEB';
        Icon = AlertCircle;
    }

    return (
        <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
            <Icon color={color} size={12} />
            <Text style={[styles.statusText, { color }]}>{status.toUpperCase()}</Text>
        </View>
    );
};

const EarningsScreen = () => {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'earnings' | 'payouts'>('earnings');
    
    const [earnings, setEarnings] = useState<EarningEntry[]>([]);
    const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
    const [stats, setStats] = useState({ availableBalance: 0, totalEarnings: 0 });

    const fetchData = async () => {
        try {
            const [profileRes, earningsRes, payoutsRes] = await Promise.all([
                CollaboratorService.getProfile(),
                CollaboratorService.getEarnings(),
                CollaboratorService.getPayoutRequests(),
            ]);
            
            setStats(profileRes.stats);
            setEarnings(earningsRes.data || []);
            setPayouts(payoutsRes.data || []);
        } catch (error) {
            console.error('Error fetching earnings data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(Number(amount));
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#16A34A" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Balance Card Section */}
                <LinearGradient colors={['#111827', '#1F2937']} style={styles.balanceHeader}>
                    <View style={styles.balanceInfo}>
                        <Text style={styles.balanceTitle}>Available Balance</Text>
                        <Text style={styles.balanceAmount}>{formatCurrency(stats.availableBalance)}</Text>
                        <View style={styles.totalEarningsRow}>
                            <TrendingUp color="#10B981" size={16} />
                            <Text style={styles.totalEarningsText}>
                                Total Life Earnings: {formatCurrency(stats.totalEarnings)}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={styles.payoutBtn}
                        onPress={() => navigation.navigate('PayoutRequest', { balance: stats.availableBalance })}
                    >
                        <ArrowUpRight color="black" size={20} />
                        <Text style={styles.payoutBtnText}>Withdraw</Text>
                    </TouchableOpacity>
                </LinearGradient>

                <View style={styles.content}>
                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity 
                            style={[styles.tab, activeTab === 'earnings' && styles.activeTab]}
                            onPress={() => setActiveTab('earnings')}
                        >
                            <Text style={[styles.tabText, activeTab === 'earnings' && styles.activeTabText]}>Earnings</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.tab, activeTab === 'payouts' && styles.activeTab]}
                            onPress={() => setActiveTab('payouts')}
                        >
                            <Text style={[styles.tabText, activeTab === 'payouts' && styles.activeTabText]}>Payouts</Text>
                        </TouchableOpacity>
                    </View>

                    {/* History List */}
                    {activeTab === 'earnings' ? (
                        <View style={styles.listContainer}>
                            {earnings.length === 0 ? (
                                <Text style={styles.emptyText}>No earnings yet.</Text>
                            ) : (
                                earnings.map((item) => (
                                    <View key={item.earningEntryId} style={styles.historyItem}>
                                        <View style={styles.historyIconWrap}>
                                            <ArrowDownLeft color="#10B981" size={20} />
                                        </View>
                                        <View style={styles.historyInfo}>
                                            <Text style={styles.historyTitle}>{item.earningEntryType}</Text>
                                            <Text style={styles.historyDate}>{new Date(item.earningEntryCreatedAt).toLocaleDateString()}</Text>
                                        </View>
                                        <Text style={styles.earningsAmount}>+{formatCurrency(item.earningEntryAmount)}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    ) : (
                        <View style={styles.listContainer}>
                            {payouts.length === 0 ? (
                                <Text style={styles.emptyText}>No payout requests yet.</Text>
                            ) : (
                                payouts.map((item) => (
                                    <View key={item.payoutRequestId} style={styles.historyItem}>
                                        <View style={[styles.historyIconWrap, { backgroundColor: '#FEF2F2' }]}>
                                            <ArrowUpRight color="#EF4444" size={20} />
                                        </View>
                                        <View style={styles.historyInfo}>
                                            <Text style={styles.historyTitle}>{item.payoutRequestMethod}</Text>
                                            <StatusBadge status={item.payoutRequestStatus} />
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.payoutAmount}>-{formatCurrency(item.payoutRequestAmount)}</Text>
                                            <Text style={styles.historyDate}>{new Date(item.payoutRequestCreatedAt).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    balanceHeader: {
        margin: 20,
        padding: 24,
        borderRadius: 32,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    balanceInfo: {
        flex: 1,
    },
    balanceTitle: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    balanceAmount: {
        color: 'white',
        fontSize: 26,
        fontWeight: '800',
        marginVertical: 4,
    },
    totalEarningsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
    },
    totalEarningsText: {
        color: '#10B981',
        fontSize: 11,
        fontWeight: '600',
    },
    payoutBtn: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    payoutBtnText: {
        color: 'black',
        fontWeight: '700',
        fontSize: 14,
    },
    content: {
        paddingHorizontal: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 6,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: '#F1F5F9',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#94A3B8',
    },
    activeTabText: {
        color: '#1E293B',
    },
    listContainer: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 1,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    historyIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    historyInfo: {
        flex: 1,
    },
    historyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    historyDate: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    earningsAmount: {
        fontSize: 15,
        fontWeight: '800',
        color: '#10B981',
    },
    payoutAmount: {
        fontSize: 15,
        fontWeight: '800',
        color: '#EF4444',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 9,
        fontWeight: '800',
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: 40,
        color: '#94A3B8',
        fontSize: 14,
    }
});

export default EarningsScreen;
