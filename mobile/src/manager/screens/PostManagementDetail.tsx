import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Trash2, 
  MapPin, 
  User, 
  Calendar,
  AlertCircle
} from 'lucide-react-native';
import ReasonModal from '../components/ReasonModal';
import ManagerService, { PostModerationData } from '../services/ManagerService';
import CustomAlert from '../../utils/AlertHelper';

const { width } = Dimensions.get('window');

const PostManagementDetail = ({ route, navigation }: any) => {
  const { postId } = route.params;
  const [post, setPost] = useState<PostModerationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'reject' | 'delete' | null>(null);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const data = await ManagerService.getPostById(postId);
      setPost(data);
    } catch (error) {
      console.error(error);
      CustomAlert('Lỗi', 'Không thể tải chi tiết tin');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    CustomAlert('Xác nhận duyệt', 'Bạn có chắc chắn muốn duyệt tin này không?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Duyệt', 
        onPress: async () => {
          try {
            await ManagerService.updatePostStatus(postId, 'approved');
            CustomAlert('Thành công', 'Đã duyệt tin');
            navigation.goBack();
          } catch (error) {
            CustomAlert('Lỗi', 'Không thể duyệt tin');
          }
        }
      },
    ]);
  };

  const onSubmitModal = async (reason: string) => {
    try {
      if (modalType === 'reject') {
        await ManagerService.updatePostStatus(postId, 'rejected', reason);
        if (post) {
          await ManagerService.moderationFeedback({
            targetType: 'post',
            targetId: postId,
            recipientUserId: post.postUserId || post.postShopId || 0,
            message: `Tin đăng "${post.postTitle}" của bạn đã bị từ chối. Lý do: ${reason}`
          }).catch(() => console.log('Failed to send feedback, but post was rejected.'));
        }
        CustomAlert('Đã từ chối', `Lý do: ${reason}`);
      } else if (modalType === 'delete') {
        // Need current user ID for adminId
        // For now using placeholder 'moderator-1'
        await ManagerService.deletePost(postId, 'manager-1', reason);
        CustomAlert('Đã xóa', `Lý do: ${reason}`);
      }
      navigation.goBack();
    } catch (error) {
      CustomAlert('Lỗi', 'Thao tác thất bại');
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
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color="#1E293B" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết tin đăng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          style={styles.imageSlider}
        >
          {post.images && post.images.length > 0 ? (
            post.images.map((img, index) => (
              <Image 
                key={index} 
                source={{ uri: img.imageUrl }} 
                style={styles.postImage} 
                resizeMode="cover"
              />
            ))
          ) : (
            <Image 
              source={{ uri: 'https://via.placeholder.com/600' }} 
              style={styles.postImage} 
              resizeMode="cover"
            />
          )}
        </ScrollView>

        <View style={styles.contentContainer}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{post.postPrice.toLocaleString('en-US')} VND <Text style={styles.unit}>/ {post.postUnit || 'sản phẩm'}</Text></Text>
            <View style={styles.stockBadge}>
              <Text style={styles.stockText}>Số lượng: {post.postQuantity || 0}</Text>
            </View>
          </View>

          <Text style={styles.title}>{post.postTitle}</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MapPin size={16} color="#64748B" />
              <Text style={styles.infoLabel}>{post.postLocation || 'Không rõ địa chỉ'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Calendar size={16} color="#64748B" />
              <Text style={styles.infoLabel}>{new Date(post.postCreatedAt).toLocaleDateString()}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chủ cửa hàng</Text>
            <View style={styles.shopContainer}>
              <View style={styles.shopAvatar}>
                <User color="#94A3B8" size={24} />
              </View>
              <View>
                <Text style={styles.shopName}>Cửa hàng ID: {post.postShopId}</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#F0FDF4' }]}>
                  <Text style={[styles.statusText, { color: '#166534' }]}>Quản lý xét duyệt</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả chi tiết</Text>
            <Text style={styles.description}>{post.postDescription}</Text>
          </View>

          <View style={styles.warningBox}>
            <AlertCircle size={20} color="#94A3B8" />
            <Text style={styles.warningText}>
              Vui lòng kiểm tra nội dung và hình ảnh không vi phạm chính sách của GreenMarket trước khi duyệt.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.moderationBar}>
        <TouchableOpacity 
          style={[styles.modButton, styles.deleteBtn]}
          onPress={() => setModalType('delete')}
        >
          <Trash2 size={24} color="#EF4444" />
          <Text style={[styles.modText, { color: '#EF4444' }]}>Xóa</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.modButton, styles.rejectBtn]}
          onPress={() => setModalType('reject')}
        >
          <X size={24} color="#F59E0B" />
          <Text style={[styles.modText, { color: '#F59E0B' }]}>Từ chối</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.modButton, styles.approveBtn]}
          onPress={handleApprove}
        >
          <Check size={24} color="white" />
          <Text style={[styles.modText, { color: 'white' }]}>Duyệt</Text>
        </TouchableOpacity>
      </View>

      <ReasonModal
        visible={!!modalType}
        onClose={() => setModalType(null)}
        onSubmit={onSubmitModal}
        title={modalType === 'reject' ? 'Lý do từ chối' : 'Lý do xóa'}
        placeholder={modalType === 'reject' ? 'Vd: Hình ảnh không rõ ràng...' : 'Vd: Sản phẩm bị cấm...'}
        confirmLabel={modalType === 'reject' ? 'Gửi lý do từ chối' : 'Xóa tin'}
        confirmColor={modalType === 'reject' ? '#F59E0B' : '#EF4444'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  imageSlider: {
    height: width * 0.75,
  },
  postImage: {
    width: width,
    height: width * 0.75,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10B981',
  },
  unit: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: 'normal',
  },
  stockBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    lineHeight: 30,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  shopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
  },
  shopAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
  },
  warningBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  moderationBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  modButton: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deleteBtn: {
    width: 80,
    backgroundColor: '#FEF2F2',
  },
  rejectBtn: {
    flex: 1.5,
    backgroundColor: '#FFFBEB',
  },
  approveBtn: {
    flex: 2,
    backgroundColor: '#22C55E',
  },
  modText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default PostManagementDetail;
