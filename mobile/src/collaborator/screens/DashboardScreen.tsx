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
    StatusBar,
} from 'react-native';
import {
    LayoutDashboard,
    Briefcase,
    CheckCircle2,
    Wallet,
    Settings,
    ChevronRight,
    Circle,
    Bell
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CollaboratorService, CollaboratorProfileResponse } from '../services/collaboratorService';
import { useAuth } from '../../context/AuthContext';

const StatsCard = ({ title, value, icon: Icon, color }: any) => (
    <View style={styles.statsCard}>
        <View style={[styles.statsIconContainer, { backgroundColor: `${color}15` }]}>
            <Icon color={color} size={20} />
        </View>
        <View style={styles.statsInfo}>
            <Text style={styles.statsValue}>{value}</Text>
            <Text style={styles.statsLabel}>{title}</Text>
        </View>
    </View>
);

const DashboardScreen = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<CollaboratorProfileResponse | null>(null);

    const fetchData = async () => {
        try {
            const res = await CollaboratorService.getProfile();
            setData(res);
        } catch (error) {
            console.error('Error fetching collaborator profile:', error);
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

    const toggleAvailability = async () => {
        if (!data) return;
        const nextStatus = data.profile.availabilityStatus === 'available' ? 'busy' : 'available';
        try {
            await CollaboratorService.updateAvailability({ availabilityStatus: nextStatus });
            fetchData();
        } catch (error) {
            console.error('Error updating availability:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#16A34A" />
            </View>
        );
    }

    const { profile, stats } = data || {
        profile: { availabilityStatus: 'offline', displayName: user?.userDisplayName },
        stats: { totalJobs: 0, activeJobs: 0, completedJobs: 0, totalEarnings: 0, availableBalance: 0 }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <LinearGradient colors={['#064E3B', '#16A34A']} style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.welcomeText}>Hello,</Text>
                            <Text style={styles.nameText}>{profile.displayName || 'Collaborator'}</Text>
                        </View>
                        <TouchableOpacity style={styles.notificationBtn}>
                            <Bell color="white" size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* Balance Card */}
                    <View style={styles.balanceCard}>
                        <View>
                            <Text style={styles.balanceLabel}>Available Balance</Text>
                            <Text style={styles.balanceValue}>
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.availableBalance)}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.withdrawBtn}>
                            <Text style={styles.withdrawBtnText}>Withdraw</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* Availability Section */}
                    <View style={styles.section}>
                        <View style={styles.availabilityBox}>
                            <View style={styles.availabilityInfo}>
                                <Text style={styles.sectionTitle}>Working Status</Text>
                                <View style={styles.statusBadge}>
                                    <Circle
                                        size={10}
                                        fill={profile.availabilityStatus === 'available' ? '#22C55E' : '#EF4444'}
                                        color={profile.availabilityStatus === 'available' ? '#22C55E' : '#EF4444'}
                                    />
                                    <Text style={styles.statusText}>
                                        {profile.availabilityStatus?.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.toggleBtn,
                                    { backgroundColor: profile.availabilityStatus === 'available' ? '#FEE2E2' : '#DCFCE7' }
                                ]}
                                onPress={toggleAvailability}
                            >
                                <Text style={[
                                    styles.toggleText,
                                    { color: profile.availabilityStatus === 'available' ? '#EF4444' : '#16A34A' }
                                ]}>
                                    {profile.availabilityStatus === 'available' ? 'Set Busy' : 'Go Online'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        <StatsCard
                            title="Active Tasks"
                            value={stats.activeJobs}
                            icon={Briefcase}
                            color="#3B82F6"
                        />
                        <StatsCard
                            title="Completed"
                            value={stats.completedJobs}
                            icon={CheckCircle2}
                            color="#10B981"
                        />
                    </View>

                    {/* Quick Access */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quick Access</Text>
                        <View style={styles.menuList}>
                            <TouchableOpacity style={styles.menuItem}>
                                <View style={styles.menuIconWrap}>
                                    <LayoutDashboard color="#16A34A" size={20} />
                                </View>
                                <View style={styles.menuContent}>
                                    <Text style={styles.menuTitle}>Find New Jobs</Text>
                                    <Text style={styles.menuDesc}>Explore available unassigned requests</Text>
                                </View>
                                <ChevronRight color="#94A3B8" size={20} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem}>
                                <View style={[styles.menuIconWrap, { backgroundColor: '#EFF6FF' }]}>
                                    <Wallet color="#3B82F6" size={20} />
                                </View>
                                <View style={styles.menuContent}>
                                    <Text style={styles.menuTitle}>Payout History</Text>
                                    <Text style={styles.menuDesc}>View your transaction records</Text>
                                </View>
                                <ChevronRight color="#94A3B8" size={20} />
                            </TouchableOpacity>
                        </View>
                    </View>
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
    header: {
        paddingTop: 20,
        paddingHorizontal: 24,
        paddingBottom: 80,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    welcomeText: {
        color: '#D1FAE5',
        fontSize: 14,
        fontWeight: '500',
    },
    nameText: {
        color: 'white',
        fontSize: 24,
        fontWeight: '800',
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    balanceCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    balanceLabel: {
        color: '#D1FAE5',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    balanceValue: {
        color: 'white',
        fontSize: 22,
        fontWeight: '800',
        marginTop: 4,
    },
    withdrawBtn: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    withdrawBtnText: {
        color: '#16A34A',
        fontWeight: '700',
        fontSize: 14,
    },
    content: {
        paddingHorizontal: 24,
        marginTop: -50,
    },
    section: {
        marginBottom: 24,
    },
    availabilityBox: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    availabilityInfo: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.5,
    },
    toggleBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    toggleText: {
        fontWeight: '700',
        fontSize: 13,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    statsCard: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statsIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsInfo: {
        flex: 1,
    },
    statsValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    statsLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
    menuList: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 16,
    },
    menuIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    menuDesc: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    }
});

export default DashboardScreen;
