import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CalendarClock, Filter, History } from 'lucide-react-native';
import managerService, { ManagerHistoryEntry } from '../services/ManagerService';
import CustomAlert from '../../utils/AlertHelper';
import ManagerHeader from '../components/ManagerHeader';

const FILTERS = [
  { label: 'Tất cả', value: undefined },
  { label: 'Bài đăng', value: 'manager_post_status_updated' },
  { label: 'Cửa hàng', value: 'manager_shop_status_updated' },
  { label: 'Báo cáo', value: 'manager_report_resolved' },
  { label: 'Phản hồi', value: 'manager_feedback_sent' },
  { label: 'Leo thang', value: 'manager_escalation_created' },
];

const ACTION_LABELS: Record<string, string> = {
  manager_post_status_updated: 'Cập nhật trạng thái bài đăng',
  post_status_updated: 'Cập nhật trạng thái bài đăng',
  manager_shop_status_updated: 'Cập nhật trạng thái cửa hàng',
  shop_status_updated: 'Cập nhật trạng thái cửa hàng',
  manager_report_resolved: 'Xử lý báo cáo',
  report_resolved: 'Xử lý báo cáo',
  manager_feedback_sent: 'Gửi phản hồi kiểm duyệt',
  feedback_sent: 'Gửi phản hồi kiểm duyệt',
  manager_escalation_created: 'Tạo yêu cầu leo thang',
  escalation_created: 'Tạo yêu cầu leo thang',
};

const TARGET_LABELS: Record<string, string> = {
  post: 'Bài đăng',
  shop: 'Cửa hàng',
  report: 'Báo cáo',
  host_content: 'Nội dung host',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'chờ xử lý',
  approved: 'đã duyệt',
  rejected: 'bị từ chối',
  hidden: 'đã ẩn',
  resolved: 'đã giải quyết',
  dismissed: 'đã bỏ qua',
  active: 'đang hoạt động',
  blocked: 'bị chặn',
  closed: 'đã đóng',
};

const translateStatus = (value?: string | null) => {
  if (!value) return 'không rõ';
  return STATUS_LABELS[value] || value;
};

const formatActionLabel = (item: ManagerHistoryEntry) =>
  ACTION_LABELS[item.eventType] || ACTION_LABELS[item.actionType] || item.actionType || item.eventType;

const formatTargetLabel = (item: ManagerHistoryEntry) => {
  const targetType = item.target?.targetType || 'target';
  const targetId = item.target?.targetId || '-';
  return `${TARGET_LABELS[targetType] || targetType} #${targetId}`;
};

const formatMetaLines = (item: ManagerHistoryEntry) => {
  const meta = item.meta || {};
  const lines: string[] = [];
  const fromStatus = typeof meta.fromStatus === 'string' ? meta.fromStatus : null;
  const toStatus = typeof meta.toStatus === 'string' ? meta.toStatus : null;
  const reason = typeof meta.reason === 'string' ? meta.reason : null;
  const note = typeof meta.note === 'string' ? meta.note : null;
  const resolution = typeof meta.resolution === 'string' ? meta.resolution : null;
  const severity = typeof meta.severity === 'string' ? meta.severity : null;

  if (fromStatus || toStatus) {
    lines.push(
      `Trạng thái: ${translateStatus(fromStatus)} -> ${translateStatus(toStatus)}`
    );
  }

  if (resolution) {
    lines.push(`Kết luận: ${resolution}`);
  }

  if (reason) {
    lines.push(`Lý do: ${reason}`);
  }

  if (note) {
    lines.push(`Ghi chú: ${note}`);
  }

  if (severity) {
    lines.push(`Mức độ ưu tiên: ${severity}`);
  }

  if (!lines.length && Object.keys(meta).length) {
    lines.push(JSON.stringify(meta));
  }

  return lines;
};

const ModerationHistoryScreen = ({ navigation }: any) => {
  const [items, setItems] = useState<ManagerHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchHistory(filter);
  }, [filter]);

  const activeFilterLabel = useMemo(
    () => FILTERS.find((item) => item.value === filter)?.label || 'Tất cả',
    [filter],
  );

  const fetchHistory = async (actionType?: string) => {
    try {
      setLoading(true);
      const response = await managerService.getHistory({ actionType, limit: 50 });
      setItems(response.data);
    } catch (error) {
      console.error(error);
      CustomAlert('Lỗi', 'Không thể tải lịch sử kiểm duyệt.');
    } finally {
      setLoading(false);
    }
  };

  const renderFilter = ({ item }: { item: (typeof FILTERS)[number] }) => {
    const active = item.value === filter || (!item.value && !filter);
    return (
      <TouchableOpacity
        style={[styles.filterChip, active && styles.filterChipActive]}
        onPress={() => setFilter(item.value)}
      >
        <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: ManagerHistoryEntry }) => {
    const metaLines = formatMetaLines(item);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconWrap}>
            <History size={18} color="#166534" />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.actionTitle}>{formatActionLabel(item)}</Text>
            <Text style={styles.targetText}>{formatTargetLabel(item)}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <CalendarClock size={14} color="#94A3B8" />
          <Text style={styles.metaText}>
            {item.eventTime ? new Date(item.eventTime).toLocaleString('vi-VN') : 'Không có thời gian'}
          </Text>
        </View>

        <Text style={styles.actorText}>
          Người xử lý: {item.actor?.displayName || `Người dùng #${item.actor?.userId ?? '-'}`}
        </Text>

        {!!metaLines.length && (
          <View style={styles.metaBox}>
            {metaLines.map((line, index) => (
              <Text key={`${item.logId}-${index}`} style={styles.metaBoxText}>
                {line}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ManagerHeader
        title="Lịch sử kiểm duyệt"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.headerActionButton} onPress={() => fetchHistory(filter)}>
            <Filter size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <View style={styles.filterSection}>
        <FlatList
          data={FILTERS}
          keyExtractor={(item) => item.label}
          horizontal
          style={styles.filterBar}
          contentContainerStyle={styles.filterList}
          showsHorizontalScrollIndicator={false}
          renderItem={renderFilter}
        />
        <Text style={styles.filterHint}>Đang lọc: {activeFilterLabel}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#166534" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.logId.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onRefresh={() => fetchHistory(filter)}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <History size={56} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Chưa có lịch sử phù hợp</Text>
              <Text style={styles.emptyDescription}>Thử đổi bộ lọc hoặc tải lại dữ liệu.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSection: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
  },
  filterBar: {
    flexGrow: 0,
    maxHeight: 60,
  },
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  filterHint: {
    paddingHorizontal: 16,
    fontSize: 12,
    color: '#64748B',
  },
  filterChip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#166534',
  },
  filterText: { color: '#334155', fontWeight: '600' },
  filterTextActive: { color: 'white' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingTop: 12, paddingBottom: 24 },
  card: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardBody: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  targetText: { fontSize: 13, color: '#64748B' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  metaText: { fontSize: 12, color: '#64748B' },
  actorText: { fontSize: 13, color: '#334155', marginBottom: 8 },
  metaBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  metaBoxText: { fontSize: 12, color: '#475569', lineHeight: 18 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { marginTop: 16, fontSize: 16, fontWeight: '700', color: '#475569' },
  emptyDescription: { marginTop: 8, fontSize: 13, color: '#94A3B8' },
});

export default ModerationHistoryScreen;
