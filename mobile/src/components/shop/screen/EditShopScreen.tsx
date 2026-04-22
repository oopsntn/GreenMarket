import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import Input from '../../Reused/Input/Input';
import Button from '../../Reused/Button/Button';
import { ShopService } from '../service/shopService';
import CustomAlert from '../../../utils/AlertHelper';
import { useAuth } from '../../../context/AuthContext';
import AddressPicker from '../components/AddressPicker';
import { ProfileService } from '../../profile/service/ProfileService';
import { postService } from '../../post/service/postService';
import * as ImagePicker from 'expo-image-picker'
import { Camera, ImageIcon, Play, Plus, User, X, Phone as PhoneIcon, ShieldCheck, Mail } from 'lucide-react-native';
import PhoneManagementModal from '../components/PhoneManagementModal';
import EmailVerificationModal from '../components/EmailVerificationModal';
import { resolveImageUrl } from '../../../utils/resolveImageUrl';

const EditShopScreen = ({ route, navigation }: any) => {
    const { shop } = route.params;
    const { refreshShop } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUpLoadingImage] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [shopEmailVerified, setShopEmailVerified] = useState<boolean>(shop?.shopEmailVerified ?? false);
    const [phones, setPhones] = useState<string[]>(
        shop?.phones || (shop?.shopPhone ? String(shop.shopPhone).split('|').map((item: string) => item.trim()).filter(Boolean) : [])
    );
    const [formData, setFormData] = useState({
        shopName: shop?.shopName || '',
        shopPhone: shop?.phones?.[0] || shop?.shopPhone || '',
        shopEmail: shop?.shopEmail || '',
        shopLocation: shop?.shopLocation || '',
        shopDescription: shop?.shopDescription || '',
        shopLogoUrl: shop?.shopLogoUrl || '',
        shopCoverUrl: shop?.shopCoverUrl || '',
        shopLat: shop?.shopLat,
        shopLng: shop?.shopLng,
        shopGalleryImages: typeof shop?.shopGalleryImages === 'string'
            ? shop.shopGalleryImages.split('|')
            : (shop?.shopGalleryImages || []),
        shopFacebook: shop?.shopFacebook || '',
        shopInstagram: shop?.shopInstagram || '',
        shopYoutube: shop?.shopYoutube || '',
    });

    const removeGalleryImage = (index: number) => {
        const newGallery = [...formData.shopGalleryImages];
        newGallery.splice(index, 1);
        setFormData({ ...formData, shopGalleryImages: newGallery });
    };

    const pickImage = async (field: 'shopLogoUrl' | 'shopCoverUrl' | 'shopGalleryImages') => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            CustomAlert('Yêu cầu quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để chọn ảnh');
            return;
        }

        const isGallery = field === 'shopGalleryImages';
        const isLogo = field === 'shopLogoUrl';

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: isLogo,                       // crop vuông chỉ cho logo
            aspect: isLogo ? [1, 1] : undefined,
            allowsMultipleSelection: isGallery,          // FIX: bật multi-select cho gallery
            selectionLimit: isGallery ? Math.max(1, 4 - formData.shopGalleryImages.length) : 1,
            quality: 0.7,
        });

        if (!result.canceled && result.assets?.length) {
            try {
                setUpLoadingImage(true);

                if (isGallery) {
                    // FIX: upload nhiều ảnh cùng lúc bằng postService.uploadMedia
                    const uris = result.assets.map((a) => a.uri);
                    const uploadRes = await postService.uploadMedia(uris);
                    if (uploadRes?.urls?.length) {
                        setFormData((prev) => ({
                            ...prev,
                            shopGalleryImages: [...prev.shopGalleryImages, ...uploadRes.urls].slice(0, 4),
                        }));
                    }
                } else {
                    // Logo / Cover: upload 1 ảnh
                    const uploadRes = await ProfileService.uploadAvatar(result.assets[0].uri);
                    if (uploadRes?.urls?.[0]) {
                        setFormData((prev) => ({ ...prev, [field]: uploadRes.urls[0] }));
                    }
                }
            } catch (e) {
                CustomAlert('Lỗi', 'Không thể tải ảnh lên');
            } finally {
                setUpLoadingImage(false);
            }
        }
    };

    const handleUpdate = async () => {
        const phoneRegex = /^(0|84)(3|5|7|8|9)([0-9]{8})$/
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

        if (!formData.shopName.trim()) return CustomAlert('Lỗi', 'Vui lòng nhập tên cửa hàng');
        if (!formData.shopLat || !formData.shopLng) return CustomAlert('Lỗi', 'Vui lòng cập nhật tọa độ cửa hàng');

        if (formData.shopEmail.trim() && !emailRegex.test(formData.shopEmail.trim())) {
            return CustomAlert('Lỗi', 'Định dạng email không hợp lệ');
        }

        const validateSocial = (url: string) => {
            if (url && !url.startsWith('http')) {
                return `https://${url}`;
            }
            return url;
        };

        if (uploadingImage) {
            return CustomAlert('Thông báo', 'Vui lòng chờ tải ảnh lên hoàn tất');
        }

        setLoading(true);
        try {
            const dataToSubmit = {
                shopName: formData.shopName.trim(),
                shopEmail: formData.shopEmail.trim() || undefined,
                shopLocation: formData.shopLocation.trim(),
                shopDescription: formData.shopDescription.trim(),
                shopLat: formData.shopLat,
                shopLng: formData.shopLng,
                shopLogoUrl: formData.shopLogoUrl || undefined,
                shopCoverUrl: formData.shopCoverUrl || undefined,
                shopGalleryImages: formData.shopGalleryImages,
                shopFacebook: validateSocial(formData.shopFacebook).trim() || undefined,
                shopInstagram: validateSocial(formData.shopInstagram).trim() || undefined,
                shopYoutube: validateSocial(formData.shopYoutube).trim() || undefined,
            };

            const res = await ShopService.updateShop(shop.shopId, dataToSubmit);
            if (res) {
                await refreshShop();
                CustomAlert('Thành công', 'Thông tin đã được cập nhật');
                navigation.goBack();
            }
        } catch (error: any) {
            console.error(error);
            if (error.response?.status === 403) {
                CustomAlert('Yêu cầu xác thực', 'Cập nhật email thành công nhưng bạn cần xác thực lại email. Vui lòng xác thực Email của shop!');
            } else {
                CustomAlert('Lỗi', error.response?.data?.error || 'Cập nhật thất bại');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <MobileLayout title="Chỉnh sửa cửa hàng" backButton={() => navigation.goBack()}>
            <ScrollView style={styles.container}>

                <Text style={styles.label}>Ảnh đại diện và bản đồ</Text>
                <View style={styles.imagePickerRow}>
                    <TouchableOpacity onPress={() => pickImage('shopLogoUrl')} style={styles.pickerBox}>
                        {formData.shopLogoUrl ? (
                            <Image source={{ uri: resolveImageUrl(formData.shopLogoUrl) }} style={styles.previewLogo} />
                        ) : (
                            <View style={styles.pickerInner}>
                                <ImageIcon color="#94a3b8" size={24} />
                                <Text style={styles.pickerText}>Ảnh đại diện</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => pickImage('shopCoverUrl')} style={styles.pickerBoxCover}>
                        {formData.shopCoverUrl ? (
                            <Image source={{ uri: resolveImageUrl(formData.shopCoverUrl) }} style={styles.previewCover} />
                        ) : (
                            <View style={styles.pickerInner}>
                                <Camera color="#94a3b8" size={24} />
                                <Text style={styles.pickerText}>Ảnh bìa</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
                <Text style={styles.label}>Hình ảnh cửa hàng (Tối đa 4 ảnh)</Text>
                <View style={styles.galleryContainer}>
                    {formData.shopGalleryImages.map((url: string, index: number) => (
                        <View key={index} style={styles.galleryItem}>
                            <Image source={{ uri: resolveImageUrl(url) }} style={styles.galleryImage} />
                            <TouchableOpacity
                                style={styles.removeBadge}
                                onPress={() => removeGalleryImage(index)}
                            >
                                <X size={12} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    {formData.shopGalleryImages.length < 4 && (
                        <TouchableOpacity
                            style={styles.addGalleryBtn}
                            onPress={() => pickImage('shopGalleryImages')}
                        >
                            <Plus size={24} color="#94a3b8" />
                        </TouchableOpacity>
                    )}
                </View>
                <Input
                    label="Tên cửa hàng"
                    value={formData.shopName}
                    onChangeText={(txt) => setFormData({ ...formData, shopName: txt })}
                />

                {/* ─── Email + xác thực ─── */}
                <Text style={styles.label}>Email cửa hàng</Text>
                <View style={styles.emailRow}>
                    <View style={{ flex: 1 }}>
                        <Input
                            placeholder="Ví dụ: admin@greenmarket.com"
                            value={formData.shopEmail}
                            onChangeText={(txt) => setFormData({ ...formData, shopEmail: txt })}
                            type="email-address"
                        />
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.verifyEmailBtn,
                            shopEmailVerified ? styles.verifyEmailBtnVerified : styles.verifyEmailBtnPending,
                        ]}
                        onPress={() => setShowEmailModal(true)}
                    >
                        <ShieldCheck size={16} color={shopEmailVerified ? '#10b981' : '#64748b'} />
                        <Text style={[
                            styles.verifyEmailBtnText,
                            { color: shopEmailVerified ? '#10b981' : '#64748b' },
                        ]}>
                            {shopEmailVerified ? 'Đã xác thực' : 'Xác thực'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <Input
                    label="Số điện thoại chính"
                    value={formData.shopPhone}
                    onChangeText={(txt) => setFormData({ ...formData, shopPhone: txt })}
                    type="phone-pad"
                    disabled
                />

                <TouchableOpacity
                    style={styles.managePhoneBtn}
                    onPress={() => setShowPhoneModal(true)}
                >
                    <PhoneIcon size={16} color="#3b82f6" />
                    <Text style={styles.managePhoneText}>
                        Quản lý số điện thoại ({phones.length}/3)
                    </Text>
                </TouchableOpacity>

                <Input
                    label="Mô tả cửa hàng"
                    value={formData.shopDescription}
                    multiline
                    numberOfLines={4}
                    onChangeText={(txt) => setFormData({ ...formData, shopDescription: txt })}
                />

                <Text style={styles.label}>Địa chỉ & Bản đồ</Text>
                <AddressPicker
                    label="Địa chỉ cửa hàng"
                    address={formData.shopLocation}
                    onAddressChange={(addr) => setFormData({ ...formData, shopLocation: addr })}
                    onLocationConfirmed={(data) => {
                        setFormData(prev => ({
                            ...prev,
                            shopLocation: data.fullAddress,
                            shopLat: data.lat,
                            shopLng: data.lng,
                        }))
                    }}
                />

                <Text style={styles.label}>Mạng xã hội</Text>
                <Input
                    placeholder="Đường dẫn Facebook"
                    value={formData.shopFacebook}
                    onChangeText={(t) => setFormData({ ...formData, shopFacebook: t })}
                    icon={<User size={18} color="#1877F2" />}
                />
                <Input
                    placeholder="Đường dận Instagram"
                    value={formData.shopInstagram}
                    onChangeText={(t) => setFormData({ ...formData, shopInstagram: t })}
                    icon={<Camera size={18} color="#E4405F" />}
                />
                <Input
                    placeholder="Đường dận Youtube"
                    value={formData.shopYoutube}
                    onChangeText={(t) => setFormData({ ...formData, shopYoutube: t })}
                    icon={<Play size={18} color="#FF0000" />}
                />

                <Button
                    onPress={handleUpdate}
                    loading={loading || uploadingImage}
                    disabled={loading || uploadingImage}
                    style={styles.saveBtn}
                >
                    Lưu thay đổi
                </Button>
            </ScrollView>

            <PhoneManagementModal
                visible={showPhoneModal}
                onClose={() => setShowPhoneModal(false)}
                phones={phones}
                shopEmail={formData.shopEmail}
                shopEmailVerified={shopEmailVerified}
                onPhonesChange={(newPhones) => {
                    setPhones(newPhones);
                    // Cập nhật SĐT chính hiển thị
                    if (newPhones[0]) setFormData(prev => ({ ...prev, shopPhone: newPhones[0] }))
                }}
            />
            <EmailVerificationModal
                visible={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                currentEmail={formData.shopEmail}
                isVerified={shopEmailVerified}
                onVerified={(verifiedEmail) => {
                    setFormData(prev => ({ ...prev, shopEmail: verifiedEmail }));
                    setShopEmailVerified(true);
                }}
            />
        </MobileLayout>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 10, marginTop: 10 },
    imagePickerRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    pickerBox: { flex: 1, height: 100, borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', borderRadius: 16, overflow: 'hidden' },
    pickerBoxCover: { flex: 2, height: 100, borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', borderRadius: 16, overflow: 'hidden' },
    pickerInner: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
    pickerText: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
    previewLogo: { width: '100%', height: '100%' },
    previewCover: { width: '100%', height: '100%', resizeMode: 'cover' },
    saveBtn: { marginTop: 30, backgroundColor: '#10b981', marginBottom: 50 },
    galleryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    galleryItem: { width: '48%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden' },
    galleryImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    removeBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 2 },
    addGalleryBtn: { width: '48%', aspectRatio: 1, borderRadius: 12, borderWidth: 2, borderColor: '#cbd5e1', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
    managePhoneBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        padding: 12,
        borderRadius: 8,
        marginTop: -10,
        marginBottom: 16,
    },
    managePhoneText: {
        color: '#3b82f6',
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 14,
    },
    emailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: -8,
        marginBottom: 8,
    },
    verifyEmailBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
    },
    verifyEmailBtnVerified: {
        backgroundColor: '#f0fdf4',
        borderColor: '#bbf7d0',
    },
    verifyEmailBtnPending: {
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0',
    },
    verifyEmailBtnText: {
        fontSize: 11,
        fontWeight: '700',
    },
});

export default EditShopScreen;
