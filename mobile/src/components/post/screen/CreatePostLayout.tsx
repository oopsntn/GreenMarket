import React from 'react'
import { useNavigation } from '@react-navigation/native'
import useCreatePost from '../service/useCreatePost'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import { CheckCircle2, CircleDollarSign, ImagePlus, Tag, X } from 'lucide-react-native'
import Button from '../../Reused/Button/Button'
import Card from '../../Reused/Card/Card'
import Input from '../../Reused/Input/Input'

const CreatePostLayout = () => {
    const navigation = useNavigation<any>()
    const { state, actions } = useCreatePost()

    if (state.submitted) {
        return (
            <MobileLayout title="Thành công">
                <View style={styles.successContainer}>
                    <CheckCircle2 size={80} color='#10b981' />
                    <Text style={styles.successTitle}>Đăng bài thành công</Text>
                    <Button onPress={() => navigation.navigate('MyPost')}>Xem tin của tôi</Button>
                </View>
            </MobileLayout>
        )
    }
    return (
        <MobileLayout title='Tạo bài đăng mới' backButton={() => navigation.goBack()}>
            <ScrollView horizontal style={styles.mediaRow}>
                <TouchableOpacity style={styles.uploadBtn} onPress={actions.pickMedia}>
                    <ImagePlus size={24} color='#666' />
                </TouchableOpacity>
                {state.media.map((item, index) => (
                    <View key={index} style={styles.mediaPreview}>
                        <Image source={{ uri: item.uri }} style={styles.imageThumb} />
                        <TouchableOpacity style={styles.removeBadge} onPress={() => actions.removeMedia(index)}>
                            <X size={10} color='#fff' />
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>

            <Card style={styles.card}>
                <Input label='Tiêu đề tin' value={state.formData.postTitle} onChangeText={(txt) => actions.setFormData({ ...state.formData, postTitle: txt })} icon={<Tag size={16} color='#10b981' />} />
                <Text style={styles.label}>Danh mục</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
                    {state.categories.map(cat => (
                        <TouchableOpacity
                            key={cat.categoryId}
                            style={[styles.catItem, state.formData.categoryId === String(cat.categoryId) && styles.catActive]}
                            onPress={() => actions.handleCategorySelect(String(cat.categoryId))}
                        >
                            <Text style={[styles.catText, state.formData.categoryId === String(cat.categoryId) && styles.catTextActive]}>
                                {cat.categoryTitle}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Input
                    label="Giá bán"
                    type="numeric"
                    value={state.formData.postPrice}
                    onChangeText={(txt) => actions.setFormData({ ...state.formData, postPrice: txt })}
                    icon={<CircleDollarSign size={16} color="#10b981" />}
                />
            </Card>

            {/* Section Thuộc tính động */}
            {state.loadingAttributes ? <ActivityIndicator /> : state.attributes.length > 0 && (
                <Card style={styles.card}>
                    {state.attributes.map(attr => (
                        <Input
                            key={attr.attributeId}
                            label={attr.attributeTitle}
                            value={state.formData.attributes[attr.attributeId] || ''}
                            onChangeText={(val) => actions.setFormData({
                                ...state.formData,
                                attributes: { ...state.formData.attributes, [attr.attributeId]: val }
                            })}
                        />
                    ))}
                </Card>
            )}

            <Button onPress={actions.submitForm} disabled={state.submitting} style={styles.submitBtn}>
                {state.submitting ? 'Đang đăng...' : 'Đăng tin'}
            </Button>
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    mediaRow: { padding: 16, flexDirection: 'row' },
    uploadBtn: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' },
    mediaPreview: { marginLeft: 10, width: 80, height: 80, position: 'relative' },
    imageThumb: { width: '100%', height: '100%', borderRadius: 12 },
    removeBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 10, padding: 3 },
    card: { marginHorizontal: 16, marginBottom: 16, padding: 16 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#444' },
    catRow: { marginBottom: 10 },
    catItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: '#eee', marginRight: 8 },
    catActive: { backgroundColor: '#e8f5e9', borderColor: '#10b981', borderWidth: 1 },
    catText: { fontSize: 12, color: '#666' },
    catTextActive: { color: '#10b981', fontWeight: '700' },
    submitBtn: { marginHorizontal: 16, marginTop: 10 },
    successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    successTitle: { fontSize: 20, fontWeight: '700', marginVertical: 20 },
})

export default CreatePostLayout
