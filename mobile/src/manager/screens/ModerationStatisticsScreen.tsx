import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart3, Clock3, ShieldAlert, TrendingUp } from 'lucide-react-native';
import managerService, { ManagerStatisticsData } from '../services/ManagerService';
import CustomAlert from '../../utils/AlertHelper';
import ManagerHeader from '../components/ManagerHeader';

const labelMap: Record<string, string> = {
  post_status_updated: 'Cập nhật trạng thái bài đăng',
  shop_status_updated: 'Cập nhật trạng thái cửa hàng',
  report_resolved: 'Xử lý báo cáo',
  feedback_sent: 'Gửi phản hồi',
  escalation_created: 'Tạo leo thang',
};

const severityMap: Record<string, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  critical: 'Khẩn cấp',
};

const ModerationStatisticsScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState<ManagerStatisticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const data = await managerService.getStatistics();
      setStats(data);
    } catch (error) {
      console.error(error);
      CustomAlert('Lỗi', 'Không thể tải thống kê kiểm duyệt.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#166534" />
      </View>
    );
  }

  const kpi = stats?.kpi;
  const actionsByType = stats?.charts?.actionsByType ?? [];
  const actionsByDay = stats?.charts?.actionsByDay ?? [];
  const severityBreakdown = stats?.charts?.severityBreakdown ?? [];

  return (
    <View style={styles.container}>
      <ManagerHeader
        title="Thống kê kiểm duyệt"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.headerActionButton} onPress={fetchStatistics}>
            <BarChart3 size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroTitleRow}>
            <TrendingUp size={20} color="#166534" />
            <Text style={styles.heroTitle}>Khối lượng hiện tại</Text>
          </View>
          <Text style={styles.heroValue}>{kpi?.openQueueItems ?? 0}</Text>
          <Text style={styles.heroSubtitle}>Tổng mục đang mở trong hàng đợi kiểm duyệt</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{kpi?.pendingPosts ?? 0}</Text>
            <Text style={styles.statLabel}>Bài đăng chờ duyệt</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{kpi?.pendingShops ?? 0}</Text>
            <Text style={styles.statLabel}>Cửa hàng chờ duyệt</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{kpi?.pendingReports ?? 0}</Text>
            <Text style={styles.statLabel}>Báo cáo chờ xử lý</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{kpi?.totalActions ?? 0}</Text>
            <Text style={styles.statLabel}>Tổng hành động</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thống kê theo loại hành động</Text>
          {actionsByType.map((item) => (
            <View key={item.actionType} style={styles.rowCard}>
              <Text style={styles.rowLabel}>{labelMap[item.actionType] || item.actionType}</Text>
              <Text style={styles.rowValue}>{item.count}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phân bố mức độ ưu tiên</Text>
          {severityBreakdown.map((item) => (
            <View key={item.severity} style={styles.rowCard}>
              <View style={styles.rowLeft}>
                <ShieldAlert size={16} color="#F59E0B" />
                <Text style={styles.rowLabel}>{severityMap[item.severity] || item.severity}</Text>
              </View>
              <Text style={styles.rowValue}>{item.count}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Xu hướng khối lượng công việc</Text>
          {actionsByDay.length ? (
            actionsByDay.map((item) => (
              <View key={item.date} style={styles.dayCard}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayTitle}>{item.date}</Text>
                  <Text style={styles.daySubtitle}>
                    Bài đăng {item.postStatusUpdates} • Cửa hàng {item.shopStatusUpdates} • Báo cáo {item.reportResolved}
                  </Text>
                </View>
                <View style={styles.dayCountWrap}>
                  <Clock3 size={16} color="#166534" />
                  <Text style={styles.dayCount}>{item.totalActions}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Chưa có dữ liệu xu hướng theo ngày.</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  content: { padding: 16, paddingBottom: 32 },
  heroCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  heroTitle: { fontSize: 16, fontWeight: '700', color: '#166534' },
  heroValue: { fontSize: 36, fontWeight: '800', color: '#052E16', marginBottom: 6 },
  heroSubtitle: { color: '#166534' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#64748B' },
  section: { marginTop: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  rowCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { color: '#334155', fontWeight: '600', flex: 1 },
  rowValue: { fontSize: 18, fontWeight: '800', color: '#166534' },
  dayCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayInfo: { flex: 1, marginRight: 12 },
  dayTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  daySubtitle: { fontSize: 12, color: '#64748B' },
  dayCountWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dayCount: { fontSize: 18, fontWeight: '800', color: '#166534' },
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: { color: '#64748B' },
});

export default ModerationStatisticsScreen;
