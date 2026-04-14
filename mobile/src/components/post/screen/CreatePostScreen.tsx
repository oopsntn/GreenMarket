import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { CheckCircle2, CircleDollarSign, ImagePlus, MapPin, Phone, Tag, X } from 'lucide-react-native'
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
            <MobileLayout title="Success">
                <View style={styles.successContainer}>
                    <CheckCircle2 size={80} color="#10b981" />
                    <Text style={styles.successTitle}>Post created successfully</Text>
                    <Text style={styles.successSubtitle}>
                        Your post has been created successfully. You can review it in your post list.
                    </Text>
                    <Button onPress={() => navigation.navigate('MyPost')} style={styles.successButton}>
                        View my posts
                    </Button>
                    <Button
                        variant="outline"
                        onPress={() => actions.setSubmitted(false)}
                        style={styles.successButton}
                    >
                        Create another post
                    </Button>
                </View>
            </MobileLayout>
        )
    }

    return (
        <MobileLayout title="Create New Post" backButton={() => navigation.goBack()}>
            <Card style={styles.card}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Images</Text>
                    <Text style={styles.sectionHint}>Up to 10 images</Text>
                </View>

                <View style={styles.mediaGrid}>
                    <TouchableOpacity style={styles.uploadBtn} onPress={actions.pickMedia} disabled={state.submitting}>
                        <ImagePlus size={24} color="#10b981" />
                        <Text style={styles.uploadText}>Add images</Text>
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
                    label="Post title"
                    value={state.formData.postTitle}
                    onChangeText={(txt) => actions.setFormData({ ...state.formData, postTitle: txt })}
                    icon={<Tag size={16} color="#10b981" />}
                    required
                />

                <Text style={styles.label}>Category *</Text>
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
                    label="Price"
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
                            label="Location"
                            value={state.formData.postLocation}
                            onChangeText={(txt) => actions.setFormData({ ...state.formData, postLocation: txt })}
                            icon={<MapPin size={16} color="#10b981" />}
                            placeholder="Shop address will be used for this post"
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
                            <Text style={styles.useShopLocationText}>Use shop address</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Input
                        testID="create-post-location-input"
                        label="Location"
                        value={state.formData.postLocation}
                        onChangeText={(txt) => actions.setFormData({ ...state.formData, postLocation: txt })}
                        icon={<MapPin size={16} color="#10b981" />}
                        placeholder="Example: Cau Giay, Hanoi"
                    />
                )}
                {isShop && shop?.shopPhone ? (
                    <View style={styles.locationBlock}>
                        <Input
                            testID="create-post-contact-phone-input"
                            label="Contact phone number"
                            type="phone-pad"
                            value={state.formData.postContactPhone}
                            onChangeText={(txt) => actions.setFormData({ ...state.formData, postContactPhone: txt })}
                            icon={<Phone size={16} color="#10b981" />}
                            placeholder="Leave blank to use the default number"
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
                            <Text style={styles.useShopLocationText}>Use shop phone</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Input
                        testID="create-post-contact-phone-input"
                        label="Contact phone number"
                        type="phone-pad"
                        value={state.formData.postContactPhone}
                        onChangeText={(txt) => actions.setFormData({ ...state.formData, postContactPhone: txt })}
                        icon={<Phone size={16} color="#10b981" />}
                        placeholder="Leave blank to use the default number"
                    />
                )}

            </Card>

            {state.loadingAttributes ? (
                <ActivityIndicator style={styles.attributeLoading} color="#10b981" />
            ) : state.attributes.length > 0 ? (
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Category attributes</Text>
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
                {state.submitting ? 'Submitting...' : 'Submit post'}
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

})

export default CreatePostLayout
