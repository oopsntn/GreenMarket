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
import { ArrowLeft, CornerDownRight, Flag, Send } from 'lucide-react-native';
import CustomAlert from '../../utils/AlertHelper';
import {
  OperationTaskDetailResponse,
  OperationTaskPriority,
  OperationTaskStatus,
  ReplyVisibility,
  operationsService,
} from '../services/operationsService';

const STATUS_OPTIONS: OperationTaskStatus[] = ['open', 'in_progress', 'closed'];
const PRIORITY_OPTIONS: OperationTaskPriority[] = ['low', 'medium', 'high', 'critical'];

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

const toTaskStatus = (value: string): OperationTaskStatus => {
  if (value === 'in_progress' || value === 'closed') {
    return value;
  }

  return 'open';
};

const OperationTaskDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const taskId = Number(route.params?.taskId || 0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<OperationTaskDetailResponse | null>(null);

  const [statusDraft, setStatusDraft] = useState<OperationTaskStatus>('open');
  const [statusNote, setStatusNote] = useState('');

  const [replyMessage, setReplyMessage] = useState('');
  const [replyVisibility, setReplyVisibility] = useState<ReplyVisibility>('internal');

  const [escalateReason, setEscalateReason] = useState('');
  const [escalateTarget, setEscalateTarget] = useState<'MANAGER' | 'ADMIN'>('MANAGER');
  const [escalatePriority, setEscalatePriority] = useState<OperationTaskPriority>('medium');

  const loadData = useCallback(async () => {
    if (!taskId) {
      return;
    }

    try {
      const response = await operationsService.getTaskDetail(taskId);
      setDetail(response);
      setStatusDraft(toTaskStatus(response.task.taskStatus || 'open'));
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

  const canSubmitReply = useMemo(() => replyMessage.trim().length > 0, [replyMessage]);
  const canEscalate = useMemo(() => escalateReason.trim().length > 0, [escalateReason]);

  const handleUpdateStatus = async () => {
    if (!taskId) {
      return;
    }

    setSubmitting(true);
    try {
      await operationsService.updateTaskStatus(taskId, statusDraft, statusNote.trim() || undefined);

      if (statusNote.trim()) {
        await operationsService.createTaskReply(taskId, {
          message: statusNote.trim(),
          visibility: 'internal',
        });
      }

      setStatusNote('');
      await loadData();
      CustomAlert('Thành công', 'Đã cập nhật trạng thái task.');
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
            'Không thể cập nhật trạng thái task.'
          : 'Không thể cập nhật trạng thái task.';

      CustomAlert('Lỗi', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!taskId || !canSubmitReply) {
      return;
    }

    setSubmitting(true);
    try {
      await operationsService.createTaskReply(taskId, {
        message: replyMessage.trim(),
        visibility: replyVisibility,
      });

      setReplyMessage('');
      await loadData();
    } catch {
      CustomAlert('Lỗi', 'Không gửi được phản hồi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async () => {
    if (!taskId || !canEscalate) {
      return;
    }

    setSubmitting(true);
    try {
      await operationsService.escalateTask(taskId, {
        reason: escalateReason.trim(),
        targetRole: escalateTarget,
        priority: escalatePriority,
      });

      setEscalateReason('');
      await loadData();
      CustomAlert('Thành công', 'Đã gửi escalation.');
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
            'Không thể escalate task.'
          : 'Không thể escalate task.';

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
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <Text style={styles.customerName}>Khách hàng: {detail.task.customerName || 'Khách hàng'}</Text>
          <Text style={styles.taskMeta}>Thời gian gửi: {formatDateTime(detail.task.createdAt)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nội dung từ khách hàng</Text>
          <Text style={styles.taskNote}>{detail.task.taskNote || 'Không có nội dung.'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Cập nhật trạng thái</Text>

          <View style={styles.optionRow}>
            {STATUS_OPTIONS.map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.optionBtn, statusDraft === status && styles.optionBtnActive]}
                onPress={() => setStatusDraft(status)}
              >
                <Text style={[styles.optionText, statusDraft === status && styles.optionTextActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ghi chú nội bộ khi đổi trạng thái (tuỳ chọn)"
            multiline
            textAlignVertical="top"
            value={statusNote}
            onChangeText={setStatusNote}
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.disabledBtn]}
            onPress={handleUpdateStatus}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>Cập nhật trạng thái</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Timeline phản hồi</Text>

          <View style={styles.optionRow}>
            {(['internal', 'public'] as ReplyVisibility[]).map((visibility) => (
              <TouchableOpacity
                key={visibility}
                style={[
                  styles.optionBtn,
                  replyVisibility === visibility && styles.optionBtnActive,
                ]}
                onPress={() => setReplyVisibility(visibility)}
              >
                <Text
                  style={[
                    styles.optionText,
                    replyVisibility === visibility && styles.optionTextActive,
                  ]}
                >
                  {visibility}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Nhập phản hồi cho task"
            multiline
            textAlignVertical="top"
            value={replyMessage}
            onChangeText={setReplyMessage}
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

          <View style={styles.divider} />

          {detail.replies.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có phản hồi.</Text>
          ) : (
            detail.replies.map((reply) => (
              <View key={reply.replyId} style={styles.timelineItem}>
                <View style={styles.timelineTop}>
                  <Text style={styles.timelineAuthor}>{reply.senderName || 'Unknown'}</Text>
                  <Text style={styles.timelineVisibility}>{reply.visibility}</Text>
                </View>
                <Text style={styles.timelineMessage}>{reply.message}</Text>
                <Text style={styles.timelineTime}>{formatDateTime(reply.createdAt)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Escalation</Text>

          <Text style={styles.fieldLabel}>Target role</Text>
          <View style={styles.optionRow}>
            {(['MANAGER', 'ADMIN'] as const).map((target) => (
              <TouchableOpacity
                key={target}
                style={[styles.optionBtn, escalateTarget === target && styles.optionBtnActive]}
                onPress={() => setEscalateTarget(target)}
              >
                <Text style={[styles.optionText, escalateTarget === target && styles.optionTextActive]}>
                  {target}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Priority</Text>
          <View style={styles.optionRow}>
            {PRIORITY_OPTIONS.map((priority) => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.optionBtn,
                  escalatePriority === priority && styles.optionBtnActive,
                ]}
                onPress={() => setEscalatePriority(priority)}
              >
                <Text
                  style={[
                    styles.optionText,
                    escalatePriority === priority && styles.optionTextActive,
                  ]}
                >
                  {priority}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Nhập lý do escalation"
            multiline
            textAlignVertical="top"
            value={escalateReason}
            onChangeText={setEscalateReason}
          />

          <TouchableOpacity
            style={[styles.escalateBtn, (!canEscalate || submitting) && styles.disabledBtn]}
            onPress={handleEscalate}
            disabled={!canEscalate || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <View style={styles.sendWrap}>
                <Flag size={15} color="white" />
                <Text style={styles.submitText}>Escalate task</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Lịch sử escalation</Text>

          {detail.escalations.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có escalation.</Text>
          ) : (
            detail.escalations.map((item) => (
              <View key={item.escalationId} style={styles.timelineItem}>
                <View style={styles.timelineTop}>
                  <Text style={styles.timelineAuthor}>{item.targetType}</Text>
                  <Text style={styles.timelineVisibility}>{item.severity}</Text>
                </View>
                <Text style={styles.timelineMessage}>{item.reason}</Text>
                <Text style={styles.timelineTime}>{formatDateTime(item.createdAt)}</Text>
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
  customerName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  taskTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  taskMeta: {
    marginTop: 5,
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
  fieldLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  optionBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
  },
  optionBtnActive: {
    borderColor: '#22C55E',
    backgroundColor: '#DCFCE7',
  },
  optionText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  optionTextActive: {
    color: '#166534',
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
  escalateBtn: {
    marginTop: 10,
    backgroundColor: '#DC2626',
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
  timelineVisibility: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timelineMessage: {
    marginTop: 4,
    color: '#334155',
    fontSize: 12,
    lineHeight: 18,
  },
  timelineTime: {
    marginTop: 4,
    color: '#94A3B8',
    fontSize: 11,
  },
});

export default OperationTaskDetailScreen;
