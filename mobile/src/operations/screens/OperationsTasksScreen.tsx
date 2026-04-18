import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ClipboardList } from 'lucide-react-native';
import CustomAlert from '../../utils/AlertHelper';
import {
  OperationTaskListItem,
  OperationTaskPriority,
  OperationTaskStatus,
  OperationTaskType,
  PaginationMeta,
  operationsService,
} from '../services/operationsService';

type OptionValue<T extends string> = T | 'all';

const STATUS_OPTIONS: Array<{ label: string; value: OptionValue<OperationTaskStatus> }> = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Closed', value: 'closed' },
];

const TYPE_OPTIONS: Array<{ label: string; value: OptionValue<OperationTaskType> }> = [
  { label: 'All', value: 'all' },
  { label: 'Report', value: 'report' },
  { label: 'Verification', value: 'verification' },
  { label: 'Support', value: 'support' },
];

const PRIORITY_OPTIONS: Array<{ label: string; value: OptionValue<OperationTaskPriority> }> = [
  { label: 'All', value: 'all' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

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

const defaultMeta: PaginationMeta = {
  page: 1,
  limit: 20,
  totalItems: 0,
  totalPages: 1,
};

const STATUS_BAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

const OperationsTasksScreen = () => {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tasks, setTasks] = useState<OperationTaskListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);

  const [statusFilter, setStatusFilter] = useState<OptionValue<OperationTaskStatus>>('all');
  const [typeFilter, setTypeFilter] = useState<OptionValue<OperationTaskType>>('all');
  const [priorityFilter, setPriorityFilter] = useState<OptionValue<OperationTaskPriority>>('all');

  const requestFilters = useMemo(
    () => ({
      status: statusFilter === 'all' ? undefined : statusFilter,
      type: typeFilter === 'all' ? undefined : typeFilter,
      priority: priorityFilter === 'all' ? undefined : priorityFilter,
    }),
    [priorityFilter, statusFilter, typeFilter]
  );

  const fetchTasks = useCallback(
    async (page = 1, append = false) => {
      try {
        const response = await operationsService.getTasks({
          page,
          limit: 20,
          ...requestFilters,
        });

        setMeta(response.meta);
        setTasks((prev) => (append ? [...prev, ...response.data] : response.data));
      } catch (err: unknown) {
        const message =
          typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
            ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
              'Không tải được task queue.'
            : 'Không tải được task queue.';

        CustomAlert('Lỗi', message);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [requestFilters]
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTasks(1, false);
    }, [fetchTasks])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks(1, false);
  };

  const loadMore = () => {
    if (loadingMore || meta.page >= meta.totalPages) {
      return;
    }

    setLoadingMore(true);
    fetchTasks(meta.page + 1, true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Assigned Tasks</Text>
        <Text style={styles.pageSubtitle}>{`${meta.totalItems} task`}</Text>
      </View>

      <View style={styles.filtersWrap}>
        <View style={styles.filterLine}>
          {STATUS_OPTIONS.map((item) => (
            <TouchableOpacity
              key={`status_${item.value}`}
              style={[styles.filterBtn, statusFilter === item.value && styles.filterBtnActive]}
              onPress={() => setStatusFilter(item.value)}
            >
              <Text style={[styles.filterText, statusFilter === item.value && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterLine}>
          {TYPE_OPTIONS.map((item) => (
            <TouchableOpacity
              key={`type_${item.value}`}
              style={[styles.filterBtn, typeFilter === item.value && styles.filterBtnActive]}
              onPress={() => setTypeFilter(item.value)}
            >
              <Text style={[styles.filterText, typeFilter === item.value && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterLine}>
          {PRIORITY_OPTIONS.map((item) => (
            <TouchableOpacity
              key={`priority_${item.value}`}
              style={[styles.filterBtn, priorityFilter === item.value && styles.filterBtnActive]}
              onPress={() => setPriorityFilter(item.value)}
            >
              <Text style={[styles.filterText, priorityFilter === item.value && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.taskId.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReachedThreshold={0.25}
        onEndReached={loadMore}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.taskCard}
            onPress={() => navigation.navigate('TaskDetail', { taskId: item.taskId })}
          >
            <View style={styles.taskCardTop}>
              <Text style={styles.taskTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>

            <Text style={styles.taskMeta}>{`${item.type} • ${item.priority}`}</Text>
            <Text style={styles.taskMeta}>{`Customer: ${item.customerName || 'N/A'}`}</Text>
            <Text style={styles.taskDate}>{formatDateTime(item.updatedAt || item.createdAt)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <ClipboardList color="#64748B" size={18} />
            <Text style={styles.emptyText}>Không có task phù hợp bộ lọc hiện tại.</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color="#16A34A" />
            </View>
          ) : null
        }
      />
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
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12 + STATUS_BAR_OFFSET,
    paddingBottom: 12,
  },
  pageTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  pageSubtitle: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 12,
  },
  filtersWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  filterLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterBtnActive: {
    borderColor: '#22C55E',
    backgroundColor: '#DCFCE7',
  },
  filterText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#166534',
  },
  listContent: {
    padding: 16,
    paddingTop: 10,
    gap: 10,
    paddingBottom: 30,
  },
  taskCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: 'white',
    padding: 12,
  },
  taskCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  taskTitle: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  statusPill: {
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusText: {
    color: '#3730A3',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  taskMeta: {
    marginTop: 5,
    color: '#64748B',
    fontSize: 12,
  },
  taskDate: {
    marginTop: 5,
    color: '#94A3B8',
    fontSize: 11,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 30,
    gap: 8,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
  },
  footerLoading: {
    paddingVertical: 10,
  },
});

export default OperationsTasksScreen;
