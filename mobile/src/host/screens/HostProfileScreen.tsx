import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Calendar, Settings, ShieldCheck, Trophy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileAvatar } from '../../components/profile/component/ProfileAvatar';
import { ProfileForm } from '../../components/profile/component/ProfileForm';
import { useProfile } from '../../components/profile/service/useProfile';
import CustomAlert from '../../utils/AlertHelper';
import { ProfileService } from '../../components/profile/service/ProfileService';
import { useAuth } from '../../context/AuthContext';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

const HostProfileScreen = () => {
  const { formData, setFormData, loading, saving, handleSave, isShop } = useProfile();
  const { updateUser, refreshShop, shop, user } = useAuth();
  const navigation = useNavigation<any>();

  const handleUpdateAvatar = async (localUri: string) => {
    try {
      const uploadRes = await ProfileService.uploadAvatar(localUri);
      if (!uploadRes?.urls?.[0]) {
        throw new Error('Phản hồi tải lên không hợp lệ');
      }

      const serverImageUrl = uploadRes.urls[0];

      if (isShop && shop?.shopId) {
        await ProfileService.updateShop(shop.shopId, { shopLogoUrl: serverImageUrl });
        await refreshShop();
      } else {
        await ProfileService.updateProfile({ userAvatarUrl: serverImageUrl });
        await updateUser({ userAvatarUrl: serverImageUrl });
      }

      setFormData((prev) => ({ ...prev, avatarUrl: resolveImageUrl(serverImageUrl) }));
      CustomAlert('Thành công', 'Cập nhật ảnh đại diện thành công.');
    } catch (e) {
      console.error('Avatar update error: ', e);
      CustomAlert('Lỗi', 'Không thể lưu ảnh đại diện.');
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      CustomAlert('Thông báo', 'Vui lòng cấp quyền truy cập thư viện ảnh');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await handleUpdateAvatar(result.assets[0].uri);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const joinedDate = (user as any)?.userRegisteredAt
    ? new Date((user as any).userRegisteredAt).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })
    : 'N/A';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#064e3b', '#10b981']} style={styles.headerGradient}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Hồ sơ</Text>
              <Text style={styles.headerSubtitle}>QUẢN LÝ TÀI KHOẢN</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => CustomAlert('Cài đặt', 'Tính năng cài đặt sắp ra mắt')}
            >
              <Settings color="white" size={20} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.contentWrap}>
          <ProfileAvatar uri={formData.avatarUrl} onPickImage={pickImage} isVerified={true} />

          <View style={styles.nameHeader}>
            <Text style={styles.displayName}>{isShop ? formData.shopName : formData.displayName}</Text>
            <View style={styles.verifiedRow}>
              <ShieldCheck size={14} color="#10b981" fill="#ecfdf5" />
              <Text style={styles.verifiedText}>ĐÃ XÁC THỰC</Text>
            </View>
          </View>

          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Calendar size={18} color="#64748b" />
              <View>
                <Text style={styles.statLabel}>Thành viên từ</Text>
                <Text style={styles.statValB}>{joinedDate}</Text>
              </View>
            </View>
            <View style={styles.dividerV} />
            <View style={styles.statItem}>
              <Trophy size={18} color="#f59e0b" />
              <View>
                <Text style={styles.statLabel}>Độ uy tín</Text>
                <Text style={styles.statValB}>Tuyệt vời</Text>
              </View>
            </View>
          </View>

          <View style={styles.formCardOuter}>
            <View style={styles.formHeaderRow}>
              <View style={styles.emeraldPoint} />
              <Text style={styles.formSectionTitle}>
                {isShop ? 'THÔNG TIN CỬA HÀNG' : 'THÔNG TIN CÁ NHÂN'}
              </Text>
            </View>
            <ProfileForm formData={formData} setFormData={setFormData} isShop={isShop} />
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>LƯU THAY ĐỔI</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerGradient: { paddingTop: 32, paddingBottom: 28, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: '900' },
  headerSubtitle: { color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrap: { paddingHorizontal: 20, paddingBottom: 28, marginTop: -8 },
  nameHeader: { alignItems: 'center', marginTop: 16 },
  displayName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  verifiedText: { fontSize: 10, fontWeight: '800', color: '#10b981', letterSpacing: 1 },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginTop: 24,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValB: { fontSize: 13, fontWeight: '900', color: '#334155', marginTop: 1 },
  dividerV: { width: 1, height: 30, backgroundColor: '#f1f5f9' },
  formCardOuter: {
    marginTop: 24,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  formHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  emeraldPoint: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981' },
  formSectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1, color: '#0f172a' },
  primaryBtn: {
    marginTop: 14,
    height: 54,
    borderRadius: 20,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: 'white', fontWeight: '900', letterSpacing: 1, fontSize: 13 },
  backBtn: {
    marginTop: 12,
    height: 50,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { color: '#0f172a', fontWeight: '800' },
});

export default HostProfileScreen;

