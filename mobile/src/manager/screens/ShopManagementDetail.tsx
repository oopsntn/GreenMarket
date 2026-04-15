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
  ActivityIndicator,
} from 'react-native';
import { 
  ArrowLeft, 
  Store, 
  User, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  AlertCircle,
  FileText
} from 'lucide-react-native';
import ReasonModal from '../components/ReasonModal';
import ManagerService, { ShopModerationData } from '../services/ManagerService';
import CustomAlert from '../../utils/AlertHelper';

const ShopManagementDetail = ({ route, navigation }: any) => {
  const { shopId } = route.params;
  const [shop, setShop] = useState<ShopModerationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);

  useEffect(() => {
    fetchShop();
  }, [shopId]);

  const fetchShop = async () => {
    try {
      setLoading(true);
      const data = await ManagerService.getShopById(shopId);
      setShop(data);
    } catch (error) {
      console.error(error);
      CustomAlert('Lỗi', 'Không thể tải chi tiết cửa hàng');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => {
    CustomAlert('Xác minh cửa hàng', 'Duyệt hồ sơ và cho phép cửa hàng hoạt động?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xác minh', 
        onPress: async () => {
          try {
            await ManagerService.verifyShop(shopId);
            CustomAlert('Thành công', 'Cửa hàng đã được kích hoạt');
            navigation.goBack();
          } catch (error) {
            CustomAlert('Lỗi', 'Không thể xác minh cửa hàng');
          }
        }
      },
    ]);
  };

  const handleReject = () => {
    setIsRejectModalVisible(true);
  };

  const onSubmitReject = async (reason: string) => {
    try {
      await ManagerService.updateShopStatus(shopId, 'Rejected');
      if (shop) {
        await ManagerService.moderationFeedback({
          targetType: 'shop',
          targetId: shopId,
          recipientUserId: shop.ownerUserId || shopId, // fallback if ownerUserId missing
          message: `Hồ sơ cửa hàng của bạn đã bị từ chối. Lý do: ${reason}`
        }).catch(() => console.log('Failed to send feedback, but shop was rejected.'));
      }
      CustomAlert('Đã gửi thông báo', `Đã từ chối cửa hàng. Lý do: ${reason}`);
      navigation.goBack();
    } catch (error) {
      CustomAlert('Lỗi', 'Thao tác thất bại');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!shop) return null;

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
        <Text style={styles.headerTitle}>Hồ sơ cửa hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.shopBriefCard}>
          <View style={styles.shopIcon}>
            <Store color="#3B82F6" size={32} />
          </View>
          <View style={styles.shopBriefInfo}>
            <Text style={styles.shopName}>{shop.name}</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>{shop.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <User size={18} color="#64748B" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Chủ cửa hàng</Text>
                <Text style={styles.infoValue}>{shop.ownerName}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Phone size={18} color="#64748B" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{shop.ownerEmail}</Text>
              </View>
            </View>

            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <MapPin size={18} color="#64748B" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Tổng số tin đăng</Text>
                <Text style={styles.infoValue}>{shop.totalPosts}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ngày đăng ký</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>{shop.createdAt}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giới thiệu</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{shop.description || 'Chưa có mô tả'}</Text>
          </View>
        </View>

        <View style={styles.warningBox}>
          <AlertCircle size={20} color="#F59E0B" />
          <Text style={styles.warningText}>
            Lưu ý: Kiểm tra chéo thông tin của chủ cửa hàng trước khi kích hoạt.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.btn, styles.rejectBtn]}
          onPress={handleReject}
        >
          <Text style={styles.rejectBtnText}>Từ chối hồ sơ</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, styles.verifyBtn]}
          onPress={handleVerify}
        >
          <ShieldCheck size={20} color="white" />
          <Text style={styles.verifyBtnText}>Duyệt & Kích hoạt</Text>
        </TouchableOpacity>
      </View>

      <ReasonModal
        visible={isRejectModalVisible}
        onClose={() => setIsRejectModalVisible(false)}
        onSubmit={onSubmitReject}
        title="Lý do từ chối"
        placeholder="Vd: Thông tin không rõ ràng, hồ sơ chưa đầy đủ..."
        confirmLabel="Gửi lý do từ chối"
        confirmColor="#F59E0B"
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  shopBriefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  shopIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  shopBriefInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D97706',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  descriptionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  descriptionText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  warningBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rejectBtn: {
    backgroundColor: '#F1F5F9',
  },
  rejectBtnText: {
    color: '#475569',
    fontWeight: 'bold',
  },
  verifyBtn: {
    backgroundColor: '#3B82F6',
  },
  verifyBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ShopManagementDetail;
