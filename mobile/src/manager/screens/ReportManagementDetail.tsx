import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CheckCircle,
  EyeOff,
  ExternalLink,
  Flag,
  Image as ImageIcon,
  MessageSquare,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  User,
  XCircle,
} from 'lucide-react-native';
import ReasonModal from '../components/ReasonModal';
import managerService, { ReportModerationData } from '../services/ManagerService';
import CustomAlert from '../../utils/AlertHelper';
import ManagerHeader from '../components/ManagerHeader';
import { MediaGallery } from '../../components/post/components/MediaGallery';

const statusLabelMap: Record<string, string> = {
  pending: 'Chờ xử lý',
  resolved: 'Đã giải quyết',
  dismissed: 'Đã bỏ qua',
};

const severityLabelMap: Record<string, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  critical: 'Khẩn cấp',
};

const ReportManagementDetail = ({ route, navigation }: any) => {
  const { reportId } = route.params;
  const [report, setReport] = useState<ReportModerationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'resolved' | 'dismissed' | 'escalated' | null>(null);
  const [postAction, setPostAction] = useState<'approved' | 'rejected' | 'hidden' | null>(null);
  const [processingPost, setProcessingPost] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await managerService.getReportById(reportId);
      if (__DEV__) {
        console.log('[ReportManagementDetail] report payload', data);
      }
      setReport(data);
    } catch (error) {
      console.error(error);
      CustomAlert('Thông báo', 'Không thể tải chi tiết báo cáo.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (type: 'resolved' | 'dismissed' | 'escalated') => {
    setActionType(type);
    setIsModalVisible(true);
  };

  const handleModeratePost = (action: 'approved' | 'rejected' | 'hidden') => {
    if (!report?.postId) {
      CustomAlert('Thông báo', 'Báo cáo này không liên kết với bài đăng nào.');
      return;
    }

    setPostAction(action);
    setActionType(null);
    setIsModalVisible(true);
  };

  const sendFeedbackToReporter = async (message: string) => {
    if (!report?.reporterId) return;

    try {
      await managerService.moderationFeedback({
        targetType: 'report',
        targetId: report.reportId,
        recipientUserId: report.reporterId,
        message,
      });
    } catch (error) {
      console.warn('[Report] moderationFeedback failed (non-critical):', error);
    }
  };

  const onSubmitNote = async (note: string) => {
    if (!actionType && !postAction) return;

    try {
      if (postAction && report?.postId) {
        setProcessingPost(true);

        await managerService.updatePostStatus(report.postId, postAction, note || undefined);
        await managerService.resolveReport(
          reportId,
          'resolved',
          `Bài đăng đã được ${postAction === 'approved' ? 'duyệt' : postAction === 'hidden' ? 'ẩn' : 'từ chối'
          } bởi quản lý`,
          note,
        );

        const postActionLabel =
          postAction === 'approved' ? 'duyệt' : postAction === 'hidden' ? 'ẩn' : 'từ chối';

        await sendFeedbackToReporter(
          `Báo cáo của bạn đối với bài đăng "${report.postTitle || ''}" đã được xử lý. Bài đăng đã được ${postActionLabel}.${note ? ` Ghi chú: ${note}` : ''}`,
        );

        CustomAlert(
          'Hoàn tất',
          `Bài đăng đã được ${postActionLabel} và báo cáo đã được giải quyết.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
        return;
      }

      if (actionType === 'escalated') {
        await managerService.escalate({
          targetType: 'report',
          targetId: reportId,
          severity: 'high',
          reason: note,
        });
        CustomAlert('Đã leo thang', `Báo cáo đã được chuyển cấp xử lý.\nLý do: ${note}`);
      } else if (actionType) {
        await managerService.resolveReport(
          reportId,
          actionType,
          actionType === 'resolved'
            ? 'Báo cáo đã được xem xét và giải quyết'
            : 'Báo cáo đã được xem xét và bỏ qua',
          note,
        );

        if (actionType === 'resolved') {
          await sendFeedbackToReporter(
            `Báo cáo của bạn đã được giải quyết.${note ? ` Ghi chú của quản lý: ${note}` : ''}`,
          );
        } else if (actionType === 'dismissed') {
          await sendFeedbackToReporter(
            `Báo cáo của bạn đã được xem xét nhưng không được chấp nhận.${note ? ` Ghi chú: ${note}` : ''}`,
          );
        }

        CustomAlert(
          actionType === 'resolved' ? 'Đã giải quyết' : 'Đã bỏ qua',
          `Đã lưu ghi chú xử lý: ${note}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      }
    } catch (error) {
      CustomAlert('Thông báo', 'Không thể xử lý báo cáo này.');
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

  const reporterLabel =
    (typeof report.reporterDisplayName === 'string' && report.reporterDisplayName.trim()) ||
    (report.reporterId ? `Người dùng #${report.reporterId}` : 'Người báo cáo không xác định');
  const evidenceMedia = (report.evidenceUrls || [])
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
    .map((url) => ({ type: 'image', url }));

  return (
    <View style={styles.container}>
      <ManagerHeader title="Chi tiết báo cáo" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusSection}>
          <View style={styles.statusBadge}>
            <ShieldAlert size={16} color="#EF4444" />
            <Text style={styles.statusText}>{statusLabelMap[report.reportStatus] || report.reportStatus}</Text>
          </View>
          <Text style={styles.createdAt}>
            {report.reportCreatedAt ? new Date(report.reportCreatedAt).toLocaleString('vi-VN') : 'Không có ngày'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Người báo cáo</Text>
          <View style={styles.infoBox}>
            <User size={20} color="#64748B" />
            <Text style={styles.infoText}>{reporterLabel}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Mục bị báo cáo</Text>
          <TouchableOpacity
            style={styles.targetBox}
            onPress={() => {
              if (report.postId) navigation.navigate('PostManagementDetail', { postId: report.postId });
              else if (report.reportShopId) navigation.navigate('ShopManagementDetail', { shopId: report.reportShopId });
            }}
          >
            <View style={styles.targetInfo}>
              <Text style={styles.targetType}>{report.postId ? 'Bài đăng' : 'Cửa hàng'}</Text>
              <Text style={styles.targetTitle}>
                {report.postTitle || report.shopName || 'Mục tiêu không xác định'}
              </Text>
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
          <Text style={styles.label}>Ảnh chứng cứ</Text>
          {evidenceMedia.length > 0 ? (
            <View style={styles.evidenceGallery}>
              <MediaGallery media={evidenceMedia} />
            </View>
          ) : (
            <View style={styles.emptyEvidenceBox}>
              <ImageIcon size={20} color="#94A3B8" />
              <Text style={styles.emptyEvidenceText}>
                Báo cáo này chưa có ảnh chứng cứ.
              </Text>
            </View>
          )}
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
            <Text style={styles.placeholderText}>
              Mức độ nghiêm trọng: {severityLabelMap[report.severity || 'medium'] || report.severity || 'Trung bình'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        {report.postId ? (
          <>
            {/* <TouchableOpacity
              style={[styles.btn, styles.rejectPostBtn]}
              disabled={processingPost}
              onPress={() => handleModeratePost('rejected')}
            >
              <ThumbsDown size={16} color="#EF4444" />
              <Text style={[styles.btnText, { color: '#EF4444', fontSize: 11 }]}>Từ chối</Text>
            </TouchableOpacity> */}

            <TouchableOpacity
              style={[styles.btn, styles.hidePostBtn]}
              disabled={processingPost}
              onPress={() => handleModeratePost('hidden')}
            >
              <EyeOff size={16} color="#F59E0B" />
              <Text style={[styles.btnText, { color: '#F59E0B', fontSize: 11 }]}>Ẩn bài</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.approvePostBtn]}
              disabled={processingPost}
              onPress={() => handleModeratePost('approved')}
            >
              <ThumbsUp size={16} color="white" />
              <Text style={[styles.btnText, styles.approveBtnText, { fontSize: 11 }]}>Duyệt báo cáo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.dismissBtn]} onPress={() => handleAction('dismissed')}>
              <XCircle size={16} color="#64748B" />
              <Text style={[styles.btnText, styles.dismissBtnText, { fontSize: 11 }]}>Bỏ qua</Text>
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
        onClose={() => {
          setIsModalVisible(false);
          setPostAction(null);
        }}
        onSubmit={onSubmitNote}
        title={
          postAction === 'approved'
            ? 'Duyệt bài đăng'
            : postAction === 'hidden'
              ? 'Ẩn bài đăng'
              : postAction === 'rejected'
                ? 'Từ chối bài đăng'
                : actionType === 'resolved'
                  ? 'Giải quyết báo cáo'
                  : actionType === 'escalated'
                    ? 'Leo thang báo cáo'
                    : 'Bỏ qua báo cáo'
        }
        placeholder={
          postAction
            ? 'Nhập ghi chú xử lý cho bài đăng...'
            : actionType === 'escalated'
              ? 'Nhập lý do leo thang...'
              : 'Nhập ghi chú xử lý...'
        }
        confirmLabel={
          postAction === 'approved'
            ? 'Xác nhận duyệt'
            : postAction === 'hidden'
              ? 'Xác nhận ẩn bài'
              : postAction === 'rejected'
                ? 'Xác nhận từ chối'
                : actionType === 'resolved'
                  ? 'Giải quyết'
                  : actionType === 'escalated'
                    ? 'Leo thang'
                    : 'Bỏ qua'
        }
        confirmColor={
          postAction === 'approved'
            ? '#22C55E'
            : postAction === 'hidden'
              ? '#F59E0B'
              : postAction === 'rejected'
                ? '#EF4444'
                : actionType === 'resolved'
                  ? '#22C55E'
                  : actionType === 'escalated'
                    ? '#F59E0B'
                    : '#94A3B8'
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 100 },
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
  statusText: { fontSize: 13, fontWeight: 'bold', color: '#EF4444' },
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
  infoText: { flex: 1, fontSize: 16, color: '#1E293B', fontWeight: '500' },
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
  targetInfo: { flex: 1, marginRight: 12 },
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
  evidenceGallery: { marginHorizontal: -20 },
  emptyEvidenceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyEvidenceText: { flex: 1, fontSize: 14, color: '#64748B', lineHeight: 20 },
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
    minHeight: 80,
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  btnText: { fontWeight: '700', textAlign: 'center' },
  dismissBtn: { backgroundColor: '#F1F5F9' },
  dismissBtnText: { color: '#64748B' },
  escalateBtn: { backgroundColor: '#F59E0B' },
  escalateBtnText: { color: 'white' },
  resolveBtn: { backgroundColor: '#22C55E' },
  resolveBtnText: { color: 'white' },
  hidePostBtn: { backgroundColor: '#FEF9C3', borderWidth: 1, borderColor: '#FDE68A' },
  rejectPostBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  approvePostBtn: { backgroundColor: '#22C55E' },
  approveBtnText: { color: 'white' },
});

export default ReportManagementDetail;
