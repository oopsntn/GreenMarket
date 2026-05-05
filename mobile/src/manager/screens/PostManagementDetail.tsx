import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertCircle, Calendar, Check, Clock3, EyeOff, User, X, Store, Phone, MapPin, Maximize2 } from 'lucide-react-native';
import ReasonModal from '../components/ReasonModal';
import managerService, { PostModerationData } from '../services/ManagerService';
import { postService } from '../../components/post/service/postService';
import { MediaGallery } from '../../components/post/components/MediaGallery';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import CustomAlert from '../../utils/AlertHelper';
import ManagerHeader from '../components/ManagerHeader';

const normalizeMediaUrl = (raw: unknown): string => {
  if (!raw) return '';
  if (typeof raw === 'string') return resolveImageUrl(raw);
  if (typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    const url =
      (typeof record.imageUrl === 'string' && record.imageUrl) ||
      (typeof record.videoUrl === 'string' && record.videoUrl) ||
      (typeof record.url === 'string' && record.url) ||
      '';
    return resolveImageUrl(url);
  }
  return resolveImageUrl(String(raw));
};

const statusLabelMap: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
  hidden: 'Đã ẩn',
};

const priorityMap: Record<string, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  critical: 'Khẩn cấp',
};

const PostManagementDetail = ({ route, navigation }: any) => {
  const { postId } = route.params;
  const [post, setPost] = useState<PostModerationData | null>(null);
  const [fullPost, setFullPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'reject' | 'hide' | null>(null);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const data = await managerService.getPostById(postId);
      setPost(data);

      try {
        const fullData = await postService.getPostDetail(postId);
        setFullPost(fullData);
      } catch (err) {
        console.error("Could not fetch full post detail", err);
      }
    } catch (error) {
      console.error(error);
      CustomAlert('Lỗi', 'Không thể tải chi tiết bài đăng.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    CustomAlert('Duyệt bài đăng', 'Bạn có muốn duyệt bài đăng này không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Duyệt',
        onPress: async () => {
          try {
            await managerService.updatePostStatus(postId, 'approved');
            CustomAlert('Thành công', 'Bài đăng đã được duyệt.');
            navigation.goBack();
          } catch (error) {
            CustomAlert('Lỗi', 'Không thể duyệt bài đăng này.');
          }
        },
      },
    ]);
  };

  const onSubmitModal = async (reason: string) => {
    try {
      if (modalType === 'reject') {
        await managerService.updatePostStatus(postId, 'rejected', reason);
        CustomAlert('Đã từ chối', `Đã lưu lý do: ${reason}`);
      } else if (modalType === 'hide') {
        await managerService.deletePost(postId, reason);
        CustomAlert('Đã ẩn bài', `Bài đăng đã được ẩn.\nLý do: ${reason}`);
      }
      navigation.goBack();
    } catch (error) {
      CustomAlert('Lỗi', 'Không thể thực hiện thao tác này.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  if (!post) return null;

  return (
    <View style={styles.container}>
      <ManagerHeader title="Chi tiết bài đăng" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <Clock3 size={14} color="#D97706" />
              <Text style={styles.statusText}>{statusLabelMap[post.postStatus] || post.postStatus}</Text>
            </View>
            <Text style={styles.priorityText}>Độ ưu tiên: {priorityMap[post.priority] || post.priority}</Text>
          </View>
          <Text style={styles.title}>{post.postTitle}</Text>
          <Text style={styles.subtitle}>{post.summary || 'Không có mô tả bổ sung.'}</Text>
        </View>

        {fullPost && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nội dung bài đăng</Text>

            <View style={{ marginBottom: 16, marginHorizontal: -20 }}>
              <MediaGallery media={[
                ...(fullPost?.images || []).map((i: any) => ({ type: 'image', url: normalizeMediaUrl(i) })),
                ...(fullPost?.videos || []).map((v: any) => ({ type: 'video', url: normalizeMediaUrl(v) })),
              ]} />
            </View>

            {fullPost?.attributes && fullPost.attributes.length > 0 && (
              <View style={styles.infoCard}>
                <View style={[styles.infoRow, { marginBottom: 4 }]}>
                  <Maximize2 size={18} color="#64748B" />
                  <Text style={[styles.infoLabel, { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginBottom: 0 }]}>Thông số kỹ thuật</Text>
                </View>
                <View style={styles.attrGrid}>
                  {fullPost.attributes.map((attr: any, index: number) => (
                    <View key={index} style={styles.attrItem}>
                      <Text style={styles.attrLabel}>{attr.name}</Text>
                      <Text style={styles.attrValue}>{attr.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={[styles.infoCard, { marginTop: 12 }]}>
              <View style={styles.infoRow}>
                <Store size={18} color="#64748B" />
                <View>
                  <Text style={styles.infoLabel}>Cửa hàng / Người bán</Text>
                  <Text style={styles.infoValue}>{fullPost?.shop?.shopName || fullPost?.postContactName || 'Chưa cập nhật'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Phone size={18} color="#64748B" />
                <View>
                  <Text style={styles.infoLabel}>Số điện thoại</Text>
                  <Text style={styles.infoValue}>{fullPost?.shop?.shopPhone || fullPost?.postContactPhone || 'Chưa cập nhật'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <MapPin size={18} color="#64748B" />
                <View>
                  <Text style={styles.infoLabel}>Vị trí</Text>
                  <Text style={styles.infoValue}>{fullPost?.shop?.shopLocation || fullPost?.postLocation || 'Chưa cập nhật'}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ngữ cảnh kiểm duyệt</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <User size={18} color="#64748B" />
              <View>
                <Text style={styles.infoLabel}>Tác giả</Text>
                <Text style={styles.infoValue}>{post.authorName || 'Chưa rõ tác giả'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Calendar size={18} color="#64748B" />
              <View>
                <Text style={styles.infoLabel}>Ngày tạo</Text>
                <Text style={styles.infoValue}>
                  {post.postCreatedAt ? new Date(post.postCreatedAt).toLocaleString('vi-VN') : 'Không có'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Calendar size={18} color="#64748B" />
              <View>
                <Text style={styles.infoLabel}>Ngày cập nhật</Text>
                <Text style={styles.infoValue}>
                  {post.postUpdatedAt ? new Date(post.postUpdatedAt).toLocaleString('vi-VN') : 'Không có'}
                </Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      <View style={styles.moderationBar}>
        <TouchableOpacity style={[styles.modButton, styles.hideBtn]} onPress={() => setModalType('hide')}>
          <EyeOff size={22} color="#EF4444" />
          <Text style={[styles.modText, { color: '#EF4444' }]}>Ẩn bài</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.modButton, styles.rejectBtn]} onPress={() => setModalType('reject')}>
          <X size={22} color="#F59E0B" />
          <Text style={[styles.modText, { color: '#F59E0B' }]}>Gỡ bài đăng</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.modButton, styles.approveBtn]} onPress={handleApprove}>
          <Check size={22} color="white" />
          <Text style={[styles.modText, { color: 'white' }]}>Giữ bài</Text>
        </TouchableOpacity>
      </View>

      <ReasonModal
        visible={!!modalType}
        onClose={() => setModalType(null)}
        onSubmit={onSubmitModal}
        title={modalType === 'reject' ? 'Lý do từ chối' : 'Lý do ẩn bài'}
        placeholder={modalType === 'reject' ? 'Giải thích lý do từ chối bài đăng...' : 'Giải thích lý do ẩn bài đăng...'}
        confirmLabel={modalType === 'reject' ? 'Từ chối bài' : 'Ẩn bài'}
        confirmColor={modalType === 'reject' ? '#F59E0B' : '#EF4444'}
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
  statusText: { fontSize: 12, fontWeight: '700', color: '#D97706' },
  priorityText: { fontSize: 12, color: '#475569' },
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
  infoLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#1E293B', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },
  attrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  attrItem: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
  },
  attrLabel: { fontSize: 11, color: '#64748B', marginBottom: 2 },
  attrValue: { fontSize: 13, color: '#1E293B', fontWeight: '600' },
  warningBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  warningText: { flex: 1, color: '#475569', lineHeight: 20 },
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
  hideBtn: { backgroundColor: '#FEF2F2' },
  rejectBtn: { backgroundColor: '#FFFBEB' },
  approveBtn: { backgroundColor: '#22C55E' },
  modText: { fontWeight: '700', fontSize: 14 },
});

export default PostManagementDetail;
