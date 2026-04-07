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
import * as ImagePicker from 'expo-image-picker'
import { Camera, ImageIcon, Play, Plus, User, X } from 'lucide-react-native';

const EditShopScreen = ({ route, navigation }: any) => {
    const { shop } = route.params;
    const { refreshShop } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUpLoadingImage] = useState(false);
    const [formData, setFormData] = useState({
        shopName: shop?.shopName || '',
        shopPhone: shop?.shopPhone || '',
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
            CustomAlert('Notice', 'Please grant photo library access');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: field !== 'shopGalleryImages', // Gallery không cần crop
            aspect: field === 'shopLogoUrl' ? [1, 1] : [16, 9],
            selectionLimit: 4, // Chỉ cho phép chọn tối đa 4 ảnh cho gallery
            quality: 0.7,
        });

        if (!result.canceled) {
            try {
                setUpLoadingImage(true);
                const uploadRes = await ProfileService.uploadAvatar(result.assets[0].uri);
                if (uploadRes?.urls?.[0]) {
                    const newUrl = uploadRes.urls[0];
                    // Xử lý riêng cho Gallery (Push vào mảng)
                    if (field === 'shopGalleryImages') {
                        setFormData((prev) => ({
                            ...prev,
                            shopGalleryImages: [...prev.shopGalleryImages, newUrl].slice(0, 4) // Giới hạn 4 ảnh
                        }));
                    } else {
                        // Xử lý cho Logo/Cover (Ghi đè string)
                        setFormData((prev) => ({ ...prev, [field]: newUrl }));
                    }
                    return;
                }

            } catch (e) {
                CustomAlert('Error', 'Unable to upload the image');
            } finally {
                setUpLoadingImage(false);
            }
        }
    };

    const handleUpdate = async () => {
        const phoneRegex = /^(0|84)(3|5|7|8|9)([0-9]{8})$/
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

        if (!formData.shopName.trim()) return CustomAlert('Error', 'Shop name is required');
        if (!formData.shopLat || !formData.shopLng) return CustomAlert('Error', 'Please update the shop location');

        if (formData.shopPhone.trim() && !phoneRegex.test(formData.shopPhone.trim())) {
            return CustomAlert('Error', 'Invalid Vietnamese phone number format');
        }

        if (formData.shopEmail.trim() && !emailRegex.test(formData.shopEmail.trim())) {
            return CustomAlert('Error', 'Invalid email address format');
        }

        const validateSocial = (url: string) => {
            if (url && !url.startsWith('http')) {
                return `https://${url}`;
            }
            return url;
        };

        if (uploadingImage) {
            return CustomAlert('Notice', 'Please wait until image upload is complete');
        }

        setLoading(true);
        try {
            const dataToSubmit = {
                shopName: formData.shopName.trim(),
                shopEmail: formData.shopEmail.trim() || undefined,
                shopPhone: formData.shopPhone.trim(),
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
                CustomAlert('Success', 'Information updated successfully');
                navigation.goBack();
            }
        } catch (error: any) {
            console.error(error);
            if (error.response?.status === 403) {
                CustomAlert('Yêu cầu xác thực', 'Cập nhật email thành công nhưng bạn cần xác thực lại email (Email change resets verification). Vui lòng xác thực Email của shop!');
            } else {
                CustomAlert('Error', error.response?.data?.error || 'Update failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <MobileLayout title="Edit Shop" backButton={() => navigation.goBack()}>
            <ScrollView style={styles.container}>

                <Text style={styles.label}>Shop images</Text>
                <View style={styles.imagePickerRow}>
                    <TouchableOpacity onPress={() => pickImage('shopLogoUrl')} style={styles.pickerBox}>
                        {formData.shopLogoUrl ? (
                            <Image source={{ uri: formData.shopLogoUrl }} style={styles.previewLogo} />
                        ) : (
                            <View style={styles.pickerInner}>
                                <ImageIcon color="#94a3b8" size={24} />
                                <Text style={styles.pickerText}>Logo</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => pickImage('shopCoverUrl')} style={styles.pickerBoxCover}>
                        {formData.shopCoverUrl ? (
                            <Image source={{ uri: formData.shopCoverUrl }} style={styles.previewCover} />
                        ) : (
                            <View style={styles.pickerInner}>
                                <Camera color="#94a3b8" size={24} />
                                <Text style={styles.pickerText}>Cover image</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
                <Text style={styles.label}>Shop Gallery (Max 4)</Text>
                <View style={styles.galleryContainer}>
                    {formData.shopGalleryImages.map((url: string, index: number) => (
                        <View key={index} style={styles.galleryItem}>
                            <Image source={{ uri: url }} style={styles.galleryImage} />
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
                    label="Shop name"
                    value={formData.shopName}
                    onChangeText={(txt) => setFormData({ ...formData, shopName: txt })}
                />

                <Input
                    label="Shop Email"
                    value={formData.shopEmail}
                    onChangeText={(txt) => setFormData({ ...formData, shopEmail: txt })}
                    type="email-address"
                    placeholder="Example: contact@greenmarket.com"
                />

                <Input
                    label="Shop phone"
                    value={formData.shopPhone}
                    onChangeText={(txt) => setFormData({ ...formData, shopPhone: txt })}
                    type="phone-pad"
                />

                <Input
                    label="Shop description"
                    value={formData.shopDescription}
                    multiline
                    numberOfLines={4}
                    onChangeText={(txt) => setFormData({ ...formData, shopDescription: txt })}
                />

                <Text style={styles.label}>Address & Location</Text>
                <AddressPicker
                    label="Shop address"
                    address={formData.shopLocation}
                    onAddressChange={(addr) => setFormData({ ...formData, shopLocation: addr })}
                    onLocationSelect={(lat, lng) => {
                        setFormData({ ...formData, shopLat: lat, shopLng: lng })
                    }}
                />

                <Text style={styles.label}>Social Media</Text>
                <Input
                    placeholder="Facebook URL"
                    value={formData.shopFacebook}
                    onChangeText={(t) => setFormData({ ...formData, shopFacebook: t })}
                    icon={<User size={18} color="#1877F2" />}
                />
                <Input
                    placeholder="Instagram URL"
                    value={formData.shopInstagram}
                    onChangeText={(t) => setFormData({ ...formData, shopInstagram: t })}
                    icon={<Camera size={18} color="#E4405F" />}
                />
                <Input
                    placeholder="Youtube URL"
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
                    Save changes
                </Button>
            </ScrollView>
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
});

export default EditShopScreen;
