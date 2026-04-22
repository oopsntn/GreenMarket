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
import { ArrowLeft, CircleDollarSign, TrendingUp, Wallet } from 'lucide-react-native';
import CustomAlert from '../../utils/AlertHelper';
import {
  hostService,
  HostDashboardStats,
  HostEarning,
  PaginationMeta,
} from '../services/hostService';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const formatCurrency = (amount: number) => currencyFormatter.format(Number.isFinite(amount) ? amount : 0);

const STATUS_BAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

type FilterType = 'all' | 'available' | 'pending';

const HostEarningsScreen = () => {
  const navigation = useNavigation<any>();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('Dashboard');
  };

  const [dashboard, setDashboard] = useState<HostDashboardStats | null>(null);
  const [earnings, setEarnings] = useState<HostEarning[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const loadInitial = async () => {
    setLoading(true);
    try {
      const [dashboardData, earningRes] = await Promise.all([
        hostService.getDashboard(),
        hostService.getEarnings(1, 20),
      ]);

      setDashboard(dashboardData.stats);
      setEarnings(earningRes.data);
      setMeta(earningRes.meta);
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Không tải được dữ liệu doanh thu.'
          : 'Không tải được dữ liệu doanh thu.';
      CustomAlert('Lỗi', message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInitial();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [dashboardData, earningRes] = await Promise.all([
        hostService.getDashboard(),
        hostService.getEarnings(1, 20),
      ]);

      setDashboard(dashboardData.stats);
      setEarnings(earningRes.data);
      setMeta(earningRes.meta);
    } catch {
      CustomAlert('Lỗi', 'Không thể làm mới dữ liệu doanh thu.');
    } finally {
      setRefreshing(false);
    }
  };

  const loadMore = async () => {
    if (!meta || loadingMore) {
      return;
    }

    const currentCount = earnings.length;
    if (currentCount >= meta.totalItems) {
      return;
    }

    setLoadingMore(true);
    try {
      const nextPage = meta.page + 1;
      const response = await hostService.getEarnings(nextPage, meta.limit);
      setEarnings((prev) => [...prev, ...response.data]);
      setMeta(response.meta);
    } catch {
      CustomAlert('Lỗi', 'Không tải thêm giao dịch doanh thu.');
    } finally {
      setLoadingMore(false);
    }
  };

  const filteredEarnings = useMemo(() => {
    if (filter === 'all') {
      return earnings;
    }

    return earnings.filter((item) => item.hostEarningStatus === filter);
  }, [earnings, filter]);

  const filterTotal = useMemo(
    () =>
      filteredEarnings.reduce(
        (sum, item) => sum + Number(item.hostEarningAmount || 0),
        0
      ),
    [filteredEarnings]
  );

  const renderEarning = ({ item }: { item: HostEarning }) => {
    const isAvailable = item.hostEarningStatus === 'available';

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemTop}>
          <View style={styles.itemSourceWrap}>
            <CircleDollarSign color={isAvailable ? '#16A34A' : '#0EA5E9'} size={16} />
            <Text style={styles.itemSourceText}>{item.hostEarningSourceType || 'source'}</Text>
          </View>
          <View
            style={[
              styles.statusPill,
              isAvailable ? styles.statusAvailable : styles.statusPending,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isAvailable ? styles.statusAvailableText : styles.statusPendingText,
              ]}
            >
              {isAvailable ? 'available' : 'pending'}
            </Text>
          </View>
        </View>

        <Text style={styles.itemAmount}>{formatCurrency(Number(item.hostEarningAmount || 0))}</Text>
        <Text style={styles.itemDate}>
          {item.hostEarningCreatedAt
            ? new Date(item.hostEarningCreatedAt).toLocaleString('vi-VN')
            : 'Không rõ thời gian'}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.containerCenter}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Đang tải dữ liệu doanh thu...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <ArrowLeft color="#0F172A" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doanh thu Host</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.summaryWrap}>
        <View style={styles.summaryCard}>
          <TrendingUp color="#16A34A" size={18} />
          <Text style={styles.summaryLabel}>Tổng thu nhập</Text>
          <Text style={styles.summaryValue}>{formatCurrency(dashboard?.totalEarnings || 0)}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Wallet color="#0EA5E9" size={18} />
          <Text style={styles.summaryLabel}>Số dư khả dụng</Text>
          <Text style={styles.summaryValue}>{formatCurrency(dashboard?.availableBalance || 0)}</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'available', 'pending'] as FilterType[]).map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setFilter(item)}
            style={[styles.filterBtn, filter === item && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterSummary}>
        <Text style={styles.filterSummaryText}>{`${filteredEarnings.length} giao dịch`}</Text>
        <Text style={styles.filterSummaryText}>{formatCurrency(filterTotal)}</Text>
      </View>

      <FlatList
        data={filteredEarnings}
        keyExtractor={(item, index) => String(item.hostEarningId ?? `${index}-${item.hostEarningCreatedAt ?? ''}`)}
        renderItem={renderEarning}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16A34A" />
        }
        onEndReachedThreshold={0.3}
        onEndReached={loadMore}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Chưa có giao dịch doanh thu</Text>
            <Text style={styles.emptyDesc}>Doanh thu sẽ hiển thị khi nội dung quảng bá tạo ra lượt xem/click hợp lệ.</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
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
  containerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    color: '#475569',
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 14 + STATUS_BAR_OFFSET,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryWrap: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  summaryLabel: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryValue: {
    marginTop: 4,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  filterBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#F8FAFC',
  },
  filterBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  filterText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#166534',
  },
  filterSummary: {
    marginTop: 10,
    marginHorizontal: 16,
    paddingHorizontal: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterSummaryText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 30,
    gap: 10,
  },
  itemCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
    padding: 12,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemSourceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemSourceText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusAvailable: {
    backgroundColor: '#DCFCE7',
  },
  statusPending: {
    backgroundColor: '#E0F2FE',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusAvailableText: {
    color: '#166534',
  },
  statusPendingText: {
    color: '#0369A1',
  },
  itemAmount: {
    marginTop: 10,
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '800',
  },
  itemDate: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
  },
  emptyWrap: {
    paddingTop: 40,
    alignItems: 'center',
    paddingHorizontal: 26,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyDesc: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLoader: {
    paddingVertical: 12,
  },
});

export default HostEarningsScreen;
