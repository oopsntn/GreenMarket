import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ArrowLeft, HandCoins, Landmark, Wallet } from 'lucide-react-native';
import CustomAlert from '../../utils/AlertHelper';
import {
  hostService,
  HostDashboardStats,
  HostPayoutRequest,
} from '../services/hostService';

const MIN_PAYOUT_AMOUNT = 500000;

const PAYOUT_METHODS = [
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Momo', value: 'momo' },
  { label: 'ZaloPay', value: 'zalopay' },
] as const;

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number) => currencyFormatter.format(Number.isFinite(value) ? value : 0);

const HostPayoutScreen = () => {
  const navigation = useNavigation<any>();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('Dashboard');
  };

  const [dashboard, setDashboard] = useState<HostDashboardStats | null>(null);
  const [requests, setRequests] = useState<HostPayoutRequest[]>([]);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<(typeof PAYOUT_METHODS)[number]['value']>('bank_transfer');
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const availableBalance = dashboard?.availableBalance || 0;

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardData, payoutData] = await Promise.all([
        hostService.getDashboard(),
        hostService.getPayoutRequests(1, 30),
      ]);

      setDashboard(dashboardData.stats);
      setRequests(payoutData.data);
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Không tải được dữ liệu rút tiền.'
          : 'Không tải được dữ liệu rút tiền.';
      CustomAlert('Lỗi', message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [dashboardData, payoutData] = await Promise.all([
        hostService.getDashboard(),
        hostService.getPayoutRequests(1, 30),
      ]);

      setDashboard(dashboardData.stats);
      setRequests(payoutData.data);
    } catch {
      CustomAlert('Lỗi', 'Không thể làm mới dữ liệu rút tiền.');
    } finally {
      setRefreshing(false);
    }
  };

  const parsedAmount = useMemo(() => {
    const numeric = Number(amount.replace(/[^\d]/g, ''));
    return Number.isFinite(numeric) ? numeric : 0;
  }, [amount]);

  const resetForm = () => {
    setAmount('');
    setMethod('bank_transfer');
    setNote('');
  };

  const handleSubmitPayout = async () => {
    if (!parsedAmount || parsedAmount < MIN_PAYOUT_AMOUNT) {
      CustomAlert('Không hợp lệ', `Số tiền rút tối thiểu là ${formatCurrency(MIN_PAYOUT_AMOUNT)}.`);
      return;
    }

    if (parsedAmount > availableBalance) {
      CustomAlert('Không hợp lệ', 'Số tiền rút vượt quá số dư khả dụng.');
      return;
    }

    setSubmitting(true);
    try {
      await hostService.createPayoutRequest({
        amount: parsedAmount,
        method,
        note: note.trim() || undefined,
      });

      CustomAlert('Thành công', 'Đã gửi yêu cầu rút tiền.');
      resetForm();
      await onRefresh();
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Không thể tạo yêu cầu rút tiền.'
          : 'Không thể tạo yêu cầu rút tiền.';

      CustomAlert('Lỗi', message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderRequestItem = ({ item }: { item: HostPayoutRequest }) => {
    const status = item.hostPayoutStatus || 'pending';

    const statusConfig =
      status === 'completed'
        ? { bg: '#DCFCE7', text: '#166534' }
        : status === 'rejected'
          ? { bg: '#FEE2E2', text: '#991B1B' }
          : { bg: '#E0F2FE', text: '#0C4A6E' };

    return (
      <View style={styles.requestItem}>
        <View style={styles.requestTop}>
          <Text style={styles.requestAmount}>{formatCurrency(Number(item.hostPayoutAmount || 0))}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.text }]}>{status}</Text>
          </View>
        </View>

        <Text style={styles.requestMeta}>{`Method: ${item.hostPayoutMethod || '-'}`}</Text>
        {!!item.hostPayoutNote ? <Text style={styles.requestNote}>{item.hostPayoutNote}</Text> : null}
        <Text style={styles.requestDate}>
          {item.hostPayoutCreatedAt
            ? new Date(item.hostPayoutCreatedAt).toLocaleString('vi-VN')
            : 'Không rõ thời gian'}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Đang tải dữ liệu rút tiền...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <ArrowLeft color="#0F172A" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yêu cầu rút tiền</Text>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.hostPayoutId.toString()}
        renderItem={renderRequestItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16A34A" />
        }
        ListHeaderComponent={
          <>
            <View style={styles.balanceCard}>
              <View style={styles.balanceRow}>
                <Wallet color="#16A34A" size={18} />
                <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
              </View>
              <Text style={styles.balanceValue}>{formatCurrency(availableBalance)}</Text>
              <Text style={styles.balanceHint}>{`Rút tối thiểu ${formatCurrency(MIN_PAYOUT_AMOUNT)}`}</Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.formHeaderRow}>
                <HandCoins color="#0EA5E9" size={18} />
                <Text style={styles.formTitle}>Tạo yêu cầu mới</Text>
              </View>

              <Text style={styles.label}>Số tiền rút (VND)</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập số tiền"
                keyboardType="number-pad"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={styles.label}>Phương thức</Text>
              <View style={styles.methodRow}>
                {PAYOUT_METHODS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setMethod(option.value)}
                    style={[styles.methodBtn, method === option.value && styles.methodBtnActive]}
                  >
                    <Landmark
                      size={14}
                      color={method === option.value ? '#166534' : '#334155'}
                    />
                    <Text
                      style={[
                        styles.methodText,
                        method === option.value && styles.methodTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Ghi chú (tuỳ chọn)</Text>
              <TextInput
                style={[styles.input, styles.noteInput]}
                placeholder="Thông tin tài khoản nhận tiền hoặc ghi chú thêm"
                multiline
                textAlignVertical="top"
                value={note}
                onChangeText={setNote}
              />

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.disabledBtn]}
                onPress={handleSubmitPayout}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitText}>Gửi yêu cầu rút tiền</Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Lịch sử yêu cầu</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Chưa có yêu cầu rút tiền</Text>
            <Text style={styles.emptyDesc}>Lịch sử sẽ xuất hiện sau khi bạn gửi yêu cầu đầu tiên.</Text>
          </View>
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
  loadingContainer: {
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
    paddingVertical: 14,
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
  listContent: {
    padding: 16,
    paddingBottom: 30,
    gap: 10,
  },
  balanceCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    padding: 14,
    marginBottom: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceLabel: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  balanceValue: {
    marginTop: 8,
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  balanceHint: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 11,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 4,
  },
  formTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  noteInput: {
    minHeight: 84,
    paddingTop: 10,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  methodBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  methodBtnActive: {
    borderColor: '#22C55E',
    backgroundColor: '#ECFDF5',
  },
  methodText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  methodTextActive: {
    color: '#166534',
  },
  submitBtn: {
    marginTop: 14,
    backgroundColor: '#16A34A',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionTitle: {
    marginTop: 2,
    marginBottom: 2,
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 14,
  },
  requestItem: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: 'white',
    padding: 12,
  },
  requestTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestAmount: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 17,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  requestMeta: {
    marginTop: 8,
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  requestNote: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },
  requestDate: {
    marginTop: 6,
    color: '#94A3B8',
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyDesc: {
    color: '#64748B',
    marginTop: 6,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default HostPayoutScreen;
