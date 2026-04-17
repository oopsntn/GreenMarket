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
import { ArrowLeft, Store, User, Calendar, ShieldCheck, AlertCircle, Ban } from 'lucide-react-native';
import ReasonModal from '../components/ReasonModal';
import managerService, { ShopModerationData } from '../services/ManagerService';
import CustomAlert from '../../utils/AlertHelper';

const ShopManagementDetail = ({ route, navigation }: any) => {
  const { shopId } = route.params;
  const [shop, setShop] = useState<ShopModerationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBlockModalVisible, setIsBlockModalVisible] = useState(false);

  useEffect(() => {
    fetchShop();
  }, [shopId]);

  const fetchShop = async () => {
    try {
      setLoading(true);
      const data = await managerService.getShopById(shopId);
      setShop(data);
    } catch (error) {
      console.error(error);
      CustomAlert('Lỗi', 'Không thể tải thông tin cửa hàng.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => {
    CustomAlert('Duyệt cửa hàng', 'Duyệt cửa hàng này và cho phép hoạt động?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Duyệt',
        onPress: async () => {
          try {
            await managerService.verifyShop(shopId);
            CustomAlert('Thành công', 'Cửa hàng đã được kích hoạt.');
            navigation.goBack();
          } catch (error) {
            CustomAlert('Lỗi', 'Không thể kích hoạt cửa hàng này.');
          }
        }
      },
    ]);
  };

  const onSubmitBlock = async (reason: string) => {
    try {
      await managerService.updateShopStatus(shopId, 'blocked', reason);
      CustomAlert('Chặn', `Cửa hàng đã bị chặn. Lý do: ${reason}`);
      navigation.goBack();
    } catch (error) {
      CustomAlert('Lỗi', 'Không thể thực hiện thao tác này.');
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
                <Text style={styles.infoLabel}>Chủ sở hữu</Text>
                <Text style={styles.infoValue}>{shop.ownerName || 'Chưa rõ chủ sở hữu'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Calendar size={18} color="#64748B" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Ngày tạo</Text>
                <Text style={styles.infoValue}>{shop.createdAt ? new Date(shop.createdAt).toLocaleString() : 'Không có'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Calendar size={18} color="#64748B" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Ngày cập nhật</Text>
                <Text style={styles.infoValue}>{shop.updatedAt ? new Date(shop.updatedAt).toLocaleString() : 'Không có'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ngữ cảnh hàng đợi</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{shop.subtitle || 'Không có ghi chú kiểm duyệt bổ sung.'}</Text>
            <Text style={styles.priorityText}>Độ ưu tiên: {shop.priority}</Text>
          </View>
        </View>

        <View style={styles.warningBox}>
          <AlertCircle size={20} color="#F59E0B" />
          <Text style={styles.warningText}>
            API quản lý chỉ hiển thị thông tin hàng đợi kiểm duyệt cho cửa hàng. Sử dụng kích hoạt hoặc chặn tại đây, và leo thang riêng nếu trường hợp cần quy trình mạnh hơn.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => setIsBlockModalVisible(true)}>
          <Ban size={20} color="#F59E0B" />
          <Text style={styles.rejectBtnText}>Chặn cửa hàng</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.verifyBtn]} onPress={handleVerify}>
          <ShieldCheck size={20} color="white" />
          <Text style={styles.verifyBtnText}>Duyệt & Kích hoạt</Text>
        </TouchableOpacity>
      </View>

      <ReasonModal
        visible={isBlockModalVisible}
        onClose={() => setIsBlockModalVisible(false)}
        onSubmit={onSubmitBlock}
        title="Lý do chặn"
        placeholder="Giải thích lý do chặn cửa hàng này..."
        confirmLabel="Chặn cửa hàng"
        confirmColor="#F59E0B"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  scrollContent: { padding: 20, paddingBottom: 100 },
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
  shopBriefInfo: { flex: 1 },
  shopName: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  pendingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingText: { fontSize: 12, fontWeight: 'bold', color: '#D97706', textTransform: 'capitalize' },
  section: { marginBottom: 24 },
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
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#1E293B', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  descriptionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  descriptionText: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 12 },
  priorityText: { fontSize: 13, color: '#64748B', textTransform: 'capitalize' },
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
  warningText: { flex: 1, color: '#92400E', lineHeight: 20 },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  rejectBtn: { backgroundColor: '#FFFBEB' },
  rejectBtnText: { color: '#F59E0B', fontWeight: '700' },
  verifyBtn: { backgroundColor: '#3B82F6' },
  verifyBtnText: { color: 'white', fontWeight: '700' },
});

export default ShopManagementDetail;
