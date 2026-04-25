import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import { api } from '../../../config/api';
import { CircleDollarSign, Rocket } from 'lucide-react-native';

type PaymentHistoryTransaction = {
  id: number;
  amount: string | number;
  status: string;
  createdAt: string;
  packageTitle?: string | null;
  postTitle?: string | null;
};

type ActivePromotion = {
  promotionId: number;
  postTitle?: string | null;
  packageTitle?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  status?: string | null;
};

const formatVnd = (value: unknown) => {
  const n = Number(value ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(safe)}đ`;
};

const formatDate = (iso?: string | null) => {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

const PersonalDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<PaymentHistoryTransaction[]>([]);
  const [activePromotions, setActivePromotions] = useState<ActivePromotion[]>([]);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await api.get<any>('/payment/history');
      setTransactions(Array.isArray(res.data?.transactions) ? res.data.transactions : []);
      setActivePromotions(Array.isArray(res.data?.activePromotions) ? res.data.activePromotions : []);
    } catch (e) {
      console.error('Failed to load payment history:', e);
      setTransactions([]);
      setActivePromotions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const hasAnyData = useMemo(
    () => transactions.length > 0 || activePromotions.length > 0,
    [transactions, activePromotions],
  );

  return (
    <MobileLayout title="Thanh toán & đẩy tin" scrollEnabled={false} backButton={() => navigation.goBack()}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, index) => String(item?.id ?? index)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.title}>{item.packageTitle || 'Giao dịch hệ thống'}</Text>
                <Text style={styles.amount}>{formatVnd(item.amount)}</Text>
              </View>
              {item.postTitle ? <Text style={styles.sub}>Bài: {item.postTitle}</Text> : null}
              <Text style={styles.sub}>Trạng thái: {item.status || 'unknown'}</Text>
              <Text style={styles.sub}>{formatDate(item.createdAt)}</Text>
            </View>
          )}
          ListHeaderComponent={
            activePromotions.length > 0 ? (
              <View style={styles.headerSection}>
                <Text style={styles.sectionTitle}>Đang đẩy tin</Text>
                {activePromotions.map((promo) => (
                  <View key={promo.promotionId} style={styles.promoCard}>
                    <View style={styles.promoTitleRow}>
                      <Rocket size={16} color="#16A34A" />
                      <Text style={styles.promoTitle}>{promo.postTitle || 'Bài đăng'}</Text>
                    </View>
                    <Text style={styles.sub}>{promo.packageTitle || 'Gói boost'}</Text>
                    <Text style={styles.sub}>Bắt đầu: {formatDate(promo.startAt)}</Text>
                    <Text style={styles.sub}>Kết thúc: {formatDate(promo.endAt)}</Text>
                  </View>
                ))}
                <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <CircleDollarSign size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>
                {hasAnyData ? 'Chưa có giao dịch' : 'Chưa có thanh toán hoặc gói đẩy tin'}
              </Text>
              <Text style={styles.emptyDesc}>
                Lịch sử giao dịch và các gói đẩy tin đang hoạt động sẽ hiển thị tại đây.
              </Text>
            </View>
          }
        />
      )}
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  list: { padding: 14, paddingBottom: 100, gap: 12 },
  headerSection: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  promoCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  promoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  promoTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { flex: 1, fontSize: 12, fontWeight: '900', color: '#0F172A', textTransform: 'uppercase' },
  amount: { fontSize: 12, fontWeight: '900', color: '#16A34A' },
  sub: { marginTop: 6, fontSize: 11, fontWeight: '700', color: '#64748B' },
  emptyTitle: { marginTop: 6, fontSize: 16, fontWeight: '900', color: '#0F172A' },
  emptyDesc: { fontSize: 12, fontWeight: '600', color: '#64748B', textAlign: 'center' },
});

export default PersonalDashboardScreen;
