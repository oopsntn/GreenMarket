import React, { useMemo, useState } from 'react'
import { ActionSheetIOS, Dimensions, Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ArrowRight, Camera, CheckCircle, Image as ImageIcon, Play, Plus, Store, User, X } from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import * as WebBrowser from 'expo-web-browser'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import Input from '../../Reused/Input/Input'
import Button from '../../Reused/Button/Button'
import { ShopService } from '../service/shopService'
import CustomAlert from '../../../utils/AlertHelper'
import AddressPicker from '../components/AddressPicker'
import { useAuth } from '../../../context/AuthContext'
import { resolveImageUrl } from '../../../utils/resolveImageUrl'
import { paymentService } from '../../payment/service/paymentService'

const RegisterShopScreen = ({ navigation }: any) => {
    const { refreshShop, shop, user } = useAuth()
    const [formData, setFormData] = useState({
        shopName: '',
        shopLocation: '',
        shopDescription: '',
        shopLat: undefined as number | undefined,
        shopLng: undefined as number | undefined,
        shopFacebook: '',
        shopInstagram: '',
        shopYoutube: '',
    })
    // Local URIs lưu tạm, chưa upload lên server
    const [localLogoUri, setLocalLogoUri] = useState<string | null>(null)
    const [localGalleryUris, setLocalGalleryUris] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    const hasExistingShop = useMemo(
        () => !!shop?.shopId && shop.shopStatus === 'active',
        [shop]
    )

    const isPendingShop = useMemo(
        () => !!shop?.shopId && shop.shopStatus === 'pending',
        [shop]
    )

    const isBlockedOrOtherShopState = useMemo(
        () => !!shop?.shopId && !['pending', 'active'].includes(shop.shopStatus),
        [shop]
    )

    /** Chọn logo từ thư viện (1 ảnh, crop vuông) */
    const pickLogoFromLibrary = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permission.granted) {
            CustomAlert('Lỗi', 'Vui lòng cấp quyền truy cập thư viện ảnh')
            return
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        })
        if (!result.canceled && result.assets?.[0]) {
            setLocalLogoUri(result.assets[0].uri)
        }
    }

    /** Chụp logo bằng camera */
    const pickLogoFromCamera = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync()
        if (!permission.granted) {
            CustomAlert('Lỗi', 'Vui lòng cấp quyền truy cập máy ảnh')
            return
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        })
        if (!result.canceled && result.assets?.[0]) {
            setLocalLogoUri(result.assets[0].uri)
        }
    }

    /** Hiển thị ActionSheet chọn nguồn ảnh logo (iOS) hoặc hỏi alert (Android) */
    const handlePickLogo = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Hủy', 'Chọn từ thư viện', 'Chụp ảnh'],
                    cancelButtonIndex: 0,
                },
                (index) => {
                    if (index === 1) pickLogoFromLibrary()
                    if (index === 2) pickLogoFromCamera()
                }
            )
        } else {
            // Android: dùng React Native Alert với buttons
            const { Alert } = require('react-native')
            Alert.alert('Chọn ảnh đại diện', '', [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Chọn từ thư viện', onPress: pickLogoFromLibrary },
                { text: 'Chụp ảnh', onPress: pickLogoFromCamera },
            ])
        }
    }

    /** Chọn nhiều ảnh gallery từ thư viện */
    const pickGalleryImages = async () => {
        const remaining = 4 - localGalleryUris.length
        if (remaining <= 0) return

        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permission.granted) {
            CustomAlert('Lỗi', 'Vui lòng cấp quyền truy cập thư viện ảnh')
            return
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: true,
            selectionLimit: remaining,
            quality: 0.7,
        })
        if (!result.canceled && result.assets?.length) {
            const newUris = result.assets.map((a) => a.uri)
            setLocalGalleryUris((prev) => [...prev, ...newUris].slice(0, 4))
        }
    }

    /** Chụp một ảnh gallery bằng camera rồi thêm vào danh sách */
    const pickGalleryImageFromCamera = async () => {
        const remaining = 4 - localGalleryUris.length
        if (remaining <= 0) return

        const permission = await ImagePicker.requestCameraPermissionsAsync()
        if (!permission.granted) {
            CustomAlert('Lỗi', 'Vui lòng cấp quyền truy cập máy ảnh')
            return
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.7,
        })

        if (!result.canceled && result.assets?.[0]) {
            setLocalGalleryUris((prev) => [...prev, result.assets[0].uri].slice(0, 4))
        }
    }

    const handlePickGallery = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Hủy', 'Chọn từ thư viện', 'Chụp ảnh'],
                    cancelButtonIndex: 0,
                },
                (index) => {
                    if (index === 1) pickGalleryImages()
                    if (index === 2) pickGalleryImageFromCamera()
                }
            )
            return
        }

        const { Alert } = require('react-native')
        Alert.alert('Chọn ảnh cửa hàng', '', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Chọn từ thư viện', onPress: pickGalleryImages },
            { text: 'Chụp ảnh', onPress: pickGalleryImageFromCamera },
        ])
    }

    const handleAddressChange = (addr: string) => {
        setFormData((prev) => ({ ...prev, shopLocation: addr }))
    }

    const validateForm = () => {
        if (!formData.shopName.trim()) {
            CustomAlert('Xin thông báo', 'Vui lòng nhập tên cửa hàng')
            return false
        }
        if (formData.shopName.trim().length < 3) {
            CustomAlert('Xin thông báo', 'Tên cửa hàng phải có ít nhất 3 ký tự')
            return false
        }
        if (!localLogoUri) {
            CustomAlert('Xin thông báo', 'Vui lòng tải lên ảnh đại diện cho cửa hàng')
            return false
        }
        if (localGalleryUris.length < 3) {
            CustomAlert('Xin thông báo', 'Vui lòng tải lên ít nhất 3 ảnh mô tả cửa hàng')
            return false
        }
        if (!formData.shopDescription.trim()) {
            CustomAlert('Xin thông báo', 'Vui lòng nhập mô tả cho cửa hàng')
            return false
        }
        if (formData.shopDescription.trim().length < 10) {
            CustomAlert('Xin thông báo', 'Mô tả cửa hàng quá ngắn (cần ít nhất 10 ký tự)')
            return false
        }
        if (!formData.shopLocation.trim() || formData.shopLocation.trim() === 'Vị trí đã chọn') {
            CustomAlert('Xin thông báo', 'Vui lòng xác định địa chỉ cửa hàng hợp lệ')
            return false
        }
        if (!formData.shopLat || !formData.shopLng) {
            CustomAlert('Xin thông báo', 'Vui lòng chọn tọa độ cửa hàng trên bản đồ')
            return false
        }
        return true
    }

    const normalizeSocialUrl = (url: string) => {
        const value = url.trim()
        if (!value) return undefined
        return value.startsWith('http') ? value : `https://${value}`
    }

    const pollShopActivation = async (maxRetries = 6, delayMs = 2500) => {
        for (let i = 0; i < maxRetries; i++) {
            await new Promise((resolve: any) => setTimeout(resolve, delayMs))
            await refreshShop()
        }
    }

    const handleGoHome = () => {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })
    }

    const openPaymentBrowser = async () => {
        const paymentRes = await paymentService.createShopPaymentIntent()
        console.log('[Payment] createShopPaymentIntent response:', paymentRes)
        const paymentUrl = paymentRes?.paymentUrl
        if (!paymentUrl) {
            console.error('[Payment] Unexpected response shape:', paymentRes)
            throw new Error('Không nhận được link thanh toán từ hệ thống')
        }

        const navigatedRef = { current: false };

        const subscription = Linking.addEventListener('url', (event) => {
            if (navigatedRef.current) return;
            const url = event.url;
            if (url && (url.includes('payment-result') || url.includes('vnpay-return'))) {
                navigatedRef.current = true;
                subscription.remove();

                const getParam = (u: string, key: string): string | undefined => {
                    const match = u.match(new RegExp('[?&]' + key + '=([^&]*)'));
                    return match ? decodeURIComponent(match[1]) : undefined;
                };
                const status = getParam(url, 'status') || (getParam(url, 'vnp_ResponseCode') === '00' ? 'success' : 'failed');
                const code = getParam(url, 'code') || getParam(url, 'vnp_ResponseCode') || undefined;
                const txnRef = getParam(url, 'txnRef') || getParam(url, 'vnp_TxnRef') || undefined;

                (async () => {
                    if (status === 'success' || code === '00') {
                        await refreshShop();
                    }

                    navigation.navigate('PaymentResult', { status, code, txnRef, type: 'shop' });
                })().catch((error) => {
                    console.error('[Payment] Failed to refresh shop after return:', error);
                    navigation.navigate('PaymentResult', { status, code, txnRef, type: 'shop' });
                });
            }
        });

        await WebBrowser.openBrowserAsync(paymentUrl);

        subscription.remove();
        if (!navigatedRef.current) {
            // Browser đóng mà không có deep-link → chuyển đến màn hình chờ
            await refreshShop();
            navigation.navigate('PaymentPending', { type: 'shop' });
        }
    }

    const handleSubmit = async () => {
        if (hasExistingShop) {
            CustomAlert('Thông báo', 'Hệ thống xác nhận tài khoản này đã có cửa hàng.')
            return
        }
        if (!validateForm()) return

        if (isBlockedOrOtherShopState) {
            CustomAlert('Tài khoản bị hạn chế', 'Cửa hàng của bạn đang bị hạn chế hoặc đã bị từ chối. Vui lòng liên hệ bộ phận hỗ trợ.')
            return
        }
        if (isPendingShop) {
            CustomAlert('Thông báo', 'Cửa hàng của bạn đang chờ kích hoạt. Vui lòng hoàn tất thanh toán.')
            return
        }

        setLoading(true)
        try {
            // ─── Bước 1: Upload ảnh ──────────────────────────────────────────
            setUploading(true)
            let uploadedLogoUrl = ''
            let uploadedGalleryUrls: string[] = []

            try {
                if (localLogoUri) {
                    const logoRes = await ShopService.uploadShopLogo(localLogoUri)
                    if (logoRes?.urls?.[0]) uploadedLogoUrl = logoRes.urls[0]
                }
                if (localGalleryUris.length > 0) {
                    const galleryRes = await ShopService.uploadShopGallery(localGalleryUris)
                    if (galleryRes?.urls?.length) uploadedGalleryUrls = galleryRes.urls
                }
            } catch (uploadErr: any) {
                console.error('[Upload] Lỗi tải ảnh:', uploadErr)
                CustomAlert('Lỗi tải ảnh', 'Không thể tải ảnh lên. Vui lòng kiểm tra kết nối và thử lại.')
                return
            } finally {
                setUploading(false)
            }

            // Kiểm tra kết quả upload
            if (!uploadedLogoUrl) {
                CustomAlert('Lỗi', 'Không tải được ảnh đại diện. Vui lòng thử lại.')
                return
            }
            if (uploadedGalleryUrls.length < 3) {
                CustomAlert('Lỗi', 'Cần tối thiểu 3 ảnh mô tả cửa hàng. Vui lòng thử lại.')
                return
            }

            // ─── Bước 2: Tạo shop ────────────────────────────────────────────
            const cleanData = {
                shopName: formData.shopName.trim(),
                shopPhone: user?.userMobile,
                shopLocation: formData.shopLocation.trim(),
                shopDescription: formData.shopDescription.trim(),
                shopLat: formData.shopLat,
                shopLng: formData.shopLng,
                shopLogoUrl: uploadedLogoUrl,
                shopGalleryImages: uploadedGalleryUrls,
                shopFacebook: normalizeSocialUrl(formData.shopFacebook) || undefined,
                shopInstagram: normalizeSocialUrl(formData.shopInstagram) || undefined,
                shopYoutube: normalizeSocialUrl(formData.shopYoutube) || undefined,
            }

            const createdShop = await ShopService.createShop(cleanData)
            console.log('[Shop] createShop response:', createdShop)

            // ─── Bước 3: Mở cổng thanh toán ─────────────────────────────────
            try {
                await openPaymentBrowser()
            } catch (paymentErr: any) {
                console.error('[Payment] Failed to open payment after register:', paymentErr)
                await refreshShop()
                CustomAlert(
                    'Chưa mở được thanh toán',
                    paymentErr?.response?.data?.error ||
                    paymentErr?.message ||
                    'Đã tạo cửa hàng nhưng chưa thể mở VNPAY. Bạn có thể tiếp tục thanh toán sau.'
                )
            }

        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Không thể đăng ký cửa hàng'
            console.error('[Shop] Register shop error:', error)
            if (error.response?.data?.error === 'User already has a shop registered') {
                await refreshShop()
                CustomAlert('Thông báo', 'Hệ thống xác nhận tài khoản này đã có cửa hàng.')
                return
            }
            CustomAlert('Lỗi', errorMsg)
        } finally {
            setLoading(false)
            setUploading(false)
        }
    }

    const handleContinuePayment = async () => {
        try {
            setLoading(true)
            await openPaymentBrowser()
        } catch (error: any) {
            CustomAlert('Lỗi thanh toán', error?.response?.data?.error || 'Không thể khởi tạo thanh toán VNPAY.')
        } finally {
            setLoading(false)
        }
    }


    if (isPendingShop) {
        return (
            <MobileLayout title="Đăng ký cửa hàng" backButton={() => navigation.goBack()}>
                <View style={styles.successContainer}>
                    <View style={styles.successCard}>
                        <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
                            <Store color="#d97706" size={40} />
                        </View>
                        <Text style={[styles.successTitle, { color: '#92400e' }]}>Cửa hàng chờ kích hoạt</Text>
                        <Text style={styles.successDesc}>
                            Cửa hàng của bạn đã được tạo tuy nhiên chưa thanh toán phí đóng quầy. Bạn cần hoàn tất thanh toán để có thể sử dụng tất cả tính năng của chủ vườn.
                        </Text>
                        <Button
                            loading={loading}
                            disabled={loading}
                            fullWidth
                            onPress={handleContinuePayment}
                            style={{ backgroundColor: '#111827', marginTop: 8 }}
                        >
                            Tiếp tục thanh toán kích hoạt
                        </Button>
                        <Button
                            fullWidth
                            variant="outline"
                            onPress={async () => {
                                setLoading(true)
                                try { await refreshShop() } catch (error: any) {
                                    CustomAlert('Lỗi', error?.response?.data?.error || 'Không thể tải lại cửa hàng.')
                                } finally { setLoading(false) }
                            }}
                            style={[styles.secondaryAction, { marginTop: 16 }]}
                        >
                            Đã thanh toán? Tải lại ngay
                        </Button>
                        <Button
                            fullWidth
                            variant="outline"
                            onPress={handleGoHome}
                            style={[styles.secondaryAction, { marginTop: 8 }]}
                        >
                            Về trang chủ
                        </Button>
                    </View>
                </View>
            </MobileLayout>
        )
    }

    if (hasExistingShop) {
        return (
            <MobileLayout title="Đăng ký cửa hàng" backButton={() => navigation.goBack()}>
                <View style={styles.successContainer}>
                    <View style={styles.successCard}>
                        <View style={styles.iconCircle}>
                            <Store color="#10b981" size={40} />
                        </View>
                        <Text style={styles.successTitle}>Bạn đã có cửa hàng</Text>
                        <Text style={styles.successDesc}>
                            Mỗi tài khoản chỉ được phép có một cửa hàng duy nhất. Bạn có thể xem hoặc chỉnh sửa cửa hàng hiện tại.
                        </Text>
                        <Button fullWidth onPress={() => navigation.navigate('MyShop')} style={styles.primaryAction}>
                            Xem cửa hàng của tôi
                        </Button>
                        <Button
                            fullWidth
                            variant="outline"
                            onPress={() => navigation.navigate('EditShop', { shop })}
                            style={styles.secondaryAction}
                            textStyle={{ color: '#10b981' }}
                        >
                            Sửa thông tin
                        </Button>
                        <Button
                            fullWidth
                            variant="outline"
                            onPress={handleGoHome}
                            style={[styles.secondaryAction, { marginTop: 8 }]}
                        >
                            Về trang chủ
                        </Button>
                    </View>
                </View>
            </MobileLayout>
        )
    }

    const isSubmitting = loading || uploading

    return (
        <MobileLayout title="Đăng ký cửa hàng" backButton={() => navigation.goBack()}>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
            >
                <View style={styles.header}>
                    <Store color="#10b981" size={48} />
                    <Text style={styles.title}>Bắt đầu kinh doanh</Text>
                    <Text style={styles.subtitle}>Điền thông tin để tạo cửa hàng của bạn</Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Tên cửa hàng *"
                        placeholder="Ví dụ: Cây Cảnh Xanh"
                        value={formData.shopName}
                        onChangeText={(txt) => setFormData({ ...formData, shopName: txt })}
                        required
                    />

                    {/* ─── Logo ─── */}
                    <Text style={styles.label}>Ảnh đại diện cửa hàng *</Text>
                    <TouchableOpacity
                        onPress={handlePickLogo}
                        style={[styles.pickerBox, { marginBottom: 16 }]}
                        disabled={isSubmitting}
                    >
                        {localLogoUri ? (
                            <View style={{ position: 'relative' }}>
                                <Image source={{ uri: localLogoUri }} style={styles.previewLogo} />
                                <TouchableOpacity
                                    style={styles.removeBadge}
                                    onPress={() => setLocalLogoUri(null)}
                                >
                                    <X size={12} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.pickerInner}>
                                <Camera color="#94a3b8" size={28} />
                                <Text style={styles.pickerText}>Chọn hoặc chụp ảnh</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* ─── Gallery ─── */}
                    <Text style={styles.label}>Hình ảnh cửa hàng * (Tối thiểu 3, tối đa 4 ảnh)</Text>
                    <View style={styles.galleryContainer}>
                        {localGalleryUris.map((uri, index) => (
                            <View key={index} style={styles.galleryItem}>
                                <Image source={{ uri }} style={styles.galleryImage} />
                                <TouchableOpacity
                                    style={styles.removeBadge}
                                    onPress={() => {
                                        setLocalGalleryUris(prev => prev.filter((_, i) => i !== index))
                                    }}
                                >
                                    <X size={12} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {localGalleryUris.length < 4 && (
                            <TouchableOpacity
                                style={styles.addGalleryBtn}
                                onPress={handlePickGallery}
                                disabled={isSubmitting}
                            >
                                <Plus size={24} color="#94a3b8" />
                                <Text style={styles.pickerText}>
                                    {localGalleryUris.length}/4
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <Text style={styles.helperText}>
                        💡 Ảnh sẽ được tải lên khi bạn bấm "Đăng ký". Chọn ảnh rõ nét, đại diện tốt cho cửa hàng.
                    </Text>

                    <Input
                        label="Mô tả cửa hàng *"
                        multiline
                        numberOfLines={4}
                        value={formData.shopDescription}
                        onChangeText={(txt) => setFormData({ ...formData, shopDescription: txt })}
                        placeholder="Mô tả chi tiết cửa hàng của bạn..."
                    />

                    <View style={{ marginBottom: 20 }}>
                        <AddressPicker
                            label="Địa chỉ cửa hàng *"
                            address={formData.shopLocation}
                            onAddressChange={handleAddressChange}
                            onLocationConfirmed={(data: any) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    shopLocation: data.fullAddress,
                                    shopLat: data.lat,
                                    shopLng: data.lng,
                                }))
                            }}
                        />
                        {formData.shopLat ? (
                            <Text style={styles.coordinateText}>
                                Tọa độ: {formData.shopLat.toFixed(4)}, {formData.shopLng?.toFixed(4)}
                            </Text>
                        ) : null}
                    </View>

                    {/* Social Media */}
                    <Text style={styles.label}>Mạng xã hội</Text>
                    <Input
                        placeholder="Đường dẫn Facebook"
                        value={formData.shopFacebook}
                        onChangeText={(t) => setFormData({ ...formData, shopFacebook: t })}
                        icon={<User size={18} color="#1877F2" />}
                    />
                    <Input
                        placeholder="Đường dẫn Instagram"
                        value={formData.shopInstagram}
                        onChangeText={(t) => setFormData({ ...formData, shopInstagram: t })}
                        icon={<Camera size={18} color="#E4405F" />}
                    />
                    <Input
                        placeholder="Đường dẫn Youtube"
                        value={formData.shopYoutube}
                        onChangeText={(t) => setFormData({ ...formData, shopYoutube: t })}
                        icon={<Play size={18} color="#E4405F" />}
                    />

                    <Button
                        onPress={handleSubmit}
                        loading={isSubmitting}
                        disabled={isSubmitting}
                        fullWidth
                        style={styles.submitBtn}
                    >
                        {uploading ? 'Đang tải ảnh...' : loading ? 'Đang đăng ký...' : 'Đăng ký cửa hàng với phí 250.000 đồng'}
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
    pickerBox: { height: 110, borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', borderRadius: 16, overflow: 'hidden' },
    pickerInner: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', gap: 6 },
    pickerText: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    previewLogo: { width: '100%', height: '100%' },
    helperText: { fontSize: 12, color: '#64748b', marginBottom: 16, marginTop: 4 },
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
    addGalleryBtn: { width: '48%', aspectRatio: 1, borderRadius: 12, borderWidth: 2, borderColor: '#cbd5e1', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
})

export default RegisterShopScreen
