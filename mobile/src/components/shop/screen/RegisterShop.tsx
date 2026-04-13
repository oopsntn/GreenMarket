import React, { useMemo, useState } from 'react'
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ArrowRight, Camera, CheckCircle, Image as ImageIcon, Play, Plus, Store, User, X } from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import Input from '../../Reused/Input/Input'
import Button from '../../Reused/Button/Button'
import { ShopService } from '../service/shopService'
import CustomAlert from '../../../utils/AlertHelper'
import { ProfileService } from '../../profile/service/ProfileService'
import AddressPicker from '../components/AddressPicker'
import { useAuth } from '../../../context/AuthContext'

const RegisterShopScreen = ({ navigation }: any) => {
    const { refreshShop, shop } = useAuth()
    const [formData, setFormData] = useState({
        shopName: '',
        shopPhone: '',
        shopLocation: '',
        shopDescription: '',
        shopLogoUrl: '',
        shopCoverUrl: '',
        shopLat: undefined as number | undefined,
        shopLng: undefined as number | undefined,
        shopEmail: '',
        shopFacebook: '',
        shopInstagram: '',
        shopYoutube: '',
        shopGalleryImages: [] as string[],
    })
    const [loading, setLoading] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const hasExistingShop = useMemo(
        () => !!shop?.shopId,
        [shop]
    )

    const pickImage = async (field: 'shopLogoUrl' | 'shopCoverUrl' | 'shopGalleryImages') => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permission.granted) {
            CustomAlert('Notice', 'Please grant photo library access')
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: field !== 'shopGalleryImages',
            aspect: field === 'shopLogoUrl' ? [1, 1] : [16, 9],
            selectionLimit: 4,
            quality: 0.7,
        })

        if (result.canceled) {
            return
        }

        try {
            setUploadingImage(true);
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
            console.error('Error uploading shop image:', e)
            CustomAlert('Upload error', 'Unable to upload the image. Please try again.')
        } finally {
            setUploadingImage(false)
        }
    }

    const handleAddressChange = (addr: string) => {
        setFormData((prev) => ({ ...prev, shopLocation: addr }))
    }

    const handleLocationSelect = (lat: number, lng: number) => {
        setFormData((prev) => ({ ...prev, shopLat: lat, shopLng: lng }))
    }

    const validateForm = () => {
        const phoneRegex = /^(0|84)(3|5|7|8|9)([0-9]{8})$/
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

        if (!formData.shopName.trim()) {
            CustomAlert('Error', 'Please enter the shop name')
            return false
        }

        if (formData.shopPhone.trim() && !phoneRegex.test(formData.shopPhone.trim())) {
            CustomAlert('Error', 'Invalid Vietnamese phone number format')
            return false
        }

        if (formData.shopEmail.trim() && !emailRegex.test(formData.shopEmail.trim())) {
            CustomAlert('Error', 'Invalid email address format')
            return false
        }

        if (!formData.shopLocation.trim()) {
            CustomAlert('Error', 'Please enter or fetch the shop location')
            return false
        }

        if (!formData.shopLat || !formData.shopLng) {
            CustomAlert('Error', 'Please get the shop coordinates')
            return false
        }

        return true
    }

    const handleSubmit = async () => {
        if (hasExistingShop) {
            CustomAlert('Notice', 'This account already has a shop. Please manage your current shop instead.')
            return
        }

        if (!validateForm()) {
            return
        }

        if (uploadingImage) {
            CustomAlert('Notice', 'Please wait until the image upload is complete before submitting')
            return
        }

        const validateSocial = (url: string) => {
            if (url && !url.startsWith('http')) {
                return `https://${url}`; 
            }
            return url;
        };
        setLoading(true)
        try {
            const cleanData = {
                shopName: formData.shopName.trim(),
                shopPhone: formData.shopPhone.trim(),
                shopEmail: formData.shopEmail.trim() || undefined,
                shopLocation: formData.shopLocation.trim(),
                shopDescription: formData.shopDescription.trim(),
                shopLat: formData.shopLat,
                shopLng: formData.shopLng,
                shopLogoUrl: formData.shopLogoUrl || undefined,
                shopCoverUrl: formData.shopCoverUrl || undefined,
                // Gửi mảng ảnh, BE sẽ tự xử lý join "|"
                shopGalleryImages: formData.shopGalleryImages,
                shopFacebook: validateSocial(formData.shopFacebook).trim() || undefined,
                shopInstagram: validateSocial(formData.shopInstagram).trim() || undefined,
                shopYoutube: validateSocial(formData.shopYoutube).trim() || undefined,
            }

            const res = await ShopService.createShop(cleanData)
            if (res) {
                await refreshShop()
                setSubmitted(true)
            }
        } catch (error: any) {
            const errorMsg = `Register shop error: ${error.response?.data?.error}` || 'Unknown error'

            if (error.response?.data?.error === 'User already has a shop registered') {
                await refreshShop()
                CustomAlert('Notice', 'The system confirmed that this account already has a shop.')
                return
            }

            CustomAlert('Failed', errorMsg)
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <View style={styles.successContainer}>
                <View style={styles.successCard}>
                    <View style={styles.iconCircle}>
                        <CheckCircle color="#10b981" size={40} />
                    </View>
                    <Text style={styles.successTitle}>Registration successful!</Text>
                    <Text style={styles.successDesc}>
                        Your shop profile is being reviewed. We will notify you as soon as possible.
                    </Text>
                    <Button
                        fullWidth
                        icon={<ArrowRight size={18} color="#fff" />}
                        onPress={() => navigation.navigate('MyShop')}
                        style={styles.primaryAction}
                    >
                        View my shop
                    </Button>
                </View>
            </View>
        )
    }

    if (hasExistingShop) {
        return (
            <MobileLayout title="Open Shop" backButton={() => navigation.goBack()}>
                <View style={styles.successContainer}>
                    <View style={styles.successCard}>
                        <View style={styles.iconCircle}>
                            <Store color="#10b981" size={40} />
                        </View>
                        <Text style={styles.successTitle}>You already have a shop</Text>
                        <Text style={styles.successDesc}>
                            Each account can currently own only one shop. You can view or edit the existing profile.
                        </Text>
                        <Button
                            fullWidth
                            onPress={() => navigation.navigate('MyShop')}
                            style={styles.primaryAction}
                        >
                            View my shop
                        </Button>
                        <Button
                            fullWidth
                            variant="outline"
                            onPress={() => navigation.navigate('EditShop', { shop })}
                            style={styles.secondaryAction}
                            textStyle={{ color: '#10b981' }}
                        >
                            Edit information
                        </Button>
                    </View>
                </View>
            </MobileLayout>
        )
    }

    return (
        <MobileLayout title="Open Shop" backButton={() => navigation.goBack()}>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
            >
                <View style={styles.header}>
                    <Store color="#10b981" size={48} />
                    <Text style={styles.title}>Start selling</Text>
                    <Text style={styles.subtitle}>Fill in the information to create your shop</Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Shop Name *"
                        placeholder="Example: Green Bonsai Garden"
                        value={formData.shopName}
                        onChangeText={(txt) => setFormData({ ...formData, shopName: txt })}
                        required
                    />

                    <View style={styles.imagePickerRow}>
                        <TouchableOpacity
                            onPress={() => pickImage('shopLogoUrl')}
                            style={styles.pickerBox}
                            disabled={loading || uploadingImage}
                        >
                            {formData.shopLogoUrl ? (
                                <Image source={{ uri: formData.shopLogoUrl }} style={styles.previewLogo} />
                            ) : (
                                <View style={styles.pickerInner}>
                                    <ImageIcon color="#94a3b8" size={24} />
                                    <Text style={styles.pickerText}>Square logo</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => pickImage('shopCoverUrl')}
                            style={styles.pickerBoxCover}
                            disabled={loading || uploadingImage}
                        >
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


                    {/* Gallery Section */}
                    <Text style={styles.label}>Shop Gallery (Max 4)</Text>
                    <View style={styles.galleryContainer}>
                        {formData.shopGalleryImages.map((url, index) => (
                            <View key={index} style={styles.galleryItem}>
                                <Image source={{ uri: url }} style={styles.galleryImage} />
                                <TouchableOpacity
                                    style={styles.removeBadge}
                                    onPress={() => {
                                        const newGallery = formData.shopGalleryImages.filter((_, i) => i !== index);
                                        setFormData({ ...formData, shopGalleryImages: newGallery });
                                    }}
                                >
                                    <X size={12} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {formData.shopGalleryImages.length < 4 && (
                            <TouchableOpacity style={styles.addGalleryBtn} onPress={pickImage.bind(null, 'shopGalleryImages')}>
                                <Plus size={24} color="#94a3b8" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <Text style={styles.helperText}>
                        {uploadingImage ? 'Uploading image...' : 'Logo and cover image are optional, but recommended to make your shop look more professional.'}
                    </Text>

                    <Input
                        label="Shop Email"
                        type="email-address"
                        value={formData.shopEmail}
                        onChangeText={(txt) => setFormData({ ...formData, shopEmail: txt })}
                        placeholder="Example: contact@greenmarket.com"
                    />

                    <Input
                        label="Shop Phone Number"
                        type="phone-pad"
                        value={formData.shopPhone}
                        onChangeText={(txt) => setFormData({ ...formData, shopPhone: txt })}
                        placeholder="Example: 0912345678"
                    />

                    <Input
                        label="Shop Description"
                        multiline
                        numberOfLines={4}
                        value={formData.shopDescription}
                        onChangeText={(txt) => setFormData({ ...formData, shopDescription: txt })}
                        placeholder="Describe your main products, garden style, contact hours..."
                    />

                    <View style={{ marginBottom: 20 }}>
                        <AddressPicker
                            label="Shop Location *"
                            address={formData.shopLocation}
                            onAddressChange={handleAddressChange}
                            onLocationSelect={(addr, lat, lng) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    shopLocation: addr,
                                    shopLat: lat,
                                    shopLng: lng,
                                }))
                            }
                            }
                        />
                        {formData.shopLat ? (
                            <Text style={styles.coordinateText}>
                                Coordinates received: {formData.shopLat.toFixed(4)}, {formData.shopLng?.toFixed(4)}
                            </Text>
                        ) : null}
                    </View>

                    {/* Social Media Section */}
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
                        icon={<Play size={18} color="#E4405F" />}
                    />

                    <Button
                        onPress={handleSubmit}
                        loading={loading || uploadingImage}
                        disabled={loading || uploadingImage}
                        fullWidth
                        style={styles.submitBtn}
                    >
                        Submit Registration
                    </Button>
                </View>
            </ScrollView>
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8, marginTop: 16 },
    container: { padding: 20 },
    header: { alignItems: 'center', marginVertical: 30 },
    title: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginTop: 12 },
    subtitle: { fontSize: 14, color: '#64748b', marginTop: 4, textAlign: 'center' },
    form: { paddingBottom: 50 },
    imagePickerRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    pickerBox: { flex: 1, height: 100, borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', borderRadius: 16, overflow: 'hidden' },
    pickerBoxCover: { flex: 2, height: 100, borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', borderRadius: 16, overflow: 'hidden' },
    pickerInner: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
    pickerText: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
    previewLogo: { width: '100%', height: '100%' },
    previewCover: { width: '100%', height: '100%', resizeMode: 'cover' },
    helperText: { fontSize: 12, color: '#64748b', marginBottom: 16 },
    coordinateText: { fontSize: 10, color: '#94a3b8', marginLeft: 8 },
    submitBtn: { marginTop: 10, backgroundColor: '#10b981' },
    primaryAction: { backgroundColor: '#10b981', marginTop: 8 },
    secondaryAction: { marginTop: 12, borderColor: '#10b981' },
    successContainer: { flex: 1, backgroundColor: '#f0fdf4', justifyContent: 'center', padding: 24 },
    successCard: { backgroundColor: '#fff', padding: 32, borderRadius: 32, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    successTitle: { fontSize: 22, fontWeight: '800', color: '#064e3b', marginBottom: 12, textAlign: 'center' },
    successDesc: { textAlign: 'center', color: '#6b7280', lineHeight: 20, marginBottom: 24 },
    galleryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    galleryItem: { width: '48%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden' },
    galleryImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    removeBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 2 },
    addGalleryBtn: { width: '48%', aspectRatio: 1, borderRadius: 12, borderWidth: 2, borderColor: '#cbd5e1', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
})

export default RegisterShopScreen
