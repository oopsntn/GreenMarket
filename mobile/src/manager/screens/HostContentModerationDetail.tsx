import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, Check, Clock3, Image as ImageIcon, User, X } from 'lucide-react-native';
import ReasonModal from '../components/ReasonModal';
import managerService, { HostContentModerationData } from '../services/ManagerService';
import CustomAlert from '../../utils/AlertHelper';
import ManagerHeader from '../components/ManagerHeader';
import { resolveImageUrl } from '../../utils/resolveImageUrl';

type BodySegment =
  | { type: 'text'; value: string }
  | { type: 'image'; value: string };

const IMAGE_MARKDOWN_PATTERN = /!\[[^\]]*\]\(([^)]+)\)/g;

const normalizeMediaUrls = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const parseContentBodySegments = (rawValue: string | null | undefined): BodySegment[] => {
  const source = typeof rawValue === 'string' ? rawValue.trim() : '';
  if (!source) return [];

  const segments: BodySegment[] = [];
  let lastIndex = 0;

  for (const match of source.matchAll(IMAGE_MARKDOWN_PATTERN)) {
    const matchedText = match[0] || '';
    const imageUrl = (match[1] || '').trim();
    const startIndex = match.index ?? 0;

    if (startIndex > lastIndex) {
      const textBlock = source.slice(lastIndex, startIndex).trim();
      if (textBlock) {
        segments.push({ type: 'text', value: textBlock });
      }
    }

    if (imageUrl) {
      segments.push({ type: 'image', value: imageUrl });
    }

    lastIndex = startIndex + matchedText.length;
  }

  if (lastIndex < source.length) {
    const textBlock = source.slice(lastIndex).trim();
    if (textBlock) {
      segments.push({ type: 'text', value: textBlock });
    }
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', value: source });
  }

  return segments;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Không có';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Không có';
  return parsed.toLocaleString('vi-VN');
};

const HostContentModerationDetail = ({ route, navigation }: any) => {
  const { hostContentId } = route.params;
  const [item, setItem] = useState<HostContentModerationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'reject' | null>(null);

  useEffect(() => {
    fetchDetail();
  }, [hostContentId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await managerService.getHostContentById(hostContentId);
      setItem(data);
    } catch (error) {
      console.error(error);
      CustomAlert('Lỗi', 'Không thể tải chi tiết nội dung host.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const mediaUrls = useMemo(() => normalizeMediaUrls(item?.hostContentMediaUrls), [item?.hostContentMediaUrls]);
  const bodySegments = useMemo(() => parseContentBodySegments(item?.hostContentBody), [item?.hostContentBody]);

  const handleApprove = () => {
    CustomAlert('Duyệt nội dung', 'Bạn có muốn duyệt nội dung này không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Duyệt',
        onPress: async () => {
          try {
            await managerService.updateHostContentStatus(hostContentId, 'approved');
            CustomAlert('Thành công', `Nội dung "${item?.hostContentTitle || 'Host content'}" đã được duyệt.`);
            navigation.goBack();
          } catch (error) {
            CustomAlert('Lỗi', 'Không thể duyệt nội dung này.');
          }
        },
      },
    ]);
  };

  const onSubmitReject = async (reason: string) => {
    try {
      await managerService.updateHostContentStatus(hostContentId, 'rejected', reason);
      CustomAlert('Từ chối', `Nội dung "${item?.hostContentTitle || 'Host content'}" đã bị từ chối.`);
      navigation.goBack();
    } catch (error) {
      CustomAlert('Lỗi', 'Không thể từ chối nội dung này.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  if (!item) return null;

  return (
    <View style={styles.container}>
      <ManagerHeader title="Chi tiết nội dung tin tức" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <Clock3 size={14} color="#D97706" />
              <Text style={styles.statusText}>{String(item.hostContentStatus || 'pending')}</Text>
            </View>
          </View>

          <Text style={styles.title}>{item.hostContentTitle}</Text>
          <Text style={styles.subtitle}>{item.hostContentDescription || '(Không có mô tả)'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <User size={18} color="#64748B" />
              <View style={styles.infoBody}>
                <Text style={styles.infoLabel}>Host</Text>
                <Text style={styles.infoValue}>{item.authorName || 'Chưa rõ'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Calendar size={18} color="#64748B" />
              <View style={styles.infoBody}>
                <Text style={styles.infoLabel}>Ngày tạo</Text>
                <Text style={styles.infoValue}>{formatDateTime(item.hostContentCreatedAt)}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Calendar size={18} color="#64748B" />
              <View style={styles.infoBody}>
                <Text style={styles.infoLabel}>Cập nhật gần nhất</Text>
                <Text style={styles.infoValue}>{formatDateTime(item.hostContentUpdatedAt)}</Text>
              </View>
            </View>
          </View>
        </View>

        {mediaUrls.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ảnh bìa</Text>
            <View style={styles.mediaGrid}>
              {mediaUrls.map((url, index) => (
                <Image
                  key={`${url}-${index}`}
                  source={{ uri: resolveImageUrl(url) }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nội dung chi tiết</Text>
          <View style={styles.bodyCard}>
            {bodySegments.length === 0 ? (
              <View style={styles.emptyBody}>
                <ImageIcon size={20} color="#94A3B8" />
                <Text style={styles.emptyBodyText}>Chưa có nội dung chi tiết.</Text>
              </View>
            ) : (
              bodySegments.map((segment, index) => {
                if (segment.type === 'image') {
                  return (
                    <Image
                      key={`body-image-${index}`}
                      source={{ uri: resolveImageUrl(segment.value) }}
                      style={styles.bodyImage}
                      resizeMode="cover"
                    />
                  );
                }

                return (
                  <Text key={`body-text-${index}`} style={styles.bodyText}>
                    {segment.value}
                  </Text>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.moderationBar}>
        <TouchableOpacity style={[styles.modButton, styles.rejectBtn]} onPress={() => setModalType('reject')}>
          <X size={22} color="#F59E0B" />
          <Text style={[styles.modText, { color: '#F59E0B' }]}>Từ chối</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.modButton, styles.approveBtn]} onPress={handleApprove}>
          <Check size={22} color="white" />
          <Text style={[styles.modText, { color: 'white' }]}>Duyệt</Text>
        </TouchableOpacity>
      </View>

      <ReasonModal
        visible={!!modalType}
        onClose={() => setModalType(null)}
        onSubmit={onSubmitReject}
        title="Lý do từ chối"
        placeholder="Giải thích lý do từ chối nội dung host..."
        confirmLabel="Từ chối"
        confirmColor="#F59E0B"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentContainer: { padding: 20, paddingBottom: 100 },
  heroCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: { fontSize: 12, fontWeight: '700', color: '#D97706', textTransform: 'capitalize' },
  title: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#475569', lineHeight: 22 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoBody: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#1E293B', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },
  mediaGrid: {
    gap: 12,
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  bodyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  emptyBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyBodyText: {
    fontSize: 14,
    color: '#64748B',
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#334155',
  },
  bodyImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  moderationBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 84,
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  rejectBtn: { backgroundColor: '#FFFBEB' },
  approveBtn: { backgroundColor: '#22C55E' },
  modText: { fontWeight: '700', fontSize: 14 },
});

export default HostContentModerationDetail;
