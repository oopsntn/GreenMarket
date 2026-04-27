import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Bell, ClipboardList, TimerReset } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import {
  operationsService,
  OperationTaskListItem,
  OperationWorkloadStats,
} from '../services/operationsService';

const emptyStats: OperationWorkloadStats = {
  total: 0,
  closed: 0,
  open: 0,
  inProgress: 0,
};

const STATUS_BAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

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

const OperationsDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OperationWorkloadStats>(emptyStats);
  const [tasks, setTasks] = useState<OperationTaskListItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setError(null);

      const [workloadRes, tasksRes, notificationsRes] = await Promise.all([
        operationsService.getDailyWorkload(),
        operationsService.getTasks({ page: 1, limit: 6 }),
        operationsService.getNotifications(),
      ]);

      setStats(workloadRes.stats);
      setTasks(tasksRes.data);
      setUnreadCount(notificationsRes.data.filter((item) => !item.isRead).length);
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
            'Không thể tải dữ liệu vận hành.'
          : 'Không thể tải dữ liệu vận hành.';

      setError(message);
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

  const completionRate = useMemo(() => {
    if (!stats.total) {
      return 0;
    }

    return Math.round((stats.closed / stats.total) * 100);
  }, [stats.closed, stats.total]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.centerText}>Đang tải dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#166534', '#22C55E']} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.helloText}>Xin chào,</Text>
              <Text style={styles.userName}>{user?.userDisplayName || 'Operations Staff'}</Text>
            </View>
          </View>
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>Tỷ lệ hoàn tất hôm nay</Text>
            <Text style={styles.progressValue}>{`${completionRate}%`}</Text>
            <Text style={styles.progressHint}>{`${stats.closed}/${stats.total} task đã đóng`}</Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {error ? (
            <View style={styles.inlineError}>
              <Text style={styles.inlineErrorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.grid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Tổng task</Text>
              <Text style={styles.kpiValue}>{stats.total}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Open</Text>
              <Text style={styles.kpiValue}>{stats.open}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>In progress</Text>
              <Text style={styles.kpiValue}>{stats.inProgress}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Đã đóng</Text>
              <Text style={styles.kpiValue}>{stats.closed}</Text>
            </View>
          </View>

          <View style={styles.quickActionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Tasks')}>
              <ClipboardList size={16} color="#166534" />
              <Text style={styles.actionText}>Công việc</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Notifications')}>
              <Bell size={16} color="#166534" />
              <Text style={styles.actionText}>{`Thông báo (${unreadCount})`}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Công việc gần nhất</Text>

            {tasks.length === 0 ? (
              <View style={styles.emptyWrap}>
                <TimerReset size={16} color="#64748B" />
                <Text style={styles.emptyText}>Hiện chưa có task được giao</Text>
              </View>
            ) : (
              tasks.map((task) => (
                <TouchableOpacity
                  key={task.taskId}
                  style={styles.taskRow}
                  onPress={() => navigation.navigate('TaskDetail', { taskId: task.taskId })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <Text style={styles.taskMeta}>
                      {task.customerName || 'Khách hàng'}
                    </Text>
                    <Text style={styles.taskDate}>{formatDateTime(task.updatedAt || task.createdAt)}</Text>
                  </View>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{task.status}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  centerText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 13,
  },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 18 + STATUS_BAR_OFFSET,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helloText: {
    color: '#DCFCE7',
    fontSize: 12,
  },
  userName: {
    marginTop: 2,
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
  },
  heroSubtitle: {
    marginTop: 8,
    color: '#DCFCE7',
    fontSize: 12,
    lineHeight: 17,
  },
  progressCard: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(0,0,0,0.16)',
    padding: 12,
  },
  progressLabel: {
    color: '#DCFCE7',
    fontSize: 12,
  },
  progressValue: {
    marginTop: 4,
    color: 'white',
    fontWeight: '800',
    fontSize: 22,
  },
  progressHint: {
    marginTop: 2,
    color: '#DCFCE7',
    fontSize: 11,
  },
  body: {
    padding: 16,
    paddingBottom: 26,
  },
  inlineError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  inlineErrorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  kpiLabel: {
    color: '#64748B',
    fontSize: 12,
  },
  kpiValue: {
    marginTop: 6,
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  quickActionRow: {
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: 'white',
    padding: 12,
  },
  sectionTitle: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 10,
  },
  emptyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
  },
  taskRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taskTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  taskMeta: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 11,
  },
  taskDate: {
    marginTop: 3,
    color: '#94A3B8',
    fontSize: 11,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  statusText: {
    color: '#3730A3',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default OperationsDashboardScreen;
