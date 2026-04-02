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
import { Camera, ImageIcon } from 'lucide-react-native';

const EditShopScreen = ({ route, navigation }: any) => {
    const { shop } = route.params;
    const { refreshShop } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        shopName: shop?.shopName || '',
        shopPhone: shop?.shopPhone || '',
        shopLocation: shop?.shopLocation || '',
        shopDescription: shop?.shopDescription || '',
        shopLogoUrl: shop?.shopLogoUrl || '',
        shopCoverUrl: shop?.shopCoverUrl || '',
        shopLat: shop?.shopLat,
        shopLng: shop?.shopLng,
    });

    const pickImage = async (field: 'shopLogoUrl' | 'shopCoverUrl') => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            CustomAlert('Notice', 'Please grant photo library access');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: field === 'shopLogoUrl' ? [1, 1] : [16, 9],
            quality: 0.7,
        });

        if (!result.canceled) {
            try {
                setLoading(true);
                const uploadRes = await ProfileService.uploadAvatar(result.assets[0].uri);
                if (uploadRes?.urls?.[0]) {
                    setFormData(prev => ({ ...prev, [field]: uploadRes.urls[0] }));
                }
            } catch (e) {
                CustomAlert('Error', 'Unable to upload the image');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleUpdate = async () => {
        if (!formData.shopName) return CustomAlert('Error', 'Shop name is required');
        if (!formData.shopLat || !formData.shopLng) return CustomAlert('Error', 'Please update the shop location');

        setLoading(true);
        try {
            const dataToSubmit = {
                ...formData,
                shopLat: formData.shopLat ? String(formData.shopLat) : '0',
                shopLng: formData.shopLng ? String(formData.shopLng) : '0',
            };

            const res = await ShopService.updateShop(shop.shopId, dataToSubmit);
            if (res) {
                await refreshShop();
                CustomAlert('Success', 'Information updated successfully');
                navigation.goBack();
            }
        } catch (error: any) {
            console.error(error);
            CustomAlert('Error', error.response?.data?.error || 'Update failed');
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

                <Input
                    label="Shop name"
                    value={formData.shopName}
                    onChangeText={(txt) => setFormData({ ...formData, shopName: txt })}
                />

                <Input
                    label="Phone number"
                    value={formData.shopPhone}
                    type="phone-pad"
                    onChangeText={(txt) => setFormData({ ...formData, shopPhone: txt })}
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

                <Button
                    onPress={handleUpdate}
                    loading={loading}
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
    saveBtn: { marginTop: 30, backgroundColor: '#10b981', marginBottom: 50 }
});

export default EditShopScreen;
