import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { AlertCircle, CheckCircle2, CircleDollarSign, ImagePlus, MapPin, Phone, Tag, X } from 'lucide-react-native'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import Button from '../../Reused/Button/Button'
import Card from '../../Reused/Card/Card'
import Input from '../../Reused/Input/Input'
import useCreatePost from '../service/useCreatePost'
import { useAuth } from '../../../context/AuthContext'

const CreatePostLayout = () => {
    const navigation = useNavigation<any>()
    const { state, actions } = useCreatePost()
    const { shop } = useAuth()
    const isShop = !!shop && shop.shopStatus === 'active'

    if (state.submitted) {
        return (
            <MobileLayout title="Thành công">
                <View style={styles.successContainer}>
                    <CheckCircle2 size={80} color="#10b981" />
                    <Text style={styles.successTitle}>Đăng tin thành công</Text>
                    <Text style={styles.successSubtitle}>
                        Tin đăng của bạn đã được tạo thành công. Bạn có thể xem lại trong danh sách tin.
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
                </View>
            </MobileLayout>
        )
    }

    if (state.loadingPolicy || state.loadingInitialData) {
        return (
            <MobileLayout title="Đăng tin mới" backButton={() => navigation.goBack()}>
                <ActivityIndicator style={{ marginTop: 80 }} color="#10b981" />
            </MobileLayout>
        )
    }

    if (state.policy?.isLimitReached) {
        return (
            <MobileLayout title="Đăng tin mới" backButton={() => navigation.goBack()}>
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
        <MobileLayout title="Đăng tin mới" backButton={() => navigation.goBack()}>
            <Card style={styles.card}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Hình ảnh</Text>
                    <Text style={styles.sectionHint}>Tối đa 10 ảnh</Text>
                </View>

                <View style={styles.mediaGrid}>
                    <TouchableOpacity style={styles.uploadBtn} onPress={actions.pickMedia} disabled={state.submitting}>
                        <ImagePlus size={24} color="#10b981" />
                        <Text style={styles.uploadText}>Thêm ảnh</Text>
                    </TouchableOpacity>

                    {state.media.map((item, index) => (
                        <View key={`${item.uri}-${index}`} style={styles.mediaPreview}>
                            <Image source={{ uri: item.uri }} style={styles.imageThumb} />

                            <TouchableOpacity style={styles.removeBadge} onPress={() => actions.removeMedia(index)}>
                                <X size={10} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
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

                <Input
                    testID="create-post-price-input"
                    label="Giá bán"
                    type="numeric"
                    value={state.formData.postPrice}
                    onChangeText={(txt) => actions.setFormData({ ...state.formData, postPrice: txt })}
                    icon={<CircleDollarSign size={16} color="#10b981" />}
                    required
                />

                {isShop && shop?.shopLocation ? (
                    <View style={styles.locationBlock}>
                        <Input
                            testID="create-post-location-input"
                            label="Địa chỉ"
                            value={state.formData.postLocation}
                            onChangeText={(txt) => actions.setFormData({ ...state.formData, postLocation: txt })}
                            icon={<MapPin size={16} color="#10b981" />}
                            placeholder="Địa chỉ cửa hàng sẽ dùng cho tin này"
                        />
                        <TouchableOpacity
                            style={styles.useShopLocationBtn}
                            onPress={() =>
                                actions.setFormData({
                                    ...state.formData,
                                    postLocation: shop.shopLocation || '',
                                })
                            }
                        >
                            <Text style={styles.useShopLocationText}>Dùng địa chỉ cửa hàng</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Input
                        testID="create-post-location-input"
                        label="Địa chỉ"
                        value={state.formData.postLocation}
                        onChangeText={(txt) => actions.setFormData({ ...state.formData, postLocation: txt })}
                        icon={<MapPin size={16} color="#10b981" />}
                        placeholder="Ví dụ: Cầu Giấy, Hà Nội"
                    />
                )}
                {isShop && shop?.shopPhone ? (
                    <View style={styles.locationBlock}>
                        <Input
                            testID="create-post-contact-phone-input"
                            label="Số điện thoại liên hệ"
                            type="phone-pad"
                            value={state.formData.postContactPhone}
                            onChangeText={(txt) => actions.setFormData({ ...state.formData, postContactPhone: txt })}
                            icon={<Phone size={16} color="#10b981" />}
                            placeholder="Để trống nếu dùng số mặc định"
                        />
                        <TouchableOpacity
                            style={styles.useShopLocationBtn}
                            onPress={() =>
                                actions.setFormData({
                                    ...state.formData,
                                    postContactPhone: shop.shopPhone || '',
                                })
                            }
                        >
                            <Text style={styles.useShopLocationText}>Dùng số cửa hàng</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Input
                        testID="create-post-contact-phone-input"
                        label="Số điện thoại liên hệ"
                        type="phone-pad"
                        value={state.formData.postContactPhone}
                        onChangeText={(txt) => actions.setFormData({ ...state.formData, postContactPhone: txt })}
                        icon={<Phone size={16} color="#10b981" />}
                        placeholder="Để trống nếu dùng số mặc định"
                    />
                )}

            </Card>

            {state.loadingAttributes ? (
                <ActivityIndicator style={styles.attributeLoading} color="#10b981" />
            ) : state.attributes.length > 0 ? (
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Thuộc tính danh mục</Text>
                    {state.attributes.map((attr) => (
                        <Input
                            key={attr.attributeId}
                            label={`${attr.attributeTitle}${attr.required ? ' *' : ''}`}
                            value={state.formData.attributes[attr.attributeId] || ''}
                            onChangeText={(val) => actions.setFormData({
                                ...state.formData,
                                attributes: { ...state.formData.attributes, [attr.attributeId]: val }
                            })}
                        />
                    ))}
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
    },
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
        fontSize: 12,
        fontWeight: '600',
        color: '#10b981',
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
    removeBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        padding: 4,
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
