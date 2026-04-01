import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Image, TouchableOpacity, Alert, Text } from 'react-native';
import { Store, CheckCircle, ArrowRight, Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import Input from '../../Reused/Input/Input';
import Button from '../../Reused/Button/Button';
import { ShopService } from '../service/shopService';
import CustomAlert from '../../../utils/AlertHelper';
import { ProfileService } from '../../profile/service/ProfileService';
import AddressPicker from '../components/AddressPicker';
import { useAuth } from '../../../context/AuthContext';


const RegisterShopScreen = ({ navigation }: any) => {
    const [formData, setFormData] = useState({
        shopName: '',
        shopPhone: '',
        shopLocation: '',
        shopDescription: '',
        shopLogoUrl: '',
        shopCoverUrl: '',
        shopLat: undefined as number | undefined,
        shopLng: undefined as number | undefined
    });

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const { refreshShop } = useAuth()
    // Hàm chọn ảnh chung cho cả Logo và Cover
    const pickImage = async (field: 'shopLogoUrl' | 'shopCoverUrl') => {
        let result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: field === 'shopLogoUrl' ? [1, 1] : [16, 9],
            quality: 0.7,
        });

        if (!result.canceled) {
            const localUri = result.assets[0].uri

            try {
                setLoading(true)
                //Upload len server lay link vinh vien
                const uploadRes = await ProfileService.uploadAvatar(localUri)

                if (uploadRes && uploadRes.urls && uploadRes.urls.length > 0) {
                    const serverUrl = uploadRes.urls[0]
                    //set link vao formData
                    setFormData(prev => ({ ...prev, [field]: serverUrl }));
                }
            } catch (e) {
                CustomAlert("Lỗi phát sinh", "Không thể tải ảnh lên. Vui lòng thử lại!")
            } finally {
                setLoading(false)
            }

        }
    };

    const handleAddressChange = (addr: string) => {
        setFormData(prev => ({ ...prev, shopLocation: addr }));
    };

    const handleLocationSelect = (lat: number, lng: number) => {
        setFormData(prev => ({ ...prev, shopLat: lat, shopLng: lng }));
    }

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Đảm bảo không có trường nào là undefined
            const cleanData = {
                shopName: formData.shopName,
                shopPhone: formData.shopPhone,
                shopLocation: formData.shopLocation,
                shopDescription: formData.shopDescription,
                shopLogoUrl: formData.shopLogoUrl,
                shopCoverUrl: formData.shopCoverUrl,
                shopLat: formData.shopLat || 0, // Hardcode 0 để test
                shopLng: formData.shopLng || 0,
            };

            const res = await ShopService.createShop(cleanData);
            if (res) {
                await refreshShop();
                setSubmitted(true);
            }
        } catch (error: any) {
            // Xem Backend chửi gì ở đây
            const errorMsg = error.response?.data?.error || "Lỗi không xác định";
            CustomAlert("Thất bại", errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Giao diện Thành công (Success Message trong sơ đồ)
    if (submitted) {
        return (
            <View style={styles.successContainer}>
                <View style={styles.successCard}>
                    <View style={styles.iconCircle}>
                        <CheckCircle color="#10b981" size={40} />
                    </View>
                    <Text style={styles.successTitle}>Đăng ký thành công!</Text>
                    <Text style={styles.successDesc}>
                        Hồ sơ nhà vườn của bạn đang được duyệt. Chúng tôi sẽ thông báo cho bạn sớm nhất.
                    </Text>
                    <Button
                        fullWidth
                        icon={<ArrowRight size={18} color="#fff" />}
                        onPress={() => navigation.navigate('MyShop')}
                    >
                        Quay lại Chợ
                    </Button>
                </View>
            </View>
        );
    }

    return (
        <MobileLayout title="Mở Nhà Vườn">
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Store color="#10b981" size={48} />
                    <Text style={styles.title}>Bắt đầu kinh doanh</Text>
                    <Text style={styles.subtitle}>Điền thông tin để tạo gian hàng của bạn</Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Tên Nhà Vườn *"
                        placeholder="Ví dụ: Vườn Bonsai Hữu Tình"
                        value={formData.shopName}
                        onChangeText={(txt) => setFormData({ ...formData, shopName: txt })}
                    />

                    <View style={styles.imagePickerRow}>
                        {/* Logo Picker */}
                        <TouchableOpacity onPress={() => pickImage('shopLogoUrl')} style={styles.pickerBox}>
                            {formData.shopLogoUrl ? (
                                <Image source={{ uri: formData.shopLogoUrl }} style={styles.previewLogo} />
                            ) : (
                                <View style={styles.pickerInner}>
                                    <ImageIcon color="#94a3b8" size={24} />
                                    <Text style={styles.pickerText}>Logo vuông</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Cover Picker */}
                        <TouchableOpacity onPress={() => pickImage('shopCoverUrl')} style={styles.pickerBoxCover}>
                            {formData.shopCoverUrl ? (
                                <Image source={{ uri: formData.shopCoverUrl }} style={styles.previewCover} />
                            ) : (
                                <View style={styles.pickerInner}>
                                    <Camera color="#94a3b8" size={24} />
                                    <Text style={styles.pickerText}>Ảnh bìa</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <Input
                        label="Số Điện Thoại Shop"
                        type="phone-pad"
                        value={formData.shopPhone}
                        onChangeText={(txt) => setFormData({ ...formData, shopPhone: txt })}
                    />

                    <Input
                        label="Mô tả nhà vườn"
                        multiline
                        numberOfLines={4}
                        value={formData.shopDescription}
                        onChangeText={(txt) => setFormData({ ...formData, shopDescription: txt })}
                    />

                    {/* Phần AddressPicker */}
                    <View style={{ marginBottom: 20 }}>
                        {/* <AddressPicker ... /> */}
                        <AddressPicker
                            label="Vị trí nhà vườn *"
                            address={formData.shopLocation}
                            onAddressChange={handleAddressChange}
                            onLocationSelect={handleLocationSelect}
                        />
                    </View>

                    <Button
                        onPress={handleSubmit}
                        loading={loading}
                        fullWidth
                        style={styles.submitBtn}
                    >
                        Gửi Đăng Ký
                    </Button>
                </View>
            </ScrollView>
        </MobileLayout>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20 },
    header: { alignItems: 'center', marginVertical: 30 },
    title: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginTop: 12 },
    subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
    form: { paddingBottom: 50 },
    imagePickerRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    pickerBox: { flex: 1, height: 100, borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', borderRadius: 16, overflow: 'hidden' },
    pickerBoxCover: { flex: 2, height: 100, borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', borderRadius: 16, overflow: 'hidden' },
    pickerInner: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
    pickerText: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
    previewLogo: { width: '100%', height: '100%' },
    previewCover: { width: '100%', height: '100%', resizeMode: 'cover' },
    label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
    submitBtn: { marginTop: 10, backgroundColor: '#10b981' },
    // Success styles
    successContainer: { flex: 1, backgroundColor: '#f0fdf4', justifyContent: 'center', padding: 24 },
    successCard: { backgroundColor: '#fff', padding: 32, borderRadius: 32, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    successTitle: { fontSize: 22, fontWeight: '800', color: '#064e3b', marginBottom: 12 },
    successDesc: { textAlign: 'center', color: '#6b7280', lineHeight: 20, marginBottom: 32 }
});

export default RegisterShopScreen;