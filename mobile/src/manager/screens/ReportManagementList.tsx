import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, CheckCircle2, ChevronRight, Flag, User } from 'lucide-react-native';
import managerService, { ReportModerationData } from '../services/ManagerService';
import CustomAlert from '../../utils/AlertHelper';
import ManagerHeader from '../components/ManagerHeader';

const severityColor = (value?: string) =>
  value === 'high' || value === 'critical' ? '#EF4444' : '#3B82F6';

const ReportManagementList = ({ navigation }: any) => {
  const [reports, setReports] = useState<ReportModerationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await managerService.getReports();
      setReports(data.filter((r) => r.reportStatus === 'pending'));
    } catch (error) {
      console.error(error);
      CustomAlert('Lỗi', 'Không thể tải danh sách báo cáo.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ReportModerationData }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ReportManagementDetail', { reportId: item.reportId })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.priorityIndicator, { backgroundColor: severityColor(item.severity) }]} />
        <View style={styles.reportInfo}>
          <View style={styles.reporteeRow}>
            <User size={14} color="#64748B" />
            <Text style={styles.reporteeName}>{item.reporterDisplayName || 'Người báo cáo không xác định'}</Text>
          </View>
          <Text style={styles.targetName} numberOfLines={1}>
            {item.postTitle ? `Bài đăng: ${item.postTitle}` : item.shopName ? `Cửa hàng: ${item.shopName}` : `Báo cáo #${item.reportId}`}
          </Text>
        </View>
        <ChevronRight color="#CBD5E1" size={20} />
      </View>

      <View style={styles.reasonContainer}>
        <Flag size={14} color="#EF4444" strokeWidth={2} />
        <Text style={styles.reasonText} numberOfLines={2}>
          {item.reportReason || item.reportReasonCode || 'Không có lý do'}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.timeRow}>
          <Calendar size={14} color="#94A3B8" />
          <Text style={styles.timeText}>
            {item.reportCreatedAt ? new Date(item.reportCreatedAt).toLocaleDateString('vi-VN') : 'Không có ngày'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.resolveBtn}
          onPress={() => navigation.navigate('ReportManagementDetail', { reportId: item.reportId })}
        >
          <Text style={styles.resolveBtnText}>Xem chi tiết</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ManagerHeader
        title="Quản lý báo cáo"
        rightAction={
          <TouchableOpacity onPress={fetchReports} style={styles.headerActionButton}>
            <Flag size={20} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderItem}
          keyExtractor={(item) => item.reportId.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchReports}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CheckCircle2 size={64} color="#22C55E" strokeWidth={1} />
              <Text style={styles.emptyText}>Tất cả báo cáo đã được xử lý.</Text>
            </View>
          }
        />
      )}
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
    overflow: 'hidden',
  },
  priorityIndicator: {
    position: 'absolute',
    left: -16,
    top: 0,
    bottom: 0,
    width: 6,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reportInfo: { flex: 1 },
  reporteeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  reporteeName: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  targetName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  reasonContainer: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  reasonText: { fontSize: 14, color: '#991B1B', flex: 1, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 12, color: '#94A3B8' },
  resolveBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resolveBtnText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#94A3B8', textAlign: 'center' },
});

export default ReportManagementList;
