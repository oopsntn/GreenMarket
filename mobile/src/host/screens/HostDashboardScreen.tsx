import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import {
  BarChart3,
  CircleDollarSign,
  Eye,
  Megaphone,
  MousePointerClick,
  Trash2,
  Wallet,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { hostService, HostContent, HostDashboardStats } from '../services/hostService';
import CustomAlert from '../../utils/AlertHelper';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};

const formatDate = (value: string | null) => {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleDateString('vi-VN');
};

const formatContentStatus = (status: string | null | undefined) => {
  const value = String(status || '').toLowerCase();
  if (value === 'published' || value === 'approved') return 'Đã đăng';
  if (value.includes('pending')) return 'Chờ duyệt';
  if (value === 'rejected') return 'Bị từ chối';
  return status || 'Không rõ trạng thái';
};

const emptyStats: HostDashboardStats = {
  totalContents: 0,
  totalViews: 0,
  totalClicks: 0,
  totalEarnings: 0,
  availableBalance: 0,
};

const STATUS_BAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

type StatsCardProps = {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
};

const StatsCard = ({ label, value, icon: Icon, color }: StatsCardProps) => {
  return (
    <View style={styles.statsCard}>
      <View style={[styles.statsIcon, { backgroundColor: `${color}14` }]}>
        <Icon size={18} color={color} />
      </View>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsLabel}>{label}</Text>
    </View>
  );
};

const HostDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<HostDashboardStats>(emptyStats);
  const [contents, setContents] = useState<HostContent[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [dashboardRes, contentRes] = await Promise.all([
        hostService.getDashboard(),
        hostService.getContents(),
      ]);

      setStats(dashboardRes.stats);
      setContents(contentRes);
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Không thể tải dữ liệu Host.'
          : 'Không thể tải dữ liệu Host.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const recentContents = useMemo(() => {
    return [...contents]
      .sort((a, b) => {
        const dateA = a.hostContentCreatedAt ? new Date(a.hostContentCreatedAt).getTime() : 0;
        const dateB = b.hostContentCreatedAt ? new Date(b.hostContentCreatedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 6);
  }, [contents]);

  const openContentTarget = (item: HostContent) => {
    navigation.navigate('HostNewsDetail', { hostContentId: item.hostContentId });
  };

  const handleDeleteContent = (item: HostContent) => {
    if (deletingId !== null) {
      return;
    }

    CustomAlert(
      'Xóa bài đăng',
      'Bạn có chắc muốn xóa tin tức này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(item.hostContentId);
              await hostService.deleteContent(item.hostContentId);

              setContents((prev) => prev.filter((row) => row.hostContentId !== item.hostContentId));
              setStats((prev) => ({
                ...prev,
                totalContents: Math.max(0, prev.totalContents - 1),
              }));

              CustomAlert('Thành công', 'Đã xóa tin tức.');
            } catch (err: unknown) {
              const message =
                typeof err === 'object' &&
                err !== null &&
                'response' in err &&
                typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
                  ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Không thể xóa tin tức.'
                  : 'Không thể xóa tin tức.';
              CustomAlert('Lỗi', message);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  if (error && contents.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#065F46', '#16A34A']} style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Xin chào,</Text>
              <Text style={styles.userName}>{user?.userDisplayName || 'Host'}</Text>
              <Text style={styles.subTitle}>Theo dõi hiệu suất và thu nhập nội dung</Text>
            </View>
          </View>

          <View style={styles.balanceBox}>
            <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
            <Text style={styles.balanceValue}>{formatCurrency(stats.availableBalance)}</Text>
            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={() => navigation.navigate('Payout')}
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

          <View style={styles.statsGrid}>
            <StatsCard
              label="Nội dung"
              value={String(stats.totalContents)}
              icon={Megaphone}
              color="#16A34A"
            />
            <StatsCard
              label="Lượt xem"
              value={String(stats.totalViews)}
              icon={Eye}
              color="#2563EB"
            />
            <StatsCard
              label="Lượt click"
              value={String(stats.totalClicks)}
              icon={MousePointerClick}
              color="#F59E0B"
            />
            <StatsCard
              label="Thu nhập"
              value={formatCurrency(stats.totalEarnings)}
              icon={CircleDollarSign}
              color="#9333EA"
            />
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('CreateContent')}
            >
              <Megaphone size={18} color="#166534" />
              <Text style={styles.actionText}>Tạo nội dung</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Earnings')}
            >
              <Wallet size={18} color="#166534" />
              <Text style={styles.actionText}>Thu nhập</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Earnings')}
            >
              <BarChart3 size={18} color="#166534" />
              <Text style={styles.actionText}>Phân tích</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tin tức đã đăng</Text>
            {recentContents.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Bạn chưa có nội dung quảng bá nào.</Text>
              </View>
            ) : (
              recentContents.map((item) => (
                <View
                  key={item.hostContentId}
                  style={styles.contentRow}
                >
                  <TouchableOpacity
                    style={styles.contentMainTap}
                    onPress={() => openContentTarget(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.contentMeta}>
                      <Text style={styles.contentTitle} numberOfLines={1}>
                        {item.hostContentTitle}
                      </Text>
                      <Text style={styles.contentDate}>{formatDate(item.hostContentCreatedAt)}</Text>
                      <Text style={styles.contentStatus}>{formatContentStatus(item.hostContentStatus)}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.rowActions}>
                    <View style={styles.metricsRow}>
                      <View style={styles.metricItem}>
                        <Eye size={14} color="#475569" />
                        <Text style={styles.metricText}>{item.hostContentViewCount}</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <MousePointerClick size={14} color="#475569" />
                        <Text style={styles.metricText}>{item.hostContentClickCount}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.deleteBtn,
                        deletingId !== null ? styles.deleteBtnDisabled : null,
                      ]}
                      onPress={() => handleDeleteContent(item)}
                      disabled={deletingId !== null}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {deletingId === item.hostContentId ? (
                        <>
                          <ActivityIndicator size="small" color="white" />
                          <Text style={styles.deleteBtnText}>Đang xóa</Text>
                        </>
                      ) : (
                        <>
                          <Trash2 size={15} color="white" />
                          <Text style={styles.deleteBtnText}>Xóa</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  retryBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  retryBtnText: {
    color: 'white',
    fontWeight: '700',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20 + STATUS_BAR_OFFSET,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    color: '#D1FAE5',
    fontSize: 12,
  },
  userName: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  subTitle: {
    color: '#DCFCE7',
    fontSize: 12,
    marginTop: 4,
  },
  balanceBox: {
    marginTop: 18,
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 14,
  },
  balanceLabel: {
    color: '#D1FAE5',
    fontSize: 12,
  },
  balanceValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 6,
  },
  withdrawBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  withdrawBtnText: {
    color: '#166534',
    fontWeight: '700',
    fontSize: 12,
  },
  content: {
    padding: 16,
  },
  inlineError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  inlineErrorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  statsCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statsLabel: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 12,
  },
  quickActions: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
  },
  actionText: {
    color: '#166534',
    fontWeight: '700',
    fontSize: 12,
  },
  section: {
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  sectionTitle: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 10,
  },
  emptyBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  contentMainTap: {
    flex: 1,
  },
  contentMeta: {
    flex: 1,
    marginRight: 10,
  },
  contentTitle: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  contentDate: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  contentStatus: {
    marginTop: 2,
    color: '#0EA5E9',
    fontSize: 11,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 12,
  },
  deleteBtn: {
    height: 30,
    borderRadius: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#DC2626',
  },
  deleteBtnDisabled: {
    opacity: 0.65,
  },
  deleteBtnText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default HostDashboardScreen;
