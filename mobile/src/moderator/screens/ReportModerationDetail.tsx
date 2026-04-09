import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { 
  ArrowLeft, 
  Flag, 
  User, 
  MessageSquare, 
  ShieldAlert,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react-native';
import ReasonModal from '../components/ReasonModal';
import ModeratorService, { ReportModerationData } from '../services/ModeratorService';
import CustomAlert from '../../utils/AlertHelper';

const ReportModerationDetail = ({ route, navigation }: any) => {
  const { reportId } = route.params;
  const [report, setReport] = useState<ReportModerationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'resolved' | 'dismissed' | null>(null);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await ModeratorService.getReportById(reportId);
      setReport(data);
    } catch (error) {
      console.error(error);
      CustomAlert('Error', 'Could not fetch report details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (type: 'resolved' | 'dismissed') => {
    setActionType(type);
    setIsModalVisible(true);
  };

  const onSubmitNote = async (note: string) => {
    if (actionType) {
      try {
        await ModeratorService.resolveReport(reportId, actionType, note);
        CustomAlert(
          actionType === 'resolved' ? 'Resolved' : 'Dismissed',
          `Note saved: ${note}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } catch (error) {
        CustomAlert('Error', 'Could not process report');
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF4444" />
      </View>
    );
  }

  if (!report) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color="#1E293B" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusSection}>
          <View style={styles.statusBadge}>
            <ShieldAlert size={16} color="#EF4444" />
            <Text style={styles.statusText}>{report.reportStatus}</Text>
          </View>
          <Text style={styles.createdAt}>{new Date(report.reportCreatedAt).toLocaleString()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Reporter</Text>
          <View style={styles.infoBox}>
            <User size={20} color="#64748B" />
            <Text style={styles.infoText}>{report.reporterDisplayName}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Reported Content</Text>
          <TouchableOpacity 
            style={styles.targetBox}
            onPress={() => {
              if (report.postId) navigation.navigate('PostModerationDetail', { postId: report.postId });
              else if (report.reportShopId) navigation.navigate('ShopModerationDetail', { shopId: report.reportShopId });
            }}
          >
            <View style={styles.targetInfo}>
              <Text style={styles.targetType}>{report.postId ? 'Post' : 'Shop'}</Text>
              <Text style={styles.targetTitle}>{report.postTitle || report.shopName || 'Unknown Title'}</Text>
            </View>
            <ExternalLink size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Reason for Report</Text>
          <View style={styles.reasonBox}>
            <Flag size={20} color="#EF4444" style={{ marginTop: 2 }} />
            <Text style={styles.reasonText}>{report.reportReason || report.reportNote}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Admin Note</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{report.adminNote || 'No notes yet'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Case History</Text>
          <View style={styles.chatPlaceholder}>
            <MessageSquare size={32} color="#CBD5E1" />
            <Text style={styles.placeholderText}>No interactions with parties yet</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={[styles.btn, styles.dismissBtn]}
          onPress={() => handleAction('dismissed')}
        >
          <XCircle size={20} color="#64748B" />
          <Text style={styles.dismissBtnText}>Dismiss Report</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, styles.resolveBtn]}
          onPress={() => handleAction('resolved')}
        >
          <CheckCircle size={20} color="white" />
          <Text style={styles.resolveBtnText}>Resolve</Text>
        </TouchableOpacity>
      </View>

      <ReasonModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={onSubmitNote}
        title={actionType === 'resolved' ? 'Resolve Report' : 'Dismiss Report'}
        placeholder="Enter processing notes (will be saved in logs)..."
        confirmLabel={actionType === 'resolved' ? 'Confirm Resolve' : 'Confirm Dismiss'}
        confirmColor={actionType === 'resolved' ? '#22C55E' : '#94A3B8'}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  createdAt: {
    fontSize: 12,
    color: '#94A3B8',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  targetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  targetInfo: {
    flex: 1,
  },
  targetType: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  targetTitle: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: 'bold',
  },
  reasonBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reasonText: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
  },
  chatPlaceholder: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 12,
  },
  placeholderText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dismissBtn: {
    backgroundColor: '#F1F5F9',
  },
  dismissBtnText: {
    color: '#475569',
    fontWeight: 'bold',
  },
  resolveBtn: {
    backgroundColor: '#22C55E',
  },
  resolveBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ReportModerationDetail;
