import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Check, X, Clock, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import ReasonModal from '../components/ReasonModal';
import managerService, { PostModerationData } from '../services/ManagerService';
import CustomAlert from '../../utils/AlertHelper';

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
      CustomAlert('Lỗi', 'Không thể tải danh sách tin chờ duyệt.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (id: number) => {
    CustomAlert('Duyệt tin', 'Bạn có muốn duyệt tin này không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Duyệt',
        onPress: async () => {
          try {
            await managerService.updatePostStatus(id, 'approved');
            setPosts((current) => current.filter((p) => p.postId !== id));
            CustomAlert('Thành công', 'Tin đăng đã được duyệt.');
          } catch (error) {
            CustomAlert('Lỗi', 'Không thể duyệt tin này.');
          }
        }
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
      CustomAlert('Thành công', `Tin đăng "${selectedPost.postTitle}" đã bị từ chối.`);
    } catch (error) {
      CustomAlert('Lỗi', 'Không thể từ chối tin này.');
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
            <Text style={styles.timeText}>{item.postCreatedAt ? new Date(item.postCreatedAt).toLocaleDateString() : 'No date'}</Text>
          </View>
          <Text style={styles.postTitle} numberOfLines={2}>{item.postTitle}</Text>
          <Text style={styles.metaText}>{item.authorName || item.summary || 'Không có thông tin tác giả'}</Text>
          <Text style={styles.priorityText}>Độ ưu tiên: {item.priority}</Text>
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Kiểm duyệt tin đăng</Text>
        <TouchableOpacity onPress={fetchPosts} style={styles.iconCircle}>
          <Clock size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

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
              <Text style={styles.emptyText}>Tuyệt vời! Không có tin nào chờ duyệt.</Text>
            </View>
          }
        />
      )}

      <ReasonModal
        visible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        onSubmit={onSubmitReject}
        title="Lý do từ chối"
        placeholder="Giải thích lý do từ chối tin đăng này..."
        confirmLabel="Từ chối tin"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
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
  priorityText: { fontSize: 12, color: '#475569', textTransform: 'capitalize' },
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
