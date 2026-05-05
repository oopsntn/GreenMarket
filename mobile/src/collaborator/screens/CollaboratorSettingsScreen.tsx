import React, { useCallback, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Bell, ChevronRight, LogOut, User } from 'lucide-react-native'
import MobileLayout from '../../components/Reused/MobileLayout/MobileLayout'
import { useAuth } from '../../context/AuthContext'
import { notificationService } from '../../components/notification/service/notificationService'

const CollaboratorSettingsScreen = ({ navigation }: any) => {
    const { logout, user } = useAuth()
    const [unreadCount, setUnreadCount] = useState(0)

    useFocusEffect(
        useCallback(() => {
            const loadUnreadCount = async () => {
                try {
                    const count = await notificationService.getUnreadCount()
                    setUnreadCount(count)
                } catch (error) {
                    console.error('Failed to load collaborator unread count:', error)
                }
            }

            loadUnreadCount()
        }, []),
    )

    const handleLogout = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất không?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        await logout()
                    },
                },
            ],
        )
    }

    return (
        <MobileLayout title="Cài đặt" headerStyle="default">
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.heroCard}>
                    <Text style={styles.heroLabel}>CỘNG TÁC VIÊN</Text>
                    <Text style={styles.heroTitle}>{user?.userDisplayName || 'Tài khoản cộng tác viên'}</Text>
                    <Text style={styles.heroSubtitle}>
                        Quản lý hồ sơ cá nhân, xem thông báo và đăng xuất khỏi tài khoản hiện tại.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tùy chọn</Text>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Profile')}>
                        <View style={styles.menuLeft}>
                            <View style={styles.iconWrap}>
                                <User size={20} color="#16A34A" />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={styles.menuTitle}>Hồ sơ cá nhân</Text>
                                <Text style={styles.menuDesc}>Xem và cập nhật thông tin cộng tác viên</Text>
                            </View>
                        </View>
                        <ChevronRight size={20} color="#94A3B8" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Notifications')}>
                        <View style={styles.menuLeft}>
                            <View style={styles.iconWrap}>
                                <Bell size={20} color="#16A34A" />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={styles.menuTitle}>Thông báo</Text>
                                <Text style={styles.menuDesc}>Theo dõi lời mời, duyệt bài và cập nhật liên quan</Text>
                            </View>
                        </View>
                        <View style={styles.menuRight}>
                            {unreadCount > 0 ? (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                </View>
                            ) : null}
                            <ChevronRight size={20} color="#94A3B8" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
                        <View style={styles.menuLeft}>
                            <View style={[styles.iconWrap, styles.logoutIconWrap]}>
                                <LogOut size={20} color="#DC2626" />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={[styles.menuTitle, styles.logoutTitle]}>Đăng xuất</Text>
                                <Text style={styles.menuDesc}>Thoát khỏi tài khoản cộng tác viên hiện tại</Text>
                            </View>
                        </View>
                        <ChevronRight size={20} color="#FCA5A5" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
        backgroundColor: '#F8FAFC',
    },
    heroCard: {
        backgroundColor: '#065F46',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
    },
    heroLabel: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.6,
        color: '#A7F3D0',
        marginBottom: 8,
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 13,
        lineHeight: 20,
        color: '#D1FAE5',
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 18,
        padding: 14,
        marginBottom: 10,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    logoutIconWrap: {
        backgroundColor: '#FEF2F2',
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
    },
    logoutTitle: {
        color: '#DC2626',
    },
    menuDesc: {
        marginTop: 3,
        fontSize: 12,
        lineHeight: 18,
        color: '#64748B',
    },
    badge: {
        minWidth: 22,
        height: 22,
        borderRadius: 999,
        paddingHorizontal: 6,
        backgroundColor: '#16A34A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
    },
    logoutItem: {
        borderColor: '#FECACA',
        backgroundColor: '#FFF7F7',
    },
})

export default CollaboratorSettingsScreen
