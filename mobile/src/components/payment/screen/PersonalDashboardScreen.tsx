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
import { CircleDollarSign } from 'lucide-react-native';

type Txn = {
  transactionId?: number;
  transactionAmount?: string | number;
  transactionStatus?: string;
  transactionType?: string;
  transactionProvider?: string;
  transactionCreatedAt?: string;
};

const formatVnd = (value: unknown) => {
  const n = Number(value ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(safe) + ' VND';
};

const formatDate = (iso?: string) => {
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
  const [rows, setRows] = useState<Txn[]>([]);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await api.get<any>('/payment/history');
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setRows(list);
    } catch (e) {
      console.error('Failed to load payment history:', e);
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const data = useMemo(() => rows.filter(Boolean), [rows]);

  return (
    <MobileLayout title="Dashboard cá nhân" scrollEnabled={false} backButton={() => navigation.goBack()}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => String(item?.transactionId ?? index)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.title}>
                  {item.transactionType || 'Giao dịch'} • {item.transactionStatus || 'unknown'}
                </Text>
                <Text style={styles.amount}>{formatVnd(item.transactionAmount)}</Text>
              </View>
              <Text style={styles.sub}>
                {item.transactionProvider ? `Provider: ${item.transactionProvider} • ` : ''}
                {formatDate(item.transactionCreatedAt)}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <CircleDollarSign size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Chưa có giao dịch</Text>
              <Text style={styles.emptyDesc}>Lịch sử thanh toán và gói ưu tiên sẽ hiển thị tại đây.</Text>
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
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { flex: 1, fontSize: 12, fontWeight: '900', color: '#0F172A', textTransform: 'uppercase' },
  amount: { fontSize: 12, fontWeight: '900', color: '#16A34A' },
  sub: { marginTop: 6, fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  emptyTitle: { marginTop: 6, fontSize: 16, fontWeight: '900', color: '#0F172A' },
  emptyDesc: { fontSize: 12, fontWeight: '600', color: '#64748B', textAlign: 'center' },
});

export default PersonalDashboardScreen;

