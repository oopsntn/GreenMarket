import * as ImagePicker from 'expo-image-picker'
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Button from '../../Reused/Button/Button'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import { ProfileAvatar } from '../component/ProfileAvatar'
import { ProfileForm } from '../component/ProfileForm'
import { useProfile } from '../service/useProfile'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../../../context/AuthContext'
import { LogOut, Store } from 'lucide-react-native'
import CustomAlert from '../../../utils/AlertHelper'
import { ProfileService } from '../service/ProfileService'

const ProfileScreen = () => {
    const { formData,
        setFormData,
        loading,
        saving,
        handleSave,
        isShop, } = useProfile()
    const { logout, updateUser, refreshShop, shop } = useAuth()

    const navigation = useNavigation<any>()
    const handleUpdateAvatar = async (localUri: string) => {
        try {
            const uploadRes = await ProfileService.uploadAvatar(localUri)
            if (uploadRes && uploadRes.urls && uploadRes.urls.length > 0) {
                const serverImageUrl = uploadRes.urls[0]

                // 2. Lưu URL vào Database tùy theo vai trò (User hay Shop)
                if (isShop && shop?.shopId) {
                    await ProfileService.updateShop(shop.shopId, { shopAvatarUrl: serverImageUrl });
                    await refreshShop(); // Cập nhật lại thông tin Shop trong Context
                } else {
                    await ProfileService.updateProfile({ userAvatarUrl: serverImageUrl });
                    await updateUser({ userAvatarUrl: serverImageUrl }); // Cập nhật thông tin User trong Context
                }

                // 3. Cập nhật giao diện local
                setFormData({ ...formData, avatarUrl: serverImageUrl });
                CustomAlert("Thành công", "Đã cập nhật ảnh đại diện mới.");
            } else {
                throw new Error("Dữ liệu trả về không hợp lệ");
            }

        } catch (e) {
            console.error("Lỗi cập nhật avatar: ", e);
            CustomAlert("Lỗi", "Không thể lưu ảnh đại diện.")
        }
    }

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            const selectedUri = result.assets[0].uri;
            // Gọi hàm xử lý upload ngay lập tức
            await handleUpdateAvatar(selectedUri);
        }
    }

    const handleLogout = () => {
        CustomAlert(
            "Đăng xuất", "Bạn có chắc chắn với quyết định của mình", [
            { text: "Hủy" }, { text: "Thoát", onPress: () => logout() }
        ]
        )
    };

    const renderShopStatus = () => {
        if (!isShop) {
            return (
                <Button
                    variant="outline"
                    onPress={() => navigation.navigate('RegisterShop')}
                    style={{ marginBottom: 15 }}
                >
                    Đăng ký mở gian hàng ngay
                </Button>
            )
        }

        switch (shop?.shopStatus) {
            case 'pending':
                return (
                    <View style={styles.statusBannerPending}>
                        <Text style={styles.statusText}>🕒 Hồ sơ nhà vườn đang chờ duyệt...</Text>
                        <Text style={styles.statusSubText}>Chúng tôi sẽ phản hồi trong vòng 24h.</Text>
                    </View>
                )
            case 'active':
                return (
                    <Button
                        variant="primary"
                        onPress={() => navigation.navigate('ShoDetail')}
                        icon={<Store size={18} color="#fff" />}
                        style={{ backgroundColor: '#10b981', marginBottom: 15 }}
                    >
                        Vào nhà vườn của tôi
                    </Button>
                )
            case 'blocked':
                return (
                    <View style={styles.statusBannerBlocked}>
                        <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>🚫 Nhà vườn đã bị khóa</Text>
                        <Text style={{ color: '#7f1d1d', fontSize: 12 }}>Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.</Text>
                    </View>
                )
            case 'closed':
                return (
                    <TouchableOpacity
                        style={styles.statusBannerClosed}
                        onPress={() => navigation.navigate('RegisterShop')}
                    >
                        <Text style={{ color: '#6b7280', fontWeight: 'bold' }}>📁 Nhà vườn hiện đang đóng cửa</Text>
                        <Text style={{ color: '#374151', fontSize: 12, marginTop: 4 }}>Bấm để yêu cầu mở lại cửa hàng.</Text>
                    </TouchableOpacity>
                )
            default:
                return (
                    <TouchableOpacity
                        style={styles.statusBannerBlocked}
                        onPress={() => navigation.navigate('RegisterShop')}
                    >
                        <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Hồ sơ bị từ chối (Bấm để xem lý do)</Text>
                    </TouchableOpacity>
                )
        }
    }

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#10b981" />
    return (
        <MobileLayout title="Hồ sơ của tôi">
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Avatar */}
                <ProfileAvatar uri={formData.avatarUrl} onPickImage={pickImage} />

                {/* Shop */}
                <View style={{ marginBottom: 15 }}>
                    {renderShopStatus()}
                </View>

                {/* Profile Form */}
                <ProfileForm formData={formData} setFormData={setFormData} isShop={isShop} />

                <Button onPress={handleSave} loading={saving} style={styles.saveBtn}>
                    Lưu tất cả thay đổi
                </Button>

                {/* Nút Logout bổ sung */}
                <Button
                    onPress={handleLogout}
                    variant="outline"
                    style={styles.logoutBtn}
                    icon={<LogOut size={18} color="#ef4444" />}
                >
                    <span style={{ color: '#ef4444' }}>Đăng xuất</span>
                </Button>
            </ScrollView>
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    saveBtn: { marginTop: 20, backgroundColor: '#10b981' },
    logoutBtn: {
        marginTop: 15,
        marginBottom: 30,
        borderColor: '#fee2e2',
        borderWidth: 1
    },
    statusBannerPending: {
        backgroundColor: '#fffbeb',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fef3c7',
        alignItems: 'center',
    },
    statusBannerBlocked: {
        backgroundColor: '#fef2f2',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fee2e2',
        alignItems: 'center',
    },
    statusBannerClosed: {
        backgroundColor: '#f3f4f6',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        alignItems: 'center',
    },
    statusText: { color: '#b45309', fontWeight: '700', fontSize: 14 },
    statusSubText: { color: '#d97706', fontSize: 12, marginTop: 4 },
})

export default ProfileScreen
