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
    Bell,
    MailOpen
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CollaboratorService, CollaboratorProfileResponse } from '../services/collaboratorService';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import CustomAlert from '@/utils/AlertHelper';

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
    const navigation = useNavigation<any>();
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<CollaboratorProfileResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setError(null);
            const res = await CollaboratorService.getProfile();
            setData(res);
        } catch (error: any) {
            console.error('Error fetching collaborator profile:', error);
            setError(error?.response?.data?.error || 'Unable to load collaborator dashboard.');
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
        } catch (error: any) {
            console.error('Error updating availability:', error);
            setError(error?.response?.data?.error || 'Unable to update availability right now.');
        }
    };
    const handleLogout = () => {
        CustomAlert(
            'Đăng xuất',
            'Bạn có chắc muốn đăng xuất không?',
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Đăng xuất', style: 'destructive', onPress: logout }
            ]
        );
    };
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#16A34A" />
            </View>
        );
    }

    if (error && !data) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
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
                            <Text style={styles.welcomeText}>Xin chào,</Text>
                            <Text style={styles.nameText}>{profile.displayName || 'Cộng tác viên'}</Text>
                        </View>
                        <TouchableOpacity style={styles.notificationBtn}>
                            <Bell color="white" size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* Balance Card */}
                    <View style={styles.balanceCard}>
                        <View>
                            <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
                            <Text style={styles.balanceValue}>
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.availableBalance)}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.withdrawBtn}
                            onPress={() => navigation.navigate('PayoutRequest', { balance: stats.availableBalance })}
                        >
                            <Text style={styles.withdrawBtnText}>Rút tiền</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {error ? (
                        <View style={styles.inlineError}>
                            <Text style={styles.inlineErrorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Availability Section */}
                    <View style={styles.section}>
                        <View style={styles.availabilityBox}>
                            <View style={styles.availabilityInfo}>
                                <Text style={styles.sectionTitle}>Trạng thái làm việc</Text>
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
                                    {profile.availabilityStatus === 'available' ? 'Đặt bận' : 'Sẵn sàng'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        <StatsCard
                            title="Đang làm"
                            value={stats.activeJobs}
                            icon={Briefcase}
                            color="#3B82F6"
                        />
                        <StatsCard
                            title="Đã xong"
                            value={stats.completedJobs}
                            icon={CheckCircle2}
                            color="#10B981"
                        />
                    </View>

                    {/* Quick Access */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Truy cập nhanh</Text>
                        <View style={styles.menuList}>
                            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Explore')}>
                                <View style={styles.menuIconWrap}>
                                    <LayoutDashboard color="#16A34A" size={20} />
                                </View>
                                <View style={styles.menuContent}>
                                    <Text style={styles.menuTitle}>Tìm việc mới</Text>
                                    <Text style={styles.menuDesc}>Khám phá các yêu cầu chưa có người nhận</Text>
                                </View>
                                <ChevronRight color="#94A3B8" size={20} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Invitations')}>
                                <View style={[styles.menuIconWrap, { backgroundColor: '#FEF3C7' }]}>
                                    <MailOpen color="#D97706" size={20} />
                                </View>
                                <View style={styles.menuContent}>
                                    <Text style={styles.menuTitle}>Lời mời hợp tác</Text>
                                    <Text style={styles.menuDesc}>Xem và phản hồi lời mời từ các Chủ vườn</Text>
                                </View>
                                <ChevronRight color="#94A3B8" size={20} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Wallet', { initialTab: 'payouts' })}>
                                <View style={[styles.menuIconWrap, { backgroundColor: '#EFF6FF' }]}>
                                    <Wallet color="#3B82F6" size={20} />
                                </View>
                                <View style={styles.menuContent}>
                                    <Text style={styles.menuTitle}>Lịch sử rút tiền</Text>
                                    <Text style={styles.menuDesc}>Xem lịch sử giao dịch của bạn</Text>
                                </View>
                                <ChevronRight color="#94A3B8" size={20} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                                <View style={[styles.menuIconWrap, { backgroundColor: '#FEF2F2' }]}>
                                    <Settings color="#EF4444" size={20} />
                                </View>
                                <View style={styles.menuContent}>
                                    <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Đăng xuất</Text>
                                    <Text style={styles.menuDesc}>Thoát khỏi tài khoản hiện tại</Text>
                                </View>
                                <ChevronRight color="#CBD5E1" size={20} />
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
    },
    errorText: {
        fontSize: 14,
        color: '#B91C1C',
        textAlign: 'center',
        marginBottom: 16,
        paddingHorizontal: 24,
    },
    retryBtn: {
        backgroundColor: '#111827',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryBtnText: {
        color: 'white',
        fontWeight: '700',
    },
    inlineError: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 16,
    },
    inlineErrorText: {
        color: '#B91C1C',
        fontSize: 13,
        fontWeight: '600',
    },
});

export default DashboardScreen;
