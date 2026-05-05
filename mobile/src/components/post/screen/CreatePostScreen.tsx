import React from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import {
    AlertCircle,
    CheckCircle2,
    ImagePlus,
    MapPin,
    Phone,
    Tag,
    VideoIcon,
    X,
} from 'lucide-react-native'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import Button from '../../Reused/Button/Button'
import Card from '../../Reused/Card/Card'
import Input from '../../Reused/Input/Input'
import useCreatePost from '../service/useCreatePostStable'
import { useAuth } from '../../../context/AuthContext'

const CreatePostLayout = () => {
    const navigation = useNavigation<any>()
    const route = useRoute<any>()
    const delegatedShopId = route.params?.shopId ? Number(route.params.shopId) : undefined
    const delegatedShopName = route.params?.shopName ? String(route.params.shopName) : undefined
    const delegatedShopLocation = route.params?.shopLocation ? String(route.params.shopLocation) : undefined
    const isDelegated = !!delegatedShopId

    const { user, shop } = useAuth()
    const isShop = !!shop && shop.shopStatus === 'active'

    const { state, actions } = useCreatePost({ 
        shopId: delegatedShopId, 
        shopName: delegatedShopName,
        userPhone: user?.userMobile || undefined,
        defaultLocation: delegatedShopLocation || shop?.shopLocation || undefined
    })

    if (state.submitted) {
        return (
            <MobileLayout title="Thành công">
                <View style={styles.successContainer}>
                    <CheckCircle2 size={80} color="#10b981" />
                    <Text style={styles.successTitle}>{isDelegated ? 'Đã gửi bài cho chủ vườn duyệt' : 'Đăng tin thành công'}</Text>
                    <Text style={styles.successSubtitle}>
                        {isDelegated
                            ? `Bài đăng đã được gửi thay mặt ${delegatedShopName || 'shop'}. Chủ vườn sẽ duyệt hoặc từ chối nội dung trước khi hiển thị công khai.`
                            : 'Tin đăng của bạn đã được tạo thành công. Bạn có thể xem lại trong danh sách tin.'}
                    </Text>
                    <Button onPress={() => navigation.navigate('MyPost')} style={styles.successButton}>
                        Xem tin của tôi
                    </Button>
                    <Button
                        variant="outline"
                        onPress={() => actions.setSubmitted(false)}
                        style={styles.successButton}
                    >
                        Tạo tin khác
                    </Button>
                    <Button
                        variant="outline"
                        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
                        style={styles.successButton}
                    >
                        Về trang chủ
                    </Button>
                </View>
            </MobileLayout>
        )
    }

    if (state.loadingPolicy || state.loadingInitialData) {
        return (
            <MobileLayout title="Đăng tin mới">
                <ActivityIndicator style={{ marginTop: 80 }} color="#10b981" />
            </MobileLayout>
        )
    }

    if (state.policy?.isLimitReached) {
        return (
            <MobileLayout title="Đăng tin mới" scrollEnabled={true}>
                <View style={styles.limitContainer}>
                    <AlertCircle size={60} color="#ef4444" style={{ marginBottom: 20 }} />
                    <Text style={styles.limitTitle}>Đã đạt giới hạn đăng tin</Text>
                    <Text style={styles.limitText}>
                        Bạn đã đạt giới hạn {state.policy.allowedNewPostsPerDay} tin đăng mới trong ngày hôm nay.
                    </Text>
                    <Text style={styles.limitText}>
                        Vui lòng quay lại vào ngày mai hoặc nâng cấp tài khoản để tiếp tục đăng tin.
                    </Text>
                    <Button onPress={() => navigation.goBack()} style={styles.primaryButton}>
                        Quay lại
                    </Button>
                </View>
            </MobileLayout>
        )
    }

    return (
        <MobileLayout title="Đăng tin mới" scrollEnabled={true}>
            <Card style={styles.card}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Hình ảnh & Video</Text>
                    <Text style={styles.sectionHint}>Tối đa 10 tệp</Text>
                </View>

                <View style={styles.mediaGrid}>
                    <TouchableOpacity style={styles.uploadBtn} onPress={actions.pickMedia} disabled={state.submitting}>
                        <ImagePlus size={24} color="#10b981" />
                        <Text style={styles.uploadText}>Thêm ảnh / Video</Text>
                    </TouchableOpacity>

                    {state.media.map((item, index) => (
                        <View key={`${item.uri}-${index}`} style={styles.mediaPreview}>
                            {item.type === 'image' ? (
                                <Image source={{ uri: item.uri }} style={styles.imageThumb} />
                            ) : (
                                <View style={[styles.imageThumb, styles.videoPlaceholder]}>
                                    <VideoIcon size={28} color="#fff" />
                                    <Text style={styles.videoPlaceholderText}>Video</Text>
                                </View>
                            )}

                            <TouchableOpacity style={styles.removeBadge} onPress={() => actions.removeMedia(index)}>
                                <X size={10} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                <Text style={styles.mediaHint}>
                    Ảnh tối đa 3MB • Video tối đa 50MB • Chọn ít nhất 1 ảnh
                </Text>
            </Card>

            <Card style={styles.card}>
                <Input
                    testID="create-post-title-input"
                    label="Tiêu đề tin đăng"
                    value={state.formData.postTitle}
                    onChangeText={(txt) => actions.setFormData({ ...state.formData, postTitle: txt })}
                    icon={<Tag size={16} color="#10b981" />}
                    required
                />



                <Text style={styles.label}>Danh mục *</Text>
                {state.loadingInitialData ? (
                    <ActivityIndicator style={styles.loadingInline} color="#10b981" />
                ) : (
                    <View style={styles.categoryWrap}>
                        {state.categories.map((cat) => (
                            <TouchableOpacity
                                testID={`create-post-category-${cat.categoryId}`}
                                key={cat.categoryId}
                                style={[
                                    styles.catItem,
                                    state.formData.categoryId === String(cat.categoryId) && styles.catActive
                                ]}
                                onPress={() => actions.handleCategorySelect(String(cat.categoryId))}
                            >
                                <Text
                                    style={[
                                        styles.catText,
                                        state.formData.categoryId === String(cat.categoryId) && styles.catTextActive
                                    ]}
                                >
                                    {cat.categoryTitle}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {!isShop && (
                    <Input
                        testID="create-post-location-input"
                        label="Địa chỉ"
                        value={state.formData.postLocation}
                        onChangeText={(txt) => actions.setFormData({ ...state.formData, postLocation: txt })}
                        icon={<MapPin size={16} color="#10b981" />}
                        placeholder="Ví dụ: Cầu Giấy, Hà Nội"
                    />
                )}

            </Card>

            {state.loadingAttributes ? (
                <ActivityIndicator style={styles.attributeLoading} color="#10b981" />
            ) : state.attributes.length > 0 ? (
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Thuộc tính danh mục</Text>
                    {state.attributes.map((attr) => {
                        const isNumeric = 
                            attr.attributeDataType === 'number' || 
                            attr.attributeDataType === 'decimal' ||
                            /chiều cao|chieu cao|hoành|hoanh|tuổi|tuoi|số lượng|so luong|giá|gia/i.test(attr.attributeTitle);
                        
                        return (
                            <Input
                                key={attr.attributeId}
                                label={`${attr.attributeTitle}${attr.required ? ' *' : ''}`}
                                value={state.formData.attributes[attr.attributeId] || ''}
                                type={isNumeric ? 'decimal-pad' : 'default'}
                                onChangeText={(val) => {
                                    actions.setFormData(prev => ({
                                        ...prev,
                                        attributes: { ...prev.attributes, [attr.attributeId]: val }
                                    }));
                                }}
                            />
                        );
                    })}
                </Card>
            ) : null}

            <Button testID="create-post-submit-button" onPress={actions.submitForm} disabled={state.submitting} style={styles.submitBtn}>
                {state.submitting ? 'Đang gửi...' : 'Đăng tin'}
            </Button>
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 10,
    },
    sectionHint: {
        fontSize: 12,
        color: '#6b7280',
    },
    mediaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 8,
    },
    mediaHint: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 4,
    },
    primaryButton: {},
    uploadBtn: {
        width: 96,
        height: 96,
        borderRadius: 14,
        backgroundColor: '#f0fdf4',
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#10b981',
        gap: 6,
    },
    uploadText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#10b981',
        textAlign: 'center',
    },
    mediaPreview: {
        width: 96,
        height: 96,
        position: 'relative',
    },
    imageThumb: {
        width: '100%',
        height: '100%',
        borderRadius: 14,
    },
    videoPlaceholder: {
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    videoPlaceholderText: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '600',
    },
    removeBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        padding: 4,
    },
    contactPriceRow: {
        marginBottom: 16,
    },
    contactPriceBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#6ee7b7',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 6,
        marginTop: 6,
        marginBottom: 6,
    },
    contactPriceText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#065f46',
    },
    contactPriceNote: {
        fontSize: 11,
        color: '#9ca3af',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        color: '#444',
    },
    categoryWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
        gap: 8,
    },
    catItem: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
    },
    catActive: {
        backgroundColor: '#e8f5e9',
        borderColor: '#10b981',
        borderWidth: 1,
    },
    catText: {
        fontSize: 12,
        color: '#4b5563',
        fontWeight: '600',
    },
    catTextActive: {
        color: '#10b981',
    },
    loadingInline: {
        marginBottom: 12,
    },
    attributeLoading: {
        marginTop: 8,
    },
    submitBtn: {
        marginHorizontal: 16,
        marginVertical: 20,
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 20,
        marginBottom: 8,
        color: '#111827',
    },
    successSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    successButton: {
        width: '100%',
        marginTop: 12,
    },
    locationBlock: {
        marginTop: 8,
    },
    useShopLocationBtn: {
        alignSelf: 'flex-start',
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: '#ecfdf5',
    },
    useShopLocationText: {
        color: '#10b981',
        fontSize: 12,
        fontWeight: '600',
    },
    limitContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingTop: 80,
    },
    limitTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#ef4444',
        marginBottom: 8,
    },
    limitText: {
        textAlign: 'center',
        color: '#64748b',
        lineHeight: 20,
        marginBottom: 10,
    },
})

export default CreatePostLayout
