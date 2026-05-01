import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, CheckCircle2, ChevronRight, Clock, X } from 'lucide-react-native';
import ReasonModal from '../components/ReasonModal';
import managerService, { PostModerationData } from '../services/ManagerService';
import CustomAlert from '../../utils/AlertHelper';
import ManagerHeader from '../components/ManagerHeader';

const priorityMap: Record<string, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  critical: 'Khẩn cấp',
};

const PostManagementList = ({ navigation }: any) => {
  const [posts, setPosts] = useState<PostModerationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PostModerationData | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await managerService.getPosts();
      setPosts(data.filter((p) => p.postStatus === 'pending'));
    } catch (error) {
      console.error(error);
      const status =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response?.status === 'number'
          ? (error as any).response.status
          : null;
      CustomAlert(
        'Lỗi',
        status
          ? `Không thể tải danh sách bài đăng chờ duyệt. (HTTP ${status})`
          : 'Không thể tải danh sách bài đăng chờ duyệt.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (id: number) => {
    CustomAlert('Duyệt bài đăng', 'Bạn có muốn duyệt bài đăng này không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Duyệt',
        onPress: async () => {
          try {
            await managerService.updatePostStatus(id, 'approved');
            setPosts((current) => current.filter((p) => p.postId !== id));
            CustomAlert('Thành công', 'Bài đăng đã được duyệt.');
          } catch (error) {
            CustomAlert('Lỗi', 'Không thể duyệt bài đăng này.');
          }
        },
      },
    ]);
  };

  const handleReject = (post: PostModerationData) => {
    setSelectedPost(post);
    setRejectModalVisible(true);
  };

  const onSubmitReject = async (reason: string) => {
    if (!selectedPost) return;

    try {
      await managerService.updatePostStatus(selectedPost.postId, 'rejected', reason);
      setPosts((current) => current.filter((p) => p.postId !== selectedPost.postId));
      CustomAlert('Thành công', `Bài đăng "${selectedPost.postTitle}" đã bị từ chối.`);
    } catch (error) {
      CustomAlert('Lỗi', 'Không thể từ chối bài đăng này.');
    }
  };

  const renderItem = ({ item }: { item: PostModerationData }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => navigation.navigate('PostManagementDetail', { postId: item.postId })}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <View style={styles.postInfo}>
          <View style={styles.badgeContainer}>
            <View style={styles.pendingBadge}>
              <Clock size={12} color="#D97706" />
              <Text style={styles.pendingText}>Chờ duyệt</Text>
            </View>
            <Text style={styles.timeText}>
              {item.postCreatedAt ? new Date(item.postCreatedAt).toLocaleDateString('vi-VN') : 'Không có ngày'}
            </Text>
          </View>
          <Text style={styles.postTitle} numberOfLines={2}>{item.postTitle}</Text>
          <Text style={styles.metaText}>{item.authorName || item.summary || 'Không có thông tin tác giả'}</Text>
          <Text style={styles.priorityText}>Độ ưu tiên: {priorityMap[item.priority] || item.priority}</Text>
        </View>
        <ChevronRight color="#CBD5E1" size={20} />
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.actionButton, styles.rejectBtn]} onPress={() => handleReject(item)}>
          <X size={18} color="#EF4444" />
          <Text style={[styles.actionText, styles.rejectText]}>Từ chối</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.approveBtn]} onPress={() => handleApprove(item.postId)}>
          <Check size={18} color="#22C55E" />
          <Text style={[styles.actionText, styles.approveText]}>Duyệt</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ManagerHeader
        title="Kiểm duyệt bài đăng"
        rightAction={
          <TouchableOpacity onPress={fetchPosts} style={styles.headerActionButton}>
            <Clock size={20} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item) => item.postId.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchPosts}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CheckCircle2 size={64} color="#CBD5E1" strokeWidth={1} />
              <Text style={styles.emptyText}>Không có bài đăng nào đang chờ duyệt.</Text>
            </View>
          }
        />
      )}

      <ReasonModal
        visible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        onSubmit={onSubmitReject}
        title="Lý do từ chối"
        placeholder="Giải thích lý do từ chối bài đăng này..."
        confirmLabel="Từ chối bài"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: { padding: 16, paddingBottom: 30 },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  postInfo: { flex: 1 },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  pendingText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  timeText: { fontSize: 11, color: '#94A3B8' },
  postTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 6 },
  metaText: { fontSize: 13, color: '#64748B', marginBottom: 4 },
  priorityText: { fontSize: 12, color: '#475569' },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  rejectBtn: { backgroundColor: '#FEF2F2' },
  approveBtn: { backgroundColor: '#F0FDF4' },
  actionText: { fontWeight: 'bold', fontSize: 14 },
  rejectText: { color: '#EF4444' },
  approveText: { color: '#22C55E' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#94A3B8', textAlign: 'center', width: '80%' },
});

export default PostManagementList;
