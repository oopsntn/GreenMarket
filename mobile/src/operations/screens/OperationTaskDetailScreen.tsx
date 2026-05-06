import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Send } from 'lucide-react-native';
import CustomAlert from '../../utils/AlertHelper';
import { OperationTaskDetailResponse, operationsService } from '../services/operationsService';

const STATUS_BAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleString('vi-VN');
};

const toTaskStatus = (value: string) => (value === 'closed' ? 'closed' : 'open');

const getStatusLabel = (value: string) => (value === 'closed' ? 'Đã đóng' : 'Mở');

const OperationTaskDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const taskId = Number(route.params?.taskId || 0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<OperationTaskDetailResponse | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const loadData = useCallback(async () => {
    if (!taskId) {
      return;
    }

    try {
      const response = await operationsService.getTaskDetail(taskId);
      setDetail(response);
    } catch {
      CustomAlert('Lỗi', 'Không tải được chi tiết task.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const normalizedStatus = toTaskStatus(String(detail?.task.taskStatus || 'open').toLowerCase());
  const isClosed = normalizedStatus === 'closed';
  const canSubmitReply = useMemo(
    () => !isClosed && replyMessage.trim().length > 0,
    [isClosed, replyMessage],
  );

  const handleSendReply = async () => {
    if (!taskId || !canSubmitReply || !detail) {
      return;
    }

    setSubmitting(true);
    try {
      const currentStatus = String(detail.task.taskStatus || 'open').toLowerCase();

      if (currentStatus === 'open') {
        await operationsService.updateTaskStatus(taskId, 'in_progress');
      }

      await operationsService.createTaskReply(taskId, {
        message: replyMessage.trim(),
        visibility: 'public',
      });

      if (currentStatus !== 'closed') {
        await operationsService.updateTaskStatus(taskId, 'closed');
      }

      setReplyMessage('');
      await loadData();
      CustomAlert('Thành công', 'Đã gửi phản hồi và đóng task.');
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
            'Không gửi được phản hồi.'
          : 'Không gửi được phản hồi.';

      CustomAlert('Lỗi', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !detail) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#fff" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết công việc</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <View style={styles.summaryTop}>
            <Text style={styles.customerName}>
              Khách hàng: {detail.task.customerName || 'Khách hàng'}
            </Text>
            <View style={[styles.statusPill, isClosed && styles.statusPillClosed]}>
              <Text style={[styles.statusText, isClosed && styles.statusTextClosed]}>
                {getStatusLabel(normalizedStatus)}
              </Text>
            </View>
          </View>
          <Text style={styles.taskMeta}>Thời gian gửi: {formatDateTime(detail.task.createdAt)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nội dung từ khách hàng</Text>
          <Text style={styles.taskNote}>{detail.task.taskNote || 'Không có nội dung.'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Phản hồi</Text>

          {isClosed ? (
            <View style={styles.closedNotice}>
              <Text style={styles.closedNoticeText}>
                Task đã đóng nên không thể gửi thêm phản hồi.
              </Text>
            </View>
          ) : (
            <>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nhập phản hồi cho task"
                multiline
                textAlignVertical="top"
                value={replyMessage}
                onChangeText={setReplyMessage}
                editable={!submitting}
              />

              <TouchableOpacity
                style={[styles.submitBtn, (!canSubmitReply || submitting) && styles.disabledBtn]}
                onPress={handleSendReply}
                disabled={!canSubmitReply || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View style={styles.sendWrap}>
                    <Send size={15} color="white" />
                    <Text style={styles.submitText}>Gửi phản hồi</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}

          <View style={styles.divider} />

          {detail.replies.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có phản hồi.</Text>
          ) : (
            detail.replies.map((reply) => (
              <View key={reply.replyId} style={styles.timelineItem}>
                <View style={styles.timelineTop}>
                  <Text style={styles.timelineAuthor}>{reply.senderName || 'Unknown'}</Text>
                  <Text style={styles.timelineTime}>{formatDateTime(reply.createdAt)}</Text>
                </View>
                <Text style={styles.timelineMessage}>{reply.message}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 16,
    paddingTop: 12 + STATUS_BAR_OFFSET,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 38,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: 'white',
    padding: 12,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  customerName: {
    flex: 1,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  statusPill: {
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
    borderColor: '#86EFAC',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillClosed: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  statusText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextClosed: {
    color: '#1D4ED8',
  },
  taskMeta: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  taskNote: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 20,
  },
  closedNotice: {
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  closedNoticeText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 90,
    paddingTop: 10,
  },
  submitBtn: {
    marginTop: 10,
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  sendWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
  },
  timelineItem: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 10,
  },
  timelineTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  timelineAuthor: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  timelineMessage: {
    marginTop: 4,
    color: '#334155',
    fontSize: 12,
    lineHeight: 18,
  },
  timelineTime: {
    color: '#94A3B8',
    fontSize: 11,
  },
});

export default OperationTaskDetailScreen;
