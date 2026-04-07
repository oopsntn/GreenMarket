import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { 
  Flag, 
  User, 
  Calendar, 
  ChevronRight,
  CheckCircle2,
  Filter,
  Search
} from 'lucide-react-native';
import ModeratorService, { ReportModerationData } from '../services/ModeratorService';
import CustomAlert from '../../utils/AlertHelper';

const ReportModerationList = ({ navigation }: any) => {
  const [reports, setReports] = useState<ReportModerationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await ModeratorService.getReports();
      setReports(data.filter(r => r.reportStatus === 'pending'));
    } catch (error) {
      console.error(error);
      CustomAlert('Error', 'Could not fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      default: return '#3B82F6';
    }
  };

  const renderItem = ({ item }: { item: ReportModerationData }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ReportModerationDetail', { reportId: item.reportId })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor('low') }]} />
        <View style={styles.reportInfo}>
          <View style={styles.reporteeRow}>
            <User size={14} color="#64748B" />
            <Text style={styles.reporteeName}>{item.reporterDisplayName}</Text>
          </View>
          <Text style={styles.targetName} numberOfLines={1}>
            {item.postTitle ? `Post: ${item.postTitle}` : item.shopName ? `Shop: ${item.shopName}` : 'Unknown Target'}
          </Text>
        </View>
        <ChevronRight color="#CBD5E1" size={20} />
      </View>

      <View style={styles.reasonContainer}>
        <Flag size={14} color="#EF4444" strokeWidth={2} />
        <Text style={styles.reasonText} numberOfLines={2}>{item.reportReason}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.timeRow}>
          <Calendar size={14} color="#94A3B8" />
          <Text style={styles.timeText}>{new Date(item.reportCreatedAt).toLocaleDateString()}</Text>
        </View>
        <TouchableOpacity style={styles.resolveBtn} onPress={() => navigation.navigate('ReportModerationDetail', { reportId: item.reportId })}>
          <Text style={styles.resolveBtnText}>Process Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Reports Moderation</Text>
        <TouchableOpacity onPress={fetchReports} style={styles.iconCircle}>
          <Search size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderItem}
          keyExtractor={item => item.reportId.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchReports}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CheckCircle2 size={64} color="#22C55E" strokeWidth={1} />
              <Text style={styles.emptyText}>All reports have been resolved!</Text>
            </View>
          }
        />
      )}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reporteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reporteeName: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  targetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  reasonContainer: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  reasonText: {
    fontSize: 14,
    color: '#991B1B',
    flex: 1,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  resolveBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resolveBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

export default ReportModerationList;
