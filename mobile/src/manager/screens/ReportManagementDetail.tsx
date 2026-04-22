import React, { useEffect, useState } from 'react';
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
  ExternalLink,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react-native';
import ReasonModal from '../components/ReasonModal';
import managerService, { ReportModerationData } from '../services/ManagerService';
import CustomAlert from '../../utils/AlertHelper';

const ReportManagementDetail = ({ route, navigation }: any) => {
  const { reportId } = route.params;
  const [report, setReport] = useState<ReportModerationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'resolved' | 'dismissed' | 'escalated' | null>(null);
  const [postAction, setPostAction] = useState<'approved' | 'rejected' | null>(null);
  const [processingPost, setProcessingPost] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await managerService.getReportById(reportId);
      setReport(data);
    } catch (error) {
      console.error(error);
      CustomAlert('Lỗi', 'Không thể tải chi tiết báo cáo.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (type: 'resolved' | 'dismissed' | 'escalated') => {
    setActionType(type);
    setIsModalVisible(true);
  };

  // Xử lý bài đăng bị báo cáo trực tiếp (duyệt hoặc từ chối)
  const handleModeratePost = (action: 'approved' | 'rejected') => {
    if (!report?.postId) {
      CustomAlert('Lỗi', 'Báo cáo này không liên kết với bài đăng nào.');
      return;
    }
    setPostAction(action);
    setIsModalVisible(true);
    setActionType(null); // Đảm bảo modal biết đây là luồng post, không phải report
  };
  const onSubmitNote = async (note: string) => {
    if (!actionType && !postAction) return;

    try {
      // Luồng 1: Kiểm duyệt bài đăng bị báo cáo
      if (postAction && report?.postId) {
        setProcessingPost(true);
        await managerService.updatePostStatus(report.postId, postAction, note || undefined);
        // Sau khi xử lý bài, auto-resolve report
        await managerService.resolveReport(
          reportId,
          'resolved',
          `Bài đăng đã được ${postAction === 'approved' ? 'duyệt' : 'từ chối'} bởi quản lý`,
          note
        );
        CustomAlert(
          'Hoàn tất',
          `Bài đăng đã được ${postAction === 'approved' ? '✅ duyệt' : '❌ từ chối'} và báo cáo đã được giải quyết.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // Luồng 2: Xử lý report (resolve/dismiss/escalate)
      if (actionType === 'escalated') {
        await managerService.escalate({
          targetType: 'report',
          targetId: reportId,
          severity: 'high',
          reason: note
        });
        CustomAlert('Escalated', `Report đã được leo thang. Lý do: ${note}`);
      } else if (actionType) {
        await managerService.resolveReport(
          reportId,
          actionType,
          actionType === 'resolved' ? 'Report reviewed and resolved' : 'Report reviewed and dismissed',
          note
        );
        CustomAlert(
          actionType === 'resolved' ? 'Giải quyết' : 'Bỏ qua',
          `Đã lưu với ghi chú: ${note}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      CustomAlert('Lỗi', 'Không thể xử lý báo cáo này.');
    } finally {
      setProcessingPost(false);
      setPostAction(null);
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
          <Text style={styles.createdAt}>{report.reportCreatedAt ? new Date(report.reportCreatedAt).toLocaleString() : 'Không có ngày'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Người báo cáo</Text>
          <View style={styles.infoBox}>
            <User size={20} color="#64748B" />
            <Text style={styles.infoText}>{report.reporterDisplayName || 'Người báo cáo không xác định'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tin/Cửa hàng bị báo cáo</Text>
          <TouchableOpacity
            style={styles.targetBox}
            onPress={() => {
              if (report.postId) navigation.navigate('PostManagementDetail', { postId: report.postId });
              else if (report.reportShopId) navigation.navigate('ShopManagementDetail', { shopId: report.reportShopId });
            }}
          >
            <View style={styles.targetInfo}>
              <Text style={styles.targetType}>{report.postId ? 'Tin đăng' : 'Cửa hàng'}</Text>
              <Text style={styles.targetTitle}>{report.postTitle || report.shopName || 'Mục tiêu không xác định'}</Text>
            </View>
            <ExternalLink size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Lý do báo cáo</Text>
          <View style={styles.reasonBox}>
            <Flag size={20} color="#EF4444" style={{ marginTop: 2 }} />
            <Text style={styles.reasonText}>{report.reportReason || report.reportReasonCode || 'Không có lý do'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Ghi chú từ người báo cáo</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{report.reportNote || 'Không có ghi chú'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Ghi chú quản lý</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{report.adminNote || 'Chưa có ghi chú quản lý'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Ngữ cảnh xử lý</Text>
          <View style={styles.chatPlaceholder}>
            <MessageSquare size={32} color="#CBD5E1" />
            <Text style={styles.placeholderText}>Độ nghiêm trọng: {report.severity || 'medium'}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        {/* Nếu report liên kết với bài đăng: hiện nút duyệt/từ chối bài trực tiếp */}
        {report?.postId ? (
          <>
            <TouchableOpacity
              style={[styles.btn, styles.rejectPostBtn]}
              disabled={processingPost}
              onPress={() => handleModeratePost('rejected')}
            >
              <ThumbsDown size={18} color="#EF4444" />
              <Text style={[styles.btnText, { color: '#EF4444' }]}>Từ chối bài</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.approvePostBtn]}
              disabled={processingPost}
              onPress={() => handleModeratePost('approved')}
            >
              <ThumbsUp size={18} color="white" />
              <Text style={[styles.btnText, styles.approveBtnText]}>Duyệt bài</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.dismissBtn]}
              onPress={() => handleAction('dismissed')}
            >
              <XCircle size={18} color="#64748B" />
              <Text style={[styles.btnText, styles.dismissBtnText]}>Bỏ qua BC</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={[styles.btn, styles.dismissBtn]} onPress={() => handleAction('dismissed')}>
              <XCircle size={20} color="#64748B" />
              <Text style={[styles.btnText, styles.dismissBtnText]}>Bỏ qua</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.escalateBtn]} onPress={() => handleAction('escalated')}>
              <Flag size={20} color="white" />
              <Text style={[styles.btnText, styles.escalateBtnText]}>Leo thang</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.resolveBtn]} onPress={() => handleAction('resolved')}>
              <CheckCircle size={20} color="white" />
              <Text style={[styles.btnText, styles.resolveBtnText]}>Giải quyết</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <ReasonModal
        visible={isModalVisible}
        onClose={() => { setIsModalVisible(false); setPostAction(null); }}
        onSubmit={onSubmitNote}
        title={
          postAction === 'approved' ? 'Duyệt bài đăng' :
          postAction === 'rejected' ? 'Từ chối bài đăng' :
          actionType === 'resolved' ? 'Giải quyết báo cáo' :
          actionType === 'escalated' ? 'Leo thang báo cáo' : 'Bỏ qua báo cáo'
        }
        placeholder={
          postAction ? 'Nhập lý do kiểm duyệt (tùy chọn)...' :
          actionType === 'escalated' ? 'Nhập lý do leo thang...' : 'Nhập ghi chú xử lý...'
        }
        confirmLabel={
          postAction === 'approved' ? 'Xác nhận duyệt' :
          postAction === 'rejected' ? 'Xác nhận từ chối' :
          actionType === 'resolved' ? 'Giải quyết' :
          actionType === 'escalated' ? 'Leo thang' : 'Bỏ qua'
        }
        confirmColor={
          postAction === 'approved' ? '#22C55E' :
          postAction === 'rejected' ? '#EF4444' :
          actionType === 'resolved' ? '#22C55E' :
          actionType === 'escalated' ? '#F59E0B' : '#94A3B8'
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  statusSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: { fontSize: 13, fontWeight: 'bold', color: '#EF4444', textTransform: 'capitalize' },
  createdAt: { fontSize: 12, color: '#94A3B8' },
  section: { marginBottom: 24 },
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
  infoText: { fontSize: 16, color: '#1E293B', fontWeight: '500', flex: 1 },
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
  targetInfo: { flex: 1 },
  targetType: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  targetTitle: { fontSize: 16, color: '#1E293B', fontWeight: 'bold' },
  reasonBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reasonText: { flex: 1, fontSize: 15, color: '#1E293B', lineHeight: 22 },
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
  placeholderText: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnText: { fontWeight: '700' },
  dismissBtn: { backgroundColor: '#F1F5F9' },
  dismissBtnText: { color: '#64748B' },
  escalateBtn: { backgroundColor: '#F59E0B' },
  escalateBtnText: { color: 'white' },
  resolveBtn: { backgroundColor: '#22C55E' },
  resolveBtnText: { color: 'white' },
  rejectPostBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  approvePostBtn: { backgroundColor: '#22C55E' },
  approveBtnText: { color: 'white' },
});

export default ReportManagementDetail;
