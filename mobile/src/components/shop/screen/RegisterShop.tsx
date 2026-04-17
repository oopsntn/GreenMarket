import React, { useMemo, useState } from 'react'
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ArrowRight, Camera, CheckCircle, Image as ImageIcon, Play, Plus, Store, User, X } from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import * as WebBrowser from 'expo-web-browser'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import Input from '../../Reused/Input/Input'
import Button from '../../Reused/Button/Button'
import { ShopService } from '../service/shopService'
import CustomAlert from '../../../utils/AlertHelper'
import { ProfileService } from '../../profile/service/ProfileService'
import AddressPicker from '../components/AddressPicker'
import { useAuth } from '../../../context/AuthContext'
import { resolveImageUrl } from '../../../utils/resolveImageUrl'
import { paymentService } from '../../payment/service/paymentService'

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

    const pickImage = async (field: 'shopLogoUrl' | 'shopCoverUrl' | 'shopGalleryImages') => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permission.granted) {
            CustomAlert('Lỗi', 'Vui lòng cấp quyền truy cập thư viện ảnh')
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
            CustomAlert('Lỗi tải lên', 'Không thể tải ảnh lên. Vui lòng thử lại.')
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
        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/

        if (!formData.shopName.trim()) {
            CustomAlert('Lỗi', 'Vui lòng nhập tên cửa hàng')
            return false
        }
        if (formData.shopName.trim().length < 3) {
            CustomAlert('Lỗi', 'Tên cửa hàng phải có ít nhất 3 ký tự')
            return false
        }

        // Đồng nhất với user-web: logo là bắt buộc
        if (!formData.shopLogoUrl) {
            CustomAlert('Lỗi', 'Vui lòng tải lên ảnh đại diện cho cửa hàng')
            return false
        }

        // Đồng nhất với user-web: tối thiểu 3 ảnh gallery
        if (formData.shopGalleryImages.length < 3) {
            CustomAlert('Lỗi', 'Vui lòng tải lên ít nhất 3 ảnh mô tả cửa hàng')
            return false
        }

        // Mô tả bắt buộc (đồng nhất với user-web)
        if (!formData.shopDescription.trim()) {
            CustomAlert('Lỗi', 'Vui lòng nhập mô tả cho cửa hàng')
            return false
        }
        if (formData.shopDescription.trim().length < 10) {
            CustomAlert('Lỗi', 'Mô tả cửa hàng quá ngắn (cần ít nhất 10 ký tự)')
            return false
        }

        if (formData.shopPhone.trim() && !phoneRegex.test(formData.shopPhone.trim())) {
            CustomAlert('Lỗi', 'Định dạng số điện thoại Việt Nam không hợp lệ')
            return false
        }

        if (formData.shopEmail.trim() && !emailRegex.test(formData.shopEmail.trim())) {
            CustomAlert('Lỗi', 'Định dạng email không hợp lệ')
            return false
        }

        if (!formData.shopLocation.trim() || formData.shopLocation.trim().length < 5) {
            CustomAlert('Lỗi', 'Vui lòng nhập định vị địa chỉ rõ ràng cho cửa hàng')
            return false
        }

        if (!formData.shopLat || !formData.shopLng) {
            CustomAlert('Lỗi', 'Vui lòng chọn tọa độ cửa hàng trên bản đồ')
            return false
        }

        return true
    }

    const normalizeSocialUrl = (url: string) => {
        const value = url.trim()
        if (!value) return undefined
        return value.startsWith('http') ? value : `https://${value}`
    }

    /**
     * Poll shop status sau khi browser đóng.
     * VNPAY IPN (webhook) có thể chậm vài giây → cần thử lại nhiều lần
     * thay vì chỉ refresh 1 lần ngay lập tức.
     */
    const pollShopActivation = async (maxRetries = 6, delayMs = 2500) => {
        for (let i = 0; i < maxRetries; i++) {
            await new Promise(resolve => setTimeout(resolve, delayMs))
            await refreshShop()
            // AuthContext sẽ cập nhật shop state; component tự re-render
            // nếu status đổi thành 'active'. Không cần kiểm tra ở đây.
        }
    }

    const openPaymentBrowser = async () => {
        const paymentRes = await paymentService.createShopPaymentIntent()
        console.log('[Payment] createShopPaymentIntent response:', paymentRes)

        // Backend chỉ trả { paymentUrl } — không fallback field khác
        const paymentUrl = paymentRes?.paymentUrl

        if (!paymentUrl) {
            console.error('[Payment] Unexpected response shape:', paymentRes)
            throw new Error('Không nhận được link thanh toán từ hệ thống')
        }

        const result = await WebBrowser.openBrowserAsync(paymentUrl)
        console.log('[Payment] Browser closed, result:', result)

        // Bắt đầu poll để bắt kịp IPN VNPAY (có thể chậm vài giây)
        await pollShopActivation()
    }

    const handleSubmit = async () => {
        if (hasExistingShop) {
            CustomAlert('Thông báo', 'Hệ thống xác nhận tài khoản này đã có cửa hàng.')
            return
        }

        if (!validateForm()) {
            return
        }

        if (isBlockedOrOtherShopState) {
            CustomAlert(
                'Tài khoản bị hạn chế',
                'Cửa hàng của bạn đang bị hạn chế hoặc đã bị từ chối. Vui lòng liên hệ bộ phận hỗ trợ để được giải quyết.'
            )
            return
        }

        if (isPendingShop) {
            CustomAlert('Thông báo', 'Cửa hàng của bạn đang chờ kích hoạt. Vui lòng hoàn tất thanh toán để bắt đầu sử dụng.')
            return
        }

        if (uploadingImage) {
            CustomAlert('Thông báo', 'Vui lòng chờ tải ảnh lên hoàn tất trước khi đăng ký')
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
                shopPhone: formData.shopPhone.trim() || undefined,
                shopEmail: formData.shopEmail.trim() || undefined,
                shopLocation: formData.shopLocation.trim(),
                shopDescription: formData.shopDescription.trim(),
                shopLat: formData.shopLat,
                shopLng: formData.shopLng,
                shopLogoUrl: formData.shopLogoUrl || undefined,
                shopCoverUrl: formData.shopCoverUrl || undefined,
                // Gửi mảng ảnh, BE sẽ tự xử lý join "|"
                shopGalleryImages: formData.shopGalleryImages,
                shopFacebook: validateSocial(formData.shopFacebook.trim()) || undefined,
                shopInstagram: validateSocial(formData.shopInstagram.trim()) || undefined,
                shopYoutube: validateSocial(formData.shopYoutube.trim()) || undefined,
            }

            const createdShop = await ShopService.createShop(cleanData)
            console.log('[Shop] createShop response:', createdShop)

            // QUAN TRỌNG: KHÔNG refreshShop() ở đây.
            // Nếu refresh trước khi mở browser → isPendingShop = true
            // → component re-render sang view "pending" TRƯỚC KHI cổng thanh toán mở.
            // refreshShop chỉ được gọi BÊN TRONG openPaymentBrowser/pollShopActivation.

            // Mở cổng thanh toán ngay sau khi tạo shop thành công
            try {
                await openPaymentBrowser()
            } catch (paymentErr: any) {
                console.error('[Payment] Failed to open payment after register:', paymentErr)
                // Fallback: refresh shop để UI phản ánh trạng thái pending
                await refreshShop()
                CustomAlert(
                    'Chưa mở được thanh toán',
                    paymentErr?.response?.data?.error ||
                    paymentErr?.message ||
                    'Đã tạo cửa hàng nhưng chưa thể mở VNPAY. Bạn có thể tiếp tục thanh toán sau.'
                )
            }

        } catch (error: any) {
            // Lấy message từ backend response trước, mới fallback về default
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
        }
    }

    const handleContinuePayment = async () => {
        try {
            setLoading(true)
            await openPaymentBrowser()
            // pollShopActivation() đã được gọi bên trong openPaymentBrowser
        } catch (error: any) {
            CustomAlert('Lỗi thanh toán', error?.response?.data?.error || 'Không thể khởi tạo thanh toán VNPAY.')
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
                    <Text style={styles.successTitle}>Đăng ký thành công!</Text>
                    <Text style={styles.successDesc}>
                        Hồ sơ cửa hàng đang được xét duyệt. Chúng tôi sẽ thông báo cho bạn sớm nhất có thể.
                    </Text>
                    <Button
                        fullWidth
                        icon={<ArrowRight size={18} color="#fff" />}
                        onPress={() => navigation.navigate('MyShop')}
                        style={styles.primaryAction}
                    >
                        Xem cửa hàng của tôi
                    </Button>
                </View>
            </View>
        )
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
                                try {
                                    await refreshShop()
                                } catch (error: any) {
                                    CustomAlert('Lỗi', error?.response?.data?.error || 'Không thể tải lại cửa hàng.')
                                } finally {
                                    setLoading(false)
                                }
                            }}
                            style={[styles.secondaryAction, { marginTop: 16 }]}
                        >
                            Đã thanh toán? Tải lại ngay
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
                        <Button
                            fullWidth
                            onPress={() => navigation.navigate('MyShop')}
                            style={styles.primaryAction}
                        >
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
                    </View>
                </View>
            </MobileLayout>
        )
    }

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

                    <View style={styles.imagePickerRow}>
                        <TouchableOpacity
                            onPress={() => pickImage('shopLogoUrl')}
                            style={styles.pickerBox}
                            disabled={loading || uploadingImage}
                        >
                            {formData.shopLogoUrl ? (
                                <Image source={{ uri: resolveImageUrl(formData.shopLogoUrl) }} style={styles.previewLogo} />
                            ) : (
                                <View style={styles.pickerInner}>
                                    <ImageIcon color="#94a3b8" size={24} />
                                    <Text style={styles.pickerText}>Ảnh đại diện</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => pickImage('shopCoverUrl')}
                            style={styles.pickerBoxCover}
                            disabled={loading || uploadingImage}
                        >
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
                        {formData.shopGalleryImages.map((url, index) => (
                            <View key={index} style={styles.galleryItem}>
                                <Image source={{ uri: resolveImageUrl(url) }} style={styles.galleryImage} />
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
                        {uploadingImage ? 'Đang tải ảnh lên...' : 'Ảnh đại diện và ảnh bìa không bắt buộc nhưng sẽ làm cửa hàng chuyên nghiệp hơn.'}
                    </Text>

                    <Input
                        label="Email cửa hàng"
                        type="email-address"
                        value={formData.shopEmail}
                        onChangeText={(txt) => setFormData({ ...formData, shopEmail: txt })}
                        placeholder="Ví dụ: contact@greengarden.com"
                    />

                    <Input
                        label="Số điện thoại cửa hàng"
                        type="phone-pad"
                        value={formData.shopPhone}
                        onChangeText={(txt) => setFormData({ ...formData, shopPhone: txt })}
                        placeholder="Ví dụ: 0912345678"
                    />

                    <Input
                        label="Mô tả cửa hàng"
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
                                Tữa độ: {formData.shopLat.toFixed(4)}, {formData.shopLng?.toFixed(4)}
                            </Text>
                        ) : null}
                    </View>

                    {/* Social Media Section */}
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
                        placeholder="Đường dận Youtube"
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
                        Đăng ký cửa hàng
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
