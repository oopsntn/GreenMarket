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
import ManagerService, { ReportModerationData } from '../services/ManagerService';
import CustomAlert from '../../utils/AlertHelper';

const ReportManagementDetail = ({ route, navigation }: any) => {
  const { reportId } = route.params;
  const [report, setReport] = useState<ReportModerationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'resolved' | 'dismissed' | 'escalated' | null>(null);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await ManagerService.getReportById(reportId);
      setReport(data);
    } catch (error) {
      console.error(error);
      CustomAlert('Lỗi', 'Không thể tải chi tiết báo cáo');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (type: 'resolved' | 'dismissed' | 'escalated') => {
    setActionType(type);
    setIsModalVisible(true);
  };

  const onSubmitNote = async (note: string) => {
    if (actionType) {
      try {
        if (actionType === 'escalated') {
          await ManagerService.escalate({
              targetType: 'report',
              targetId: reportId,
              severity: 'high',
              reason: note
          });
        } else {
          await ManagerService.resolveReport(reportId, actionType, 'Fixed', note);
        }
        CustomAlert(
          actionType === 'resolved' ? 'Đã giải quyết' : actionType === 'escalated' ? 'Đã chuyển tiếp' : 'Đã bỏ qua',
          actionType === 'escalated' ? `Đã chuyển tiếp kèm lý do: ${note}` : `Đã lưu ghi chú: ${note}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } catch (error) {
        CustomAlert('Lỗi', 'Không thể xử lý báo cáo');
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
        <Text style={styles.headerTitle}>Chi tiết báo cáo</Text>
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
          <Text style={styles.label}>Người báo cáo</Text>
          <View style={styles.infoBox}>
            <User size={20} color="#64748B" />
            <Text style={styles.infoText}>{report.reporterDisplayName}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Nội dung bị báo cáo</Text>
          <TouchableOpacity 
            style={styles.targetBox}
            onPress={() => {
              if (report.postId) navigation.navigate('PostManagementDetail', { postId: report.postId });
              else if (report.reportShopId) navigation.navigate('ShopManagementDetail', { shopId: report.reportShopId });
            }}
          >
            <View style={styles.targetInfo}>
              <Text style={styles.targetType}>{report.postId ? 'Tin đăng' : 'Cửa hàng'}</Text>
              <Text style={styles.targetTitle}>{report.postTitle || report.shopName || 'Không rõ tiêu đề'}</Text>
            </View>
            <ExternalLink size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Lý do báo cáo</Text>
          <View style={styles.reasonBox}>
            <Flag size={20} color="#EF4444" style={{ marginTop: 2 }} />
            <Text style={styles.reasonText}>{report.reportReason || report.reportNote}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Ghi chú của quản trị viên</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{report.adminNote || 'Chưa có ghi chú'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Lịch sử xử lý</Text>
          <View style={styles.chatPlaceholder}>
            <MessageSquare size={32} color="#CBD5E1" />
            <Text style={styles.placeholderText}>Chưa có tương tác nào với các bên liên quan</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={[styles.btn, styles.dismissBtn]}
          onPress={() => handleAction('dismissed')}
        >
          <XCircle size={20} color="#64748B" />
          <Text style={[styles.btnText, styles.dismissBtnText]}>Bỏ qua</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, styles.escalateBtn]}
          onPress={() => handleAction('escalated')}
        >
          <Flag size={20} color="white" />
          <Text style={[styles.btnText, styles.escalateBtnText]}>Chuyển tiếp</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, styles.resolveBtn]}
          onPress={() => handleAction('resolved')}
        >
          <CheckCircle size={20} color="white" />
          <Text style={[styles.btnText, styles.resolveBtnText]}>Giải quyết</Text>
        </TouchableOpacity>
      </View>

      <ReasonModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={onSubmitNote}
        title={actionType === 'resolved' ? 'Giải quyết báo cáo' : actionType === 'escalated' ? 'Chuyển tiếp báo cáo' : 'Bỏ qua báo cáo'}
        placeholder={actionType === 'escalated' ? 'Nhập lý do chuyển tiếp...' : 'Nhập ghi chú xử lý (sẽ được lưu vào hệ thống)...'}
        confirmLabel={actionType === 'resolved' ? 'Xác nhận giải quyết' : actionType === 'escalated' ? 'Xác nhận chuyển tiếp' : 'Xác nhận bỏ qua'}
        confirmColor={actionType === 'resolved' ? '#22C55E' : actionType === 'escalated' ? '#F59E0B' : '#94A3B8'}
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
  btnText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  dismissBtn: {
    backgroundColor: '#F1F5F9',
  },
  dismissBtnText: {
    color: '#475569',
  },
  escalateBtn: {
    backgroundColor: '#F59E0B',
  },
  escalateBtnText: {
    color: 'white',
  },
  resolveBtn: {
    backgroundColor: '#22C55E',
  },
  resolveBtnText: {
    color: 'white',
  },
});

export default ReportManagementDetail;
