import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {
  Check,
  X,
  Clock,
  ChevronRight,
  Filter,
  Search,
  CheckCircle2
} from 'lucide-react-native';
import ReasonModal from '../components/ReasonModal';
import ModeratorService, { PostModerationData } from '../services/ModeratorService';
import CustomAlert from '../../utils/AlertHelper';

const PostModerationList = ({ navigation }: any) => {
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
      const data = await ModeratorService.getPosts();
      // Filter only pending posts for this view if needed, 
      // or show all. The API seems to return all.
      setPosts(data.filter(p => p.postStatus === 'pending' || p.postStatus === 'Pending'));
    } catch (error) {
      console.error(error);
      CustomAlert('Error', 'Could not fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (id: number) => {
    CustomAlert('Confirm Approval', 'Are you sure you want to approve this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            await ModeratorService.updatePostStatus(id, 'approved');
            setPosts(posts.filter(p => p.postId !== id));
            CustomAlert('Success', 'Post has been approved');
          } catch (error) {
            CustomAlert('Error', 'Could not approve post');
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
    if (selectedPost) {
      try {
        await ModeratorService.updatePostStatus(selectedPost.postId, 'rejected', reason);
        setPosts(posts.filter(p => p.postId !== selectedPost.postId));
        CustomAlert('Success', `Post "${selectedPost.postTitle}" has been rejected.`);
      } catch (error) {
        CustomAlert('Error', 'Could not reject post');
      }
    }
  };

  const renderItem = ({ item }: { item: PostModerationData }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => navigation.navigate('PostModerationDetail', { postId: item.postId })}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <Image
          source={{ uri: item.images?.[0]?.imageUrl || 'https://via.placeholder.com/150' }}
          style={styles.postImage}
        />
        <View style={styles.postInfo}>
          <View style={styles.badgeContainer}>
            <View style={styles.pendingBadge}>
              <Clock size={12} color="#D97706" />
              <Text style={styles.pendingText}>Pending</Text>
            </View>
            <Text style={styles.timeText}>{new Date(item.postCreatedAt || '').toLocaleDateString()}</Text>
          </View>
          <Text style={styles.postTitle} numberOfLines={2}>{item.postTitle}</Text>
          <Text style={styles.shopName}>Shop ID: {item.postShopId}</Text>
          <Text style={styles.price}>{item.postPrice.toLocaleString('en-US')} VND</Text>
        </View>
        <ChevronRight color="#CBD5E1" size={20} />
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectBtn]}
          onPress={() => handleReject(item)}
        >
          <X size={18} color="#EF4444" />
          <Text style={[styles.actionText, styles.rejectText]}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.approveBtn]}
          onPress={() => handleApprove(item.postId)}
        >
          <Check size={18} color="#22C55E" />
          <Text style={[styles.actionText, styles.approveText]}>Approve</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Post Moderation</Text>
        <TouchableOpacity onPress={fetchPosts} style={styles.iconCircle}>
          <Search size={22} color="#64748B" />
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
          keyExtractor={item => item.postId.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchPosts}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CheckCircle2 size={64} color="#CBD5E1" strokeWidth={1} />
              <Text style={styles.emptyText}>Great job! No more posts waiting for moderation.</Text>
            </View>
          }
        />
      )}

      <ReasonModal
        visible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        onSubmit={onSubmitReject}
        title="Reason for Rejection"
        placeholder="Explain why this post is rejected (e.g. Blurry images, Prohibited items...)"
        confirmLabel="Reject Post"
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
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
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#F1F5F9',
  },
  postInfo: {
    flex: 1,
  },
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
  pendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  shopName: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
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
  rejectBtn: {
    backgroundColor: '#FEF2F2',
  },
  approveBtn: {
    backgroundColor: '#F0FDF4',
  },
  actionText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  rejectText: {
    color: '#EF4444',
  },
  approveText: {
    color: '#22C55E',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    width: '80%',
  },
});

export default PostModerationList;
