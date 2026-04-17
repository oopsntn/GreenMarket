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
    Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
    FileText,
    LogOut,
    Store,
    Settings,
    ChevronRight,
    ShieldCheck,
    Calendar,
    Trophy,
    LayoutDashboard,
    Heart,
    Briefcase
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileAvatar } from '../component/ProfileAvatar';
import { ProfileForm } from '../component/ProfileForm';
import { useProfile } from '../service/useProfile';
import { useAuth } from '../../../context/AuthContext';
import CustomAlert from '../../../utils/AlertHelper';
import { ProfileService } from '../service/ProfileService';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
    const {
        formData,
        setFormData,
        loading,
        saving,
        handleSave,
        isShop,
    } = useProfile();
    const { logout, user, updateUser, refreshShop, shop } = useAuth();
    const navigation = useNavigation<any>();
    const isCollaborator = user?.businessRoleCode === 'COLLABORATOR';
    const isActiveShop = isShop && shop?.shopStatus === 'active';
    const isPendingShop = isShop && shop?.shopStatus !== 'active';
    const hasNoShop = !shop?.shopId

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

    const handleLogout = () => {
        CustomAlert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất không?',
            [
                { text: 'Hủy' },
                { text: 'Đăng xuất', onPress: () => logout() }
            ]
        );
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
        : 'Tháng 11 năm 2023';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* 1. Header Gradient & Title */}
                <LinearGradient
                    colors={['#064e3b', '#10b981']}
                    style={styles.headerGradient}
                >
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

                {/* 2. Overlapping Avatar & Summary */}
                <View style={styles.contentWrap}>
                    <ProfileAvatar
                        uri={formData.avatarUrl}
                        onPickImage={pickImage}
                        isVerified={true}
                    />

                    <View style={styles.nameHeader}>
                        <Text style={styles.displayName}>
                            {isShop ? formData.shopName : formData.displayName}
                        </Text>
                        <View style={styles.verifiedRow}>
                            <ShieldCheck size={14} color="#10b981" fill="#ecfdf5" />
                            <Text style={styles.verifiedText}>ĐÃ XÁC THỰC</Text>
                        </View>
                    </View>

                    {/* 3. Micro Stats Bar */}
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

                    {/* 4. Action Banner (Shop Related) */}
                    <View style={styles.shopBannerArea}>
                        <TouchableOpacity
                            style={styles.savedPostsButton}
                            onPress={() => navigation.navigate('SavedPosts')}
                        >
                            <Heart color="#dc2626" size={20} />
                            <Text style={styles.savedPostsText}>Bài đăng đã lưu</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.savedPostsButton, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', marginTop: 12 }]}
                            onPress={() => navigation.navigate('Packages')}
                        >
                            <LayoutDashboard color="#16a34a" size={20} />
                            <Text style={[styles.savedPostsText, { color: '#16a34a' }]}>Cửa hàng tính năng</Text>
                        </TouchableOpacity>

                        {isCollaborator && (
                            <TouchableOpacity
                                style={[styles.beShopBanner, { marginBottom: 16, borderColor: '#dcfce7' }]}
                                onPress={() => navigation.navigate('CollaboratorRoot')}
                            >
                                <LinearGradient
                                    colors={['#fff', '#f0fdf4']}
                                    style={styles.beShopGrad}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <View style={[styles.beShopIcon, { backgroundColor: '#f0fdf4' }]}>
                                        <Briefcase color="#16a34a" size={24} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.beShopTitle, { color: '#166534' }]}>Chế độ Cộng tác viên</Text>
                                        <Text style={[styles.beShopDesc, { color: '#15803d' }]}>Quản lý nhiệm vụ và theo dõi thu nhập</Text>
                                    </View>
                                    <ChevronRight color="#16a34a" size={20} />
                                </LinearGradient>
                            </TouchableOpacity>
                        )}

                        {isActiveShop ? (
                            <View style={styles.shopActionsGrid}>
                                <TouchableOpacity
                                    style={[styles.shopActionButton, { backgroundColor: '#10b981' }]}
                                    onPress={() => navigation.navigate('MyShop')}
                                >
                                    <Store color="white" size={20} />
                                    <Text style={styles.shopActionText}>Cửa hàng của tôi</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.shopActionButton, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#10b981' }]}
                                    onPress={() => navigation.navigate('MyPost')}
                                >
                                    <FileText color="#10b981" size={20} />
                                    <Text style={[styles.shopActionText, { color: '#065f46' }]}>Quản lý tin đăng</Text>
                                </TouchableOpacity>
                            </View>
                        ) : isPendingShop ? (
                            <>
                                <TouchableOpacity
                                    style={[styles.beShopBanner, { borderColor: '#fef08a' }]}
                                    onPress={() => CustomAlert('Chờ duyệt', 'Hồ sơ cửa hàng của bạn đang được duyệt bởi ban quản trị.')}
                                >
                                    <LinearGradient
                                        colors={['#fff', '#fefce8']}
                                        style={styles.beShopGrad}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <View style={[styles.beShopIcon, { shadowColor: '#eab308' }]}>
                                            <Store color="#eab308" size={24} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.beShopTitle, { color: '#ca8a04' }]}>Đang chờ duyệt</Text>
                                            <Text style={[styles.beShopDesc, { color: '#a16207' }]}>Hồ sơ cửa hàng đang được xét duyệt</Text>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.shopActionButton, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#10b981' }]}
                                    onPress={() => navigation.navigate('MyPost')}
                                >
                                    <FileText color="#10b981" size={20} />
                                    <Text style={[styles.shopActionText, { color: '#065f46' }]}>Quản lý tin đăng</Text>
                                </TouchableOpacity>
                            </>
                        ) : hasNoShop ? (
                            <>
                                <TouchableOpacity
                                    style={styles.beShopBanner}
                                    onPress={() => navigation.navigate('RegisterShop')}
                                >
                                    <LinearGradient
                                        colors={['#fff', '#f0fdf4']}
                                        style={styles.beShopGrad}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <View style={styles.beShopIcon}>
                                            <Store color="#10b981" size={24} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.beShopTitle}>Trở thành người bán!</Text>
                                            <Text style={styles.beShopDesc}>Bắt đầu kinh doanh với các sản phẩm xanh</Text>
                                        </View>
                                        <ChevronRight color="#10b981" size={20} />
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.shopActionButton, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#10b981' }]}
                                    onPress={() => navigation.navigate('MyPost')}
                                >
                                    <FileText color="#10b981" size={20} />
                                    <Text style={[styles.shopActionText, { color: '#065f46' }]}>Quản lý tin đăng</Text>
                                </TouchableOpacity>
                            </>

                        ) : null}
                    </View>

                    {/* 5. Main Form Card */}
                    <View style={styles.formCardOuter}>
                        <View style={styles.formHeaderRow}>
                            <View style={styles.emeraldPoint} />
                            <Text style={styles.formSectionTitle}>
                                {isShop ? 'THÔNG TIN CỬA HÀNG' : 'THÔNG TIN CÁ NHÂN'}
                            </Text>
                        </View>
                        <ProfileForm formData={formData} setFormData={setFormData} isShop={isShop} />
                    </View>

                    {/* 6. Interaction Area */}
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text style={styles.primaryBtnText}>LƯU THAY ĐỔI</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.logoutBtn}
                        onPress={handleLogout}
                    >
                        <LogOut color="#ef4444" size={20} />
                        <Text style={styles.logoutBtnText}>ĐĂNG XUẤT</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerGradient: {
        width: '100%',
        height: 180,
        paddingTop: 30,
        paddingHorizontal: 24,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: 'white',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 2,
        marginTop: 2,
    },
    settingsBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentWrap: {
        paddingHorizontal: 20,
    },
    nameHeader: {
        alignItems: 'center',
        marginTop: 16,
    },
    displayName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0f172a',
        fontStyle: 'italic',
        textTransform: 'uppercase',
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
    verifiedText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#10b981',
        letterSpacing: 1,
    },
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
    statValB: {
        fontSize: 13,
        fontWeight: '900',
        color: '#334155',
        marginTop: 1,
    },
    dividerV: {
        width: 1,
        height: 30,
        backgroundColor: '#f1f5f9',
    },
    shopBannerArea: {
        marginVertical: 24,
        gap: 12,
    },
    savedPostsButton: {
        height: 56,
        borderRadius: 20,
        backgroundColor: '#fff1f2',
        borderWidth: 1,
        borderColor: '#fecdd3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    savedPostsText: {
        color: '#be123c',
        fontWeight: '800',
        fontSize: 14,
    },
    shopActionsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    shopActionButton: {
        flex: 1,
        height: 56,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    shopActionText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 14,
    },
    beShopBanner: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#dcfce7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    beShopGrad: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16,
    },
    beShopIcon: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    beShopTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#064e3b',
    },
    beShopDesc: {
        fontSize: 11,
        color: '#059669',
        fontWeight: '500',
        marginTop: 2,
    },
    formCardOuter: {
        backgroundColor: 'white',
        borderRadius: 32,
        paddingVertical: 24,
        paddingHorizontal: 20,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    formHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
        paddingLeft: 4,
    },
    emeraldPoint: {
        width: 4,
        height: 16,
        backgroundColor: '#10b981',
        borderRadius: 2,
    },
    formSectionTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: 1.5,
    },
    primaryBtn: {
        marginTop: 32,
        backgroundColor: '#064e3b',
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    primaryBtnText: {
        color: 'white',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 2,
    },
    logoutBtn: {
        marginTop: 16,
        marginBottom: 40,
        height: 56,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: '#fee2e2',
        backgroundColor: '#fffdfd',
    },
    logoutBtnText: {
        color: '#ef4444',
        fontWeight: '900',
        fontSize: 12,
        letterSpacing: 1,
    },
});

export default ProfileScreen;
