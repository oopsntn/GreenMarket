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
import { ArrowLeft, Check, X, EyeOff, Calendar, User, AlertCircle, Clock3 } from 'lucide-react-native';
import ReasonModal from '../components/ReasonModal';
import managerService, { PostModerationData } from '../services/ManagerService';
import CustomAlert from '../../utils/AlertHelper';

const PostManagementDetail = ({ route, navigation }: any) => {
  const { postId } = route.params;
  const [post, setPost] = useState<PostModerationData | null>(null);
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
    } catch (error) {
      console.error(error);
      CustomAlert('Error', 'Unable to load post details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    CustomAlert('Approve post', 'Do you want to approve this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            await managerService.updatePostStatus(postId, 'approved');
            CustomAlert('Success', 'The post has been approved.');
            navigation.goBack();
          } catch (error) {
            CustomAlert('Error', 'Unable to approve this post.');
          }
        }
      },
    ]);
  };

  const onSubmitModal = async (reason: string) => {
    try {
      if (modalType === 'reject') {
        await managerService.updatePostStatus(postId, 'rejected', reason);
        CustomAlert('Rejected', `Reason saved: ${reason}`);
      } else if (modalType === 'hide') {
        await managerService.deletePost(postId, reason);
        CustomAlert('Hidden', `The post has been hidden. Reason: ${reason}`);
      }
      navigation.goBack();
    } catch (error) {
      CustomAlert('Error', 'The action could not be completed.');
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#1E293B" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <Clock3 size={14} color="#D97706" />
              <Text style={styles.statusText}>{post.postStatus || 'unknown'}</Text>
            </View>
            <Text style={styles.priorityText}>Priority: {post.priority}</Text>
          </View>
          <Text style={styles.title}>{post.postTitle}</Text>
          <Text style={styles.subtitle}>{post.summary || 'No additional summary available.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Moderation Context</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <User size={18} color="#64748B" />
              <View>
                <Text style={styles.infoLabel}>Author</Text>
                <Text style={styles.infoValue}>{post.authorName || 'Unknown author'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Calendar size={18} color="#64748B" />
              <View>
                <Text style={styles.infoLabel}>Created at</Text>
                <Text style={styles.infoValue}>{post.postCreatedAt ? new Date(post.postCreatedAt).toLocaleString() : 'Not available'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Calendar size={18} color="#64748B" />
              <View>
                <Text style={styles.infoLabel}>Updated at</Text>
                <Text style={styles.infoValue}>{post.postUpdatedAt ? new Date(post.postUpdatedAt).toLocaleString() : 'Not available'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.warningBox}>
          <AlertCircle size={20} color="#94A3B8" />
          <Text style={styles.warningText}>
            This manager workflow only exposes moderation queue data. If a post needs stronger action, hide or reject it from here and escalate separately when needed.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.moderationBar}>
        <TouchableOpacity style={[styles.modButton, styles.hideBtn]} onPress={() => setModalType('hide')}>
          <EyeOff size={22} color="#EF4444" />
          <Text style={[styles.modText, { color: '#EF4444' }]}>Hide</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.modButton, styles.rejectBtn]} onPress={() => setModalType('reject')}>
          <X size={22} color="#F59E0B" />
          <Text style={[styles.modText, { color: '#F59E0B' }]}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.modButton, styles.approveBtn]} onPress={handleApprove}>
          <Check size={22} color="white" />
          <Text style={[styles.modText, { color: 'white' }]}>Approve</Text>
        </TouchableOpacity>
      </View>

      <ReasonModal
        visible={!!modalType}
        onClose={() => setModalType(null)}
        onSubmit={onSubmitModal}
        title={modalType === 'reject' ? 'Reason for rejection' : 'Reason for hiding'}
        placeholder={modalType === 'reject' ? 'Explain why this post is being rejected...' : 'Explain why this post is being hidden...'}
        confirmLabel={modalType === 'reject' ? 'Reject post' : 'Hide post'}
        confirmColor={modalType === 'reject' ? '#F59E0B' : '#EF4444'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
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
  priorityText: { fontSize: 12, color: '#475569', textTransform: 'capitalize' },
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
