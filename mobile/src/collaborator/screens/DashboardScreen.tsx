import React, { useCallback, useState } from 'react';
import {
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    Bell,
    Building2,
    ChevronRight,
    FileText,
    MailOpen,
    UserCheck,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CollaboratorProfileResponse, CollaboratorService } from '../services/collaboratorService';
import { notificationService } from '../../components/notification/service/notificationService';
import { useAuth } from '../../context/AuthContext';
import CustomAlert from '@/utils/AlertHelper';

const StatCard = ({ title, value, helper }: { title: string; value: number; helper: string }) => (
    <View style={styles.statCard}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statHelper}>{helper}</Text>
    </View>
);

const QuickAction = ({
    title,
    description,
    icon,
    onPress,
}: {
    title: string;
    description: string;
    icon: React.ReactNode;
    onPress: () => void;
}) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.menuIconWrap}>{icon}</View>
        <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>{title}</Text>
            <Text style={styles.menuDesc}>{description}</Text>
        </View>
        <ChevronRight color="#94A3B8" size={20} />
    </TouchableOpacity>
);

const DashboardScreen = () => {
    const navigation = useNavigation<any>();
    const { user, logout } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [profileData, setProfileData] = useState<CollaboratorProfileResponse | null>(null);
    const [invitationCount, setInvitationCount] = useState(0);
    const [activeShopCount, setActiveShopCount] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const loadDashboard = async () => {
        try {
            setError(null);
            const [profileRes, invitationsRes, shopsRes, unreadRes] = await Promise.all([
                CollaboratorService.getProfile(),
                CollaboratorService.getMyInvitations(),
                CollaboratorService.getMyActiveShops(),
                notificationService.getUnreadCount(),
            ]);

            setProfileData(profileRes);
            setInvitationCount(Array.isArray(invitationsRes) ? invitationsRes.length : 0);
            setActiveShopCount(Array.isArray(shopsRes?.data) ? shopsRes.data.length : 0);
            setUnreadCount(unreadRes);
        } catch (error: any) {
            console.error('Error fetching collaborator dashboard:', error);
            setError(error?.response?.data?.error || 'Không thể tải trang cộng tác viên lúc này.');
        } finally {
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadDashboard();
        }, []),
    );

    const handleRefresh = () => {
        setRefreshing(true);
        loadDashboard();
    };

    const handleLogout = () => {
        CustomAlert('Đăng xuất', 'Bạn có chắc muốn đăng xuất không?', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Đăng xuất', style: 'destructive', onPress: logout },
        ]);
    };

    const displayName = profileData?.profile?.displayName || user?.userDisplayName || 'Cộng tác viên';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <LinearGradient colors={['#064E3B', '#16A34A']} style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.welcomeText}>Xin chào,</Text>
                            <Text style={styles.nameText}>{displayName}</Text>
                            <Text style={styles.subtitleText}>
                                Quản lý lời mời từ chủ shop, theo dõi shop đang hợp tác và đăng bài thay mặt shop
                                đã liên kết.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.notificationBtn}
                            onPress={() => navigation.navigate('Notifications')}
                        >
                            <Bell color="white" size={22} />
                            {unreadCount > 0 ? (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                </View>
                            ) : null}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.profileCard}>
                        <Text style={styles.profileLabel}>VAI TRÒ CỘNG TÁC VIÊN</Text>
                        <Text style={styles.profileStatus}>Sẵn sàng nhận việc từ shop đã kết nối</Text>
                        <Text style={styles.profileText}>
                            Mobile không còn dùng trạng thái “tạm bận” hay “sẵn sàng hợp tác” vì nó không ảnh hưởng
                            đến lời mời, quyền đăng bài hay khả năng liên hệ.
                        </Text>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {error ? (
                        <View style={styles.inlineError}>
                            <Text style={styles.inlineErrorText}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={styles.statsRow}>
                        <StatCard title="Lời mời" value={invitationCount} helper="Đang chờ phản hồi" />
                        <StatCard title="Shop đang hợp tác" value={activeShopCount} helper="Có thể đăng bài thay mặt" />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Truy cập nhanh</Text>
                        <View style={styles.menuList}>
                            <QuickAction
                                title="Lời mời hợp tác"
                                description="Xem và chấp nhận hoặc từ chối lời mời từ chủ shop"
                                icon={<MailOpen color="#16A34A" size={20} />}
                                onPress={() => navigation.navigate('Invitations')}
                            />
                            <QuickAction
                                title="Shop đang hợp tác"
                                description="Xem thông tin shop, liên hệ Zalo và chọn shop để đăng bài"
                                icon={<Building2 color="#16A34A" size={20} />}
                                onPress={() => navigation.navigate('MyActiveShops')}
                            />
                            <QuickAction
                                title="Bài đăng của tôi"
                                description="Theo dõi bài đã đăng thay mặt shop và trạng thái duyệt bài"
                                icon={<FileText color="#16A34A" size={20} />}
                                onPress={() => navigation.navigate('MyPost')}
                            />
                            <QuickAction
                                title="Thông báo"
                                description="Theo dõi duyệt bài, thay đổi hợp tác và cập nhật thanh toán"
                                icon={<UserCheck color="#16A34A" size={20} />}
                                onPress={() => navigation.navigate('Notifications')}
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.logoutCard} activeOpacity={0.85} onPress={handleLogout}>
                        <Text style={styles.logoutTitle}>Đăng xuất</Text>
                        <Text style={styles.logoutText}>Rời khỏi tài khoản cộng tác viên trên thiết bị này.</Text>
                    </TouchableOpacity>
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
        alignItems: 'flex-start',
        marginBottom: 24,
        gap: 12,
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
    subtitleText: {
        marginTop: 8,
        color: '#DCFCE7',
        fontSize: 13,
        lineHeight: 20,
    },
    notificationBtn: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 20,
        height: 20,
        borderRadius: 999,
        backgroundColor: '#EF4444',
        paddingHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#064E3B',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
    },
    profileCard: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    profileLabel: {
        color: '#D1FAE5',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    profileStatus: {
        marginTop: 8,
        color: 'white',
        fontSize: 22,
        fontWeight: '800',
    },
    profileText: {
        marginTop: 8,
        color: '#DCFCE7',
        fontSize: 13,
        lineHeight: 20,
    },
    content: {
        paddingHorizontal: 24,
        marginTop: -50,
        paddingBottom: 28,
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
    statsRow: {
        flexDirection: 'row',
        gap: 14,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
    },
    statTitle: {
        marginTop: 6,
        fontSize: 13,
        fontWeight: '700',
        color: '#0F172A',
    },
    statHelper: {
        marginTop: 4,
        fontSize: 11,
        color: '#64748B',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 12,
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
    logoutCard: {
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: '#FED7AA',
        borderRadius: 20,
        padding: 18,
    },
    logoutTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#9A3412',
    },
    logoutText: {
        marginTop: 4,
        fontSize: 12,
        color: '#C2410C',
    },
});

export default DashboardScreen;
