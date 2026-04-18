import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowLeft, Calendar, Check, Clock3, User, X } from 'lucide-react-native';
import ReasonModal from '../components/ReasonModal';
import managerService, { HostContentModerationData } from '../services/ManagerService';
import CustomAlert from '../../utils/AlertHelper';

const HostContentModerationDetail = ({ route, navigation }: any) => {
  const { hostContentId } = route.params;
  const [item, setItem] = useState<HostContentModerationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'reject' | null>(null);

  useEffect(() => {
    fetchDetail();
  }, [hostContentId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await managerService.getHostContentById(hostContentId);
      setItem(data);
    } catch (error) {
      console.error(error);
      CustomAlert('Lỗi', 'Không thể tải chi tiết nội dung host.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    CustomAlert('Duyệt nội dung', 'Bạn có muốn duyệt nội dung này không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Duyệt',
        onPress: async () => {
          try {
            await managerService.updateHostContentStatus(hostContentId, 'approved');
            CustomAlert('Thành công', 'Nội dung host đã được duyệt.');
            navigation.goBack();
          } catch (error) {
            CustomAlert('Lỗi', 'Không thể duyệt nội dung này.');
          }
        },
      },
    ]);
  };

  const onSubmitReject = async (reason: string) => {
    try {
      await managerService.updateHostContentStatus(hostContentId, 'rejected', reason);
      CustomAlert('Từ chối', `Lý do đã lưu: ${reason}`);
      navigation.goBack();
    } catch (error) {
      CustomAlert('Lỗi', 'Không thể từ chối nội dung này.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  if (!item) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#1E293B" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết nội dung Host</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <Clock3 size={14} color="#D97706" />
              <Text style={styles.statusText}>{String(item.hostContentStatus || 'pending')}</Text>
            </View>
          </View>

          <Text style={styles.title}>{item.hostContentTitle}</Text>
          <Text style={styles.subtitle}>{item.hostContentDescription || '(Không có mô tả)'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ngữ cảnh</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <User size={18} color="#64748B" />
              <View>
                <Text style={styles.infoLabel}>Host</Text>
                <Text style={styles.infoValue}>{item.authorName || 'Chưa rõ'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Calendar size={18} color="#64748B" />
              <View>
                <Text style={styles.infoLabel}>Ngày tạo</Text>
                <Text style={styles.infoValue}>
                  {item.hostContentCreatedAt ? new Date(item.hostContentCreatedAt).toLocaleString() : 'Không có'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.moderationBar}>
        <TouchableOpacity style={[styles.modButton, styles.rejectBtn]} onPress={() => setModalType('reject')}>
          <X size={22} color="#F59E0B" />
          <Text style={[styles.modText, { color: '#F59E0B' }]}>Từ chối</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.modButton, styles.approveBtn]} onPress={handleApprove}>
          <Check size={22} color="white" />
          <Text style={[styles.modText, { color: 'white' }]}>Duyệt</Text>
        </TouchableOpacity>
      </View>

      <ReasonModal
        visible={!!modalType}
        onClose={() => setModalType(null)}
        onSubmit={onSubmitReject}
        title="Lý do từ chối"
        placeholder="Giải thích lý do từ chối nội dung host..."
        confirmLabel="Từ chối"
        confirmColor="#F59E0B"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  contentContainer: { padding: 20, paddingBottom: 100 },
  heroCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: { fontSize: 12, fontWeight: '700', color: '#D97706', textTransform: 'capitalize' },
  title: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#475569', lineHeight: 22 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#1E293B', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },
  moderationBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 84,
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  rejectBtn: { backgroundColor: '#FFFBEB' },
  approveBtn: { backgroundColor: '#22C55E' },
  modText: { fontWeight: '700', fontSize: 14 },
});

export default HostContentModerationDetail;

