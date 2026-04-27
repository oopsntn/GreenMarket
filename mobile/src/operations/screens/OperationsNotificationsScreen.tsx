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
import { BellRing } from 'lucide-react-native';
import CustomAlert from '../../utils/AlertHelper';
import { operationsService, OperationNotification } from '../services/operationsService';
import { api } from '../../config/api';
import MobileLayout from '../../components/Reused/MobileLayout/MobileLayout';

type FilterMode = 'all' | 'unread';

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleString('vi-VN');
};

const OperationsNotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [notifications, setNotifications] = useState<OperationNotification[]>([]);

  const loadData = useCallback(async () => {
    try {
      const response = await operationsService.getNotifications();
      setNotifications(response.data);
    } catch {
      CustomAlert('Lỗi', 'Không tải được danh sách thông báo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') {
      return notifications;
    }

    return notifications.filter((item) => !item.isRead);
  }, [filter, notifications]);

  if (loading) {
    return (
      <MobileLayout title="Thông báo" headerStyle="default" scrollEnabled={false}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Thông báo" headerStyle="default" scrollEnabled={false}>
      <View style={styles.container}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Tất cả</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filter === 'unread' && styles.filterBtnActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>Chưa đọc</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.notificationId.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.isRead && styles.cardUnread]}
              onPress={() => {
                // Mark as read locally
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.notificationId === item.notificationId ? { ...n, isRead: true } : n
                  )
                );
                // Mark as read on server
                api.patch(`/notifications/${item.notificationId}/read`).catch(() => {});
                // Navigate to TaskDetail if metaData has ticketId
                const ticketId = (item.metaData as any)?.ticketId;
                if (ticketId) {
                  navigation.navigate('TaskDetail', { taskId: ticketId });
                }
              }}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconWrap}>
                  <BellRing color="#166534" size={16} />
                </View>
                <Text style={styles.cardType}>{item.type}</Text>
                {!item.isRead ? <View style={styles.dot} /> : null}
              </View>

              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMessage} numberOfLines={3}>
                {item.message}
              </Text>
              <Text style={styles.cardTime}>{formatDateTime(item.createdAt)}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Không có thông báo phù hợp bộ lọc hiện tại.</Text>
            </View>
          }
        />
      </View>
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  filterRow: {
    marginTop: 12,
    marginHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
  },
  filterBtnActive: {
    borderColor: '#22C55E',
    backgroundColor: '#DCFCE7',
  },
  filterText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#166534',
  },
  listContent: {
    padding: 16,
    paddingBottom: 26,
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: 'white',
    padding: 12,
  },
  cardUnread: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardType: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginLeft: 'auto',
  },
  cardTitle: {
    marginTop: 8,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  cardMessage: {
    marginTop: 4,
    color: '#334155',
    fontSize: 12,
    lineHeight: 18,
  },
  cardTime: {
    marginTop: 8,
    color: '#94A3B8',
    fontSize: 11,
  },
  emptyWrap: {
    paddingTop: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
  },
});

export default OperationsNotificationsScreen;
