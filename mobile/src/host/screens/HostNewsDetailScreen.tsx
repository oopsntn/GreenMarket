import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { ArrowLeft, CalendarDays, ExternalLink, Store, ShoppingBag, Trash2, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { hostService, HostContentDetail } from '../services/hostService';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import { useAuth } from '../../context/AuthContext';
import CustomAlert from '../../utils/AlertHelper';

type BodySegment =
  | {
      type: 'text';
      value: string;
    }
  | {
      type: 'image';
      value: string;
    };

const IMAGE_MARKDOWN_PATTERN = /!\[[^\]]*\]\(([^)]+)\)/g;

const formatDateTime = (iso: string | null) => {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

const parseContentBodySegments = (rawValue: string | null | undefined): BodySegment[] => {
  const source = typeof rawValue === 'string' ? rawValue.trim() : '';
  if (!source) {
    return [];
  }

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

const HostNewsDetailScreen = ({ route }: any) => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { hostContentId } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<HostContentDetail | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        let res;
        if (user?.businessRoleCode === 'HOST') {
          res = await hostService.getContentDetail(hostContentId);
        } else {
          res = await hostService.getPublicContentDetail(hostContentId);
        }
        setContent(res);
      } catch (e: any) {
        const msg =
          typeof e === 'object' &&
          e &&
          typeof e?.response?.data?.error === 'string'
            ? e.response.data.error
            : 'Không thể tải chi tiết tin tức.';
        setError(msg);
        setContent(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [hostContentId]);

  const coverImage = useMemo(() => {
    const first = content?.hostContentMediaUrls?.[0];
    return first ? resolveImageUrl(first) : null;
  }, [content?.hostContentMediaUrls]);

  const bodySegments = useMemo(
    () => parseContentBodySegments(content?.hostContentBody),
    [content?.hostContentBody],
  );

  const canDeleteOwnContent =
    user?.businessRoleCode === 'HOST' &&
    Number(content?.authorId) > 0 &&
    Number(content?.authorId) === Number(user?.id);

  const handleDeleteContent = () => {
    if (!content?.hostContentId || deleting || !canDeleteOwnContent) {
      return;
    }

    CustomAlert(
      'Xóa bài đăng',
      'Bạn có chắc muốn xóa bài đăng tin tức này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await hostService.deleteContent(content.hostContentId);
              CustomAlert('Thành công', 'Bài đăng đã được xóa.', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (e: any) {
              const message =
                typeof e === 'object' &&
                e &&
                typeof e?.response?.data?.error === 'string'
                  ? e.response.data.error
                  : 'Không thể xóa bài đăng.';
              CustomAlert('Lỗi', message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const openLinkedTarget = () => {
    if (!content) return;
    if (content.hostContentTargetType === 'post' && content.target?.postSlug) {
      navigation.navigate('Marketplace', {
        screen: 'PostDetail',
        params: { slug: content.target.postSlug },
      });
      return;
    }

    if (content.hostContentTargetType === 'shop' && content.hostContentTargetId) {
      navigation.navigate('Marketplace', {
        screen: 'PublicShopDetail',
        params: { shopId: content.hostContentTargetId },
      });
      return;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Tin tức chi tiết</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      ) : error || !content ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Không tìm thấy bài viết.'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.cover} resizeMode="cover" />
          ) : null}

          <View style={styles.card}>
            <Text style={styles.title}>{content.hostContentTitle}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <User size={14} color="#64748B" />
                <Text style={styles.metaText}>{content.authorName || 'Host'}</Text>
              </View>
              <View style={styles.metaItem}>
                <CalendarDays size={14} color="#64748B" />
                <Text style={styles.metaText}>{formatDateTime(content.hostContentCreatedAt)}</Text>
              </View>
            </View>

            {content.hostContentDescription ? (
              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>{content.hostContentDescription}</Text>
              </View>
            ) : null}

            <View style={styles.bodySection}>
              {bodySegments.length === 0 ? (
                <Text style={styles.bodyText}>Nội dung bài viết đang được cập nhật...</Text>
              ) : (
                bodySegments.map((segment, index) => {
                  if (segment.type === 'image') {
                    return (
                      <View key={`body-segment-${index}`} style={styles.bodyImageWrap}>
                        <Image
                          source={{ uri: resolveImageUrl(segment.value) }}
                          style={styles.bodyImage}
                          resizeMode="cover"
                        />
                      </View>
                    );
                  }

                  return (
                    <Text key={`body-segment-${index}`} style={styles.bodyText}>
                      {segment.value}
                    </Text>
                  );
                })
              )}
            </View>

            {canDeleteOwnContent ? (
              <TouchableOpacity
                style={[styles.deleteBtn, deleting ? styles.deleteBtnDisabled : null]}
                onPress={handleDeleteContent}
                disabled={deleting}
                activeOpacity={0.85}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Trash2 size={16} color="white" />
                )}
                <Text style={styles.deleteBtnText}>{deleting ? 'Đang xóa...' : 'Xóa bài đăng'}</Text>
              </TouchableOpacity>
            ) : null}

            {(content.hostContentTargetType === 'post' || content.hostContentTargetType === 'shop') ? (
              <TouchableOpacity style={styles.targetBtn} onPress={openLinkedTarget} activeOpacity={0.8}>
                {content.hostContentTargetType === 'post' ? (
                  <ShoppingBag size={16} color="#065F46" />
                ) : (
                  <Store size={16} color="#065F46" />
                )}
                <Text style={styles.targetBtnText}>Xem nội dung được gợi ý</Text>
                <ExternalLink size={16} color="#065F46" />
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const STATUS_BAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  errorText: { color: '#B91C1C', fontWeight: '700', textAlign: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2e7d32',
    paddingHorizontal: 16,
    paddingTop: 14 + STATUS_BAR_OFFSET,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: 'white', flex: 1, textAlign: 'center' },
  scroll: { paddingBottom: 24 },
  cover: { width: '100%', height: 220, backgroundColor: '#E2E8F0' },
  card: {
    marginTop: -18,
    marginHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  title: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 10, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#64748B', fontWeight: '700', fontSize: 12 },
  descriptionBox: {
    marginTop: 12,
    backgroundColor: '#ECFDF5',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  descriptionText: { color: '#065F46', fontWeight: '700', lineHeight: 20 },
  bodySection: {
    marginTop: 12,
    gap: 12,
  },
  bodyText: {
    color: '#0F172A',
    fontWeight: '600',
    lineHeight: 22,
  },
  bodyImageWrap: {
    marginVertical: 2,
  },
  bodyImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  deleteBtn: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteBtnDisabled: {
    opacity: 0.7,
  },
  deleteBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 13,
  },
  targetBtn: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  targetBtnText: { flex: 1, textAlign: 'center', color: '#065F46', fontWeight: '900', fontSize: 12 },
});

export default HostNewsDetailScreen;

