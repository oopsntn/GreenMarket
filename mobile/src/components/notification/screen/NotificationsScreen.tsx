import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Bell, CheckCheck, CheckCircle2, CircleAlert, Info, ReceiptText } from 'lucide-react-native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import { AppNotification, notificationService } from '../service/notificationService';
import CustomAlert from '../../../utils/AlertHelper';

const formatTime = (dateString?: string) => {
    if (!dateString) return 'Vừa xong';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Vừa xong';

    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

const getNotificationIcon = (item: AppNotification) => {
    const title = String(item.title || '').toLowerCase();
    const message = String(item.message || '').toLowerCase();

    if (title.includes('gói') || message.includes('giao dịch')) {
        return <ReceiptText size={18} color="#2563eb" />;
    }

    if (item.type === 'success') {
        return <CheckCircle2 size={18} color="#16a34a" />;
    }

    if (item.type === 'warning' || item.type === 'error') {
        return <CircleAlert size={18} color="#f59e0b" />;
    }

    return <Info size={18} color="#64748b" />;
}

const NotificationsScreen = () => {
    const navigation = useNavigation<any>();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);

    const loadNotifications = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const data = await notificationService.getNotifications();
            setNotifications(data);
        } catch (error: any) {
            console.error('Failed to load notifications:', error);
            if (!isRefresh) {
                CustomAlert('Lỗi', error?.response?.data?.error || 'Không thể tải danh sách thông báo.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadNotifications();
        }, []),
    );

    const unreadCount = useMemo(
        () => notifications.filter((item) => !item.isRead).length,
        [notifications],
    );

    const handleMarkAllAsRead = async () => {
        try {
            setMarkingAll(true);
            await notificationService.markAllAsRead();
            setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
        } catch (error: any) {
            CustomAlert('Lỗi', error?.response?.data?.error || 'Không thể đánh dấu tất cả là đã đọc.');
        } finally {
            setMarkingAll(false);
        }
    }

    const handlePressNotification = async (item: AppNotification) => {
        try {
            if (!item.isRead) {
                await notificationService.markAsRead(item.notificationId);
                setNotifications((prev) =>
                    prev.map((notification) =>
                        notification.notificationId === item.notificationId
                            ? { ...notification, isRead: true }
                            : notification,
                    ),
                );
            }

            const navigated = await notificationService.navigateFromNotification(navigation, item);
            if (!navigated) {
                CustomAlert('Thông báo', item.message || 'Không có màn hình phù hợp để mở thông báo này.');
            }
        } catch (error: any) {
            console.error('Failed to open notification:', error);
            CustomAlert('Lỗi', error?.response?.data?.error || 'Không thể mở thông báo này.');
        }
    }

    const renderItem = ({ item }: { item: AppNotification }) => (
        <TouchableOpacity
            style={[styles.card, !item.isRead && styles.unreadCard]}
            activeOpacity={0.85}
            onPress={() => handlePressNotification(item)}
        >
            <View style={[styles.iconWrap, !item.isRead && styles.unreadIconWrap]}>
                {getNotificationIcon(item)}
            </View>

            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={2}>
                        {item.title || 'Thông báo hệ thống'}
                    </Text>
                    {!item.isRead ? <View style={styles.unreadDot} /> : null}
                </View>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
            </View>
        </TouchableOpacity>
    )

    return (
        <MobileLayout
            title="Thông báo"
            backButton={() => navigation.goBack()}
            scrollEnabled={false}
            rightAction={
                unreadCount > 0 ? (
                    <TouchableOpacity
                        onPress={handleMarkAllAsRead}
                        disabled={markingAll}
                        style={styles.headerAction}
                    >
                        <CheckCheck size={20} color="#10b981" />
                    </TouchableOpacity>
                ) : null
            }
        >
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color="#10b981" />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.notificationId.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => loadNotifications(true)}
                        />
                    }
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Bell size={40} color="#cbd5e1" />
                            <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
                            <Text style={styles.emptyText}>
                                Các thông báo về hợp tác, duyệt bài và thanh toán sẽ hiển thị tại đây.
                            </Text>
                        </View>
                    }
                />
            )}
        </MobileLayout>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    headerAction: {
        padding: 4,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 18,
        padding: 14,
        gap: 12,
        marginBottom: 12,
    },
    unreadCard: {
        borderColor: '#bbf7d0',
        backgroundColor: '#f0fdf4',
    },
    iconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
    },
    unreadIconWrap: {
        backgroundColor: '#dcfce7',
    },
    content: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    title: {
        flex: 1,
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 999,
        backgroundColor: '#10b981',
        marginTop: 4,
    },
    message: {
        marginTop: 6,
        fontSize: 12,
        lineHeight: 18,
        color: '#475569',
    },
    time: {
        marginTop: 8,
        fontSize: 11,
        fontWeight: '700',
        color: '#94a3b8',
    },
    empty: {
        alignItems: 'center',
        marginTop: 90,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        marginTop: 12,
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
    },
    emptyText: {
        marginTop: 6,
        textAlign: 'center',
        color: '#64748b',
        lineHeight: 20,
    },
});

export default NotificationsScreen;
