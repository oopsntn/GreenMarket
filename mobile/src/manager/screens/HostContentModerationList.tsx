import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, CheckCircle2, ChevronRight, Clock, X } from 'lucide-react-native';
import ReasonModal from '../components/ReasonModal';
import managerService, { HostContentModerationData } from '../services/ManagerService';
import CustomAlert from '../../utils/AlertHelper';
import { API_BASE_URL } from '../../config/api';
import ManagerHeader from '../components/ManagerHeader';

const HostContentModerationList = ({ navigation }: any) => {
  const [items, setItems] = useState<HostContentModerationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HostContentModerationData | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await managerService.getPendingHostContents();
      setItems(
        data.filter((x) =>
          ['pending', 'pending_admin'].includes(String(x.hostContentStatus || '').toLowerCase()),
        ),
      );
    } catch (error) {
      console.error(error);
      const status =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response?.status === 'number'
          ? (error as any).response.status
          : null;
      const serverMessage =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response?.data?.error === 'string'
          ? (error as any).response.data.error
          : null;

      CustomAlert(
        'Lỗi',
        status
          ? `Không thể tải danh sách nội dung host chờ duyệt. (HTTP ${status})\nURL: ${API_BASE_URL}/manager/host-contents/pending${serverMessage ? `\n${serverMessage}` : ''}`
          : `Không thể tải danh sách nội dung host chờ duyệt.\nURL: ${API_BASE_URL}/manager/host-contents/pending${serverMessage ? `\n${serverMessage}` : ''}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (id: number) => {
    CustomAlert('Duyệt nội dung host', 'Bạn có muốn duyệt nội dung này không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Duyệt',
        onPress: async () => {
          try {
            await managerService.updateHostContentStatus(id, 'approved');
            setItems((current) => current.filter((p) => p.hostContentId !== id));
            CustomAlert('Thành công', 'Nội dung host đã được duyệt.');
          } catch (error) {
            CustomAlert('Lỗi', 'Không thể duyệt nội dung này.');
          }
        },
      },
    ]);
  };

  const handleReject = (item: HostContentModerationData) => {
    setSelected(item);
    setRejectModalVisible(true);
  };

  const onSubmitReject = async (reason: string) => {
    if (!selected) return;
    try {
      await managerService.updateHostContentStatus(selected.hostContentId, 'rejected', reason);
      setItems((current) => current.filter((p) => p.hostContentId !== selected.hostContentId));
      CustomAlert('Thành công', `Bài đăng đã bị từ chối.`);
    } catch (error) {
      const status =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response?.status === 'number'
          ? (error as any).response.status
          : null;
      const serverMessage =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response?.data?.error === 'string'
          ? (error as any).response.data.error
          : null;
      CustomAlert(
        'Lỗi',
        status
          ? `Không thể từ chối nội dung này. (HTTP ${status})${serverMessage ? `\n${serverMessage}` : ''}`
          : `Không thể từ chối nội dung này.${serverMessage ? `\n${serverMessage}` : ''}`,
      );
    }
  };

  const renderItem = ({ item }: { item: HostContentModerationData }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('HostContentModerationDetail', { hostContentId: item.hostContentId })}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <View style={styles.info}>
          <View style={styles.badgeContainer}>
            <View style={styles.pendingBadge}>
              <Clock size={12} color="#D97706" />
              <Text style={styles.pendingText}>Chờ duyệt</Text>
            </View>
            <Text style={styles.timeText}>
              {item.hostContentCreatedAt ? new Date(item.hostContentCreatedAt).toLocaleDateString('vi-VN') : 'Không có ngày'}
            </Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>{item.hostContentTitle}</Text>
          <Text style={styles.metaText} numberOfLines={1}>
            {item.authorName ? `Host: ${item.authorName}` : 'Không có thông tin host'}
          </Text>
        </View>
        <ChevronRight color="#CBD5E1" size={20} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, styles.rejectBtn]} onPress={() => handleReject(item)}>
          <X size={18} color="#EF4444" />
          <Text style={[styles.actionText, styles.rejectText]}>Từ chối</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.approveBtn]} onPress={() => handleApprove(item.hostContentId)}>
          <Check size={18} color="#22C55E" />
          <Text style={[styles.actionText, styles.approveText]}>Duyệt</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ManagerHeader
        title="Duyệt nội dung host"
        rightAction={
          <TouchableOpacity onPress={fetchItems} style={styles.headerActionButton}>
            <Clock size={20} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.hostContentId.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchItems}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CheckCircle2 size={64} color="#CBD5E1" strokeWidth={1} />
              <Text style={styles.emptyText}>Không có nội dung host nào đang chờ duyệt.</Text>
            </View>
          }
        />
      )}

      <ReasonModal
        visible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        onSubmit={onSubmitReject}
        title="Lý do từ chối"
        placeholder="Giải thích lý do từ chối nội dung host..."
        confirmLabel="Từ chối"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  info: { flex: 1 },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  pendingText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  timeText: { fontSize: 11, color: '#94A3B8' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 6 },
  metaText: { fontSize: 13, color: '#64748B', marginBottom: 4 },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  rejectBtn: { backgroundColor: '#FEF2F2' },
  approveBtn: { backgroundColor: '#F0FDF4' },
  actionText: { fontWeight: 'bold', fontSize: 14 },
  rejectText: { color: '#EF4444' },
  approveText: { color: '#22C55E' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#94A3B8', textAlign: 'center', width: '80%' },
});

export default HostContentModerationList;
