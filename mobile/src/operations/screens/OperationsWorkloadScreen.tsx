import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { operationsService, OperationTaskListItem, OperationWorkloadStats } from '../services/operationsService';

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

const OperationsWorkloadScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<OperationWorkloadStats>(emptyStats);
  const [openTasks, setOpenTasks] = useState<OperationTaskListItem[]>([]);
  const [inProgressTasks, setInProgressTasks] = useState<OperationTaskListItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [workloadRes, openRes, inProgressRes] = await Promise.all([
        operationsService.getDailyWorkload(),
        operationsService.getTasks({ status: 'open', page: 1, limit: 5 }),
        operationsService.getTasks({ status: 'in_progress', page: 1, limit: 5 }),
      ]);

      setStats(workloadRes.stats);
      setOpenTasks(openRes.data);
      setInProgressTasks(inProgressRes.data);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.pageTitle}>Daily Workload</Text>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Tổng task</Text>
            <Text style={styles.summaryValue}>{stats.total}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Open</Text>
            <Text style={styles.summaryValue}>{stats.open}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>In progress</Text>
            <Text style={styles.summaryValue}>{stats.inProgress}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Closed</Text>
            <Text style={styles.summaryValue}>{stats.closed}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Open queue</Text>
          {openTasks.length === 0 ? (
            <Text style={styles.emptyText}>Không có task open.</Text>
          ) : (
            openTasks.map((task) => (
              <View key={`open_${task.taskId}`} style={styles.taskRow}>
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {task.title}
                </Text>
                <Text style={styles.taskMeta}>{`${task.type} • ${task.priority}`}</Text>
                <Text style={styles.taskTime}>{formatDateTime(task.updatedAt || task.createdAt)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>In progress queue</Text>
          {inProgressTasks.length === 0 ? (
            <Text style={styles.emptyText}>Không có task in_progress.</Text>
          ) : (
            inProgressTasks.map((task) => (
              <View key={`progress_${task.taskId}`} style={styles.taskRow}>
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {task.title}
                </Text>
                <Text style={styles.taskMeta}>{`${task.type} • ${task.priority}`}</Text>
                <Text style={styles.taskTime}>{formatDateTime(task.updatedAt || task.createdAt)}</Text>
              </View>
            ))
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16 + STATUS_BAR_OFFSET,
    paddingBottom: 26,
  },
  pageTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  summaryLabel: {
    color: '#64748B',
    fontSize: 12,
  },
  summaryValue: {
    marginTop: 5,
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 20,
  },
  section: {
    marginTop: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  sectionTitle: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 8,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
  },
  taskRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 10,
  },
  taskTitle: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  taskMeta: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  taskTime: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
});

export default OperationsWorkloadScreen;
