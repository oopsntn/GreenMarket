import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertTriangle,
  ChevronRight,
  ClipboardCheck,
  Clock,
  History,
  LayoutDashboard,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import managerService from '../services/ManagerService';
import ManagerHeader from '../components/ManagerHeader';

const DashboardScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await managerService.getDashboardOverview();
      setStats(data.statCards ?? []);
      setSummary(data.summary ?? null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getIconForStat = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('bài')) return <ClipboardCheck color="#10B981" size={24} />;
    if (lowerTitle.includes('cửa')) return <Store color="#3B82F6" size={24} />;
    if (lowerTitle.includes('báo cáo')) return <AlertTriangle color="#EF4444" size={24} />;
    return <Users color="#8B5CF6" size={24} />;
  };

  if (loading && !stats.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ManagerHeader
        title="Bảng điều khiển"
        rightAction={
          <TouchableOpacity style={styles.headerActionButton}>
            <LayoutDashboard color="white" size={20} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchDashboardData} tintColor="#22C55E" />
        }
      >
        <View style={styles.content}>
          <View style={styles.mainStatsContainer}>
            <Text style={styles.summaryTitle}>{summary?.title || 'Tổng quan kiểm duyệt'}</Text>
            <Text style={styles.summaryDesc}>
              {summary?.description || 'Đang tải dữ liệu moderation mới nhất...'}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#F0F9FF' }]}>
                  {getIconForStat(stat.title)}
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.title}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Lối tắt công việc</Text>

          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Posts')}>
              <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                <ClipboardCheck color="#22C55E" size={24} />
              </View>
              <Text style={styles.actionLabel}>Kiểm duyệt bài đăng</Text>
              <ChevronRight color="#CBD5E1" size={18} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Shops')}>
              <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Store color="#3B82F6" size={24} />
              </View>
              <Text style={styles.actionLabel}>Kiểm duyệt cửa hàng</Text>
              <ChevronRight color="#CBD5E1" size={18} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Reports')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
                <AlertTriangle color="#EF4444" size={24} />
              </View>
              <Text style={styles.actionLabel}>Quản lý báo cáo</Text>
              <ChevronRight color="#CBD5E1" size={18} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('ModerationStatistics')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
                <TrendingUp color="#166534" size={24} />
              </View>
              <Text style={styles.actionLabel}>Thống kê kiểm duyệt</Text>
              <ChevronRight color="#CBD5E1" size={18} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('ModerationHistory')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F8FAFC' }]}>
                <History color="#475569" size={24} />
              </View>
              <Text style={styles.actionLabel}>Lịch sử thao tác</Text>
              <ChevronRight color="#CBD5E1" size={18} />
            </TouchableOpacity>
          </View>

          <View style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <TrendingUp size={18} color="#166534" />
              <Text style={styles.activityTitle}>Tóm tắt công việc</Text>
            </View>
            <View style={styles.activityRow}>
              <Clock size={16} color="#64748B" />
              <Text style={styles.activityText}>Bạn đang có các mục chờ xử lý trong hàng đợi moderation.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainStatsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 16,
  },
  summaryTitle: {
    color: '#166534',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryDesc: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
    marginLeft: 4,
  },
  quickActions: {
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  activityCard: {
    backgroundColor: '#F0FDF4',
    padding: 20,
    borderRadius: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#166534',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
});

export default DashboardScreen;
