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

const FILTER_OPTIONS: Array<{ key: FilterType; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'available', label: 'Đã ghi nhận' },
  { key: 'pending', label: 'Đang chờ' },
];

const SOURCE_TYPE_LABELS: Record<string, string> = {
  article_payout: 'Nhuận bút bài viết',
  performance_bonus: 'Thưởng hiệu suất',
  host_content: 'Thu nhập từ nội dung',
  earning: 'Thu nhập ghi nhận',
};

const STATUS_LABELS: Record<'available' | 'pending', string> = {
  available: 'Đã ghi nhận',
  pending: 'Đang chờ',
};

const normalizeSourceTypeKey = (value: string | null | undefined): string => {
  if (!value) {
    return 'other';
  }

  return value.trim().toLowerCase();
};

const resolveSourceTypeLabel = (value: string | null | undefined): string => {
  const key = normalizeSourceTypeKey(value);
  return SOURCE_TYPE_LABELS[key] || 'Giao dịch doanh thu';
};

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
        (sum, item) => sum + item.hostEarningAmount,
        0
      ),
    [filteredEarnings]
  );

  const pendingCount = useMemo(
    () => earnings.filter((item) => item.hostEarningStatus === 'pending').length,
    [earnings],
  );

  const activeFilterLabel = useMemo(
    () => FILTER_OPTIONS.find((item) => item.key === filter)?.label || 'Tất cả',
    [filter],
  );

  const renderEarning = ({ item }: { item: HostEarning }) => {
    const statusKey: 'available' | 'pending' =
      item.hostEarningStatus === 'available' ? 'available' : 'pending';
    const isAvailable = statusKey === 'available';
    const statusHint =
      statusKey === 'available'
        ? 'Khoản này đã được ghi nhận vào số dư khả dụng.'
        : 'Khoản này đang chờ xử lý, chưa cộng vào số dư khả dụng.';

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemTop}>
          <View style={styles.itemSourceWrap}>
            <CircleDollarSign color={isAvailable ? '#16A34A' : '#0EA5E9'} size={16} />
            <Text style={styles.itemSourceText}>{resolveSourceTypeLabel(item.hostEarningSourceType)}</Text>
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
              {STATUS_LABELS[statusKey]}
            </Text>
          </View>
        </View>

        <Text style={styles.itemAmount}>{formatCurrency(item.hostEarningAmount)}</Text>
        <Text style={styles.itemDate}>
          {item.hostEarningCreatedAt
            ? new Date(item.hostEarningCreatedAt).toLocaleString('vi-VN')
            : 'Không rõ thời gian'}
        </Text>

        {item.hostEarningSourceId ? (
          <Text style={styles.itemMetaText}>{`Mã nội dung: #${item.hostEarningSourceId}`}</Text>
        ) : null}

        <Text style={styles.itemNoteText}>{item.hostEarningNote || statusHint}</Text>
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
          <ArrowLeft color="#FFFFFF" size={22} />
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
        {FILTER_OPTIONS.map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => setFilter(item.key)}
            style={[styles.filterBtn, filter === item.key && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterSummary}>
        <Text style={styles.filterSummaryText}>{`${filteredEarnings.length} giao dịch (${activeFilterLabel})`}</Text>
        <Text style={styles.filterSummaryText}>{formatCurrency(filterTotal)}</Text>
      </View>

      {pendingCount > 0 ? (
        <View style={styles.pendingHintBox}>
          <Text style={styles.pendingHintTitle}>{`Có ${pendingCount} giao dịch đang chờ`}</Text>
          <Text style={styles.pendingHintText}>
            Giao dịch chờ là các khoản thu nhập đã phát sinh nhưng chưa hoàn tất xử lý chi trả, nên chưa cộng vào số dư khả dụng.
          </Text>
        </View>
      ) : null}

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
            <Text style={styles.emptyDesc}>Doanh thu sẽ hiển thị khi bài Host được duyệt và ghi nhận theo chính sách hệ thống.</Text>
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
    backgroundColor: '#2e7d32',
    paddingHorizontal: 16,
    paddingTop: 14 + STATUS_BAR_OFFSET,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2e7d32',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
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
  itemMetaText: {
    marginTop: 6,
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  itemNoteText: {
    marginTop: 4,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  pendingHintBox: {
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pendingHintTitle: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  pendingHintText: {
    marginTop: 4,
    color: '#166534',
    fontSize: 12,
    lineHeight: 17,
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
