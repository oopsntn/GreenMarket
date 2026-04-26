import React from 'react'
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../../Reused/Card/Card';
import Input from '../../Reused/Input/Input';
import Button from '../../Reused/Button/Button';

interface EditData {
    title: string;
    price: string;
    categoryId: number;
    content: string;
    location: string;
    contactPhone: string;
}

interface ModalProps {
    visible: boolean;
    editingPost: any;
    editData: EditData;
    setEditData: (data: EditData) => void;
    onClose: () => void;
    onSave: (postId: number, data: any) => void;
    categories: any[];
    saving?: boolean;
    styles: any;
}

const EditPostModal = ({
    visible, editingPost, editData, setEditData, onClose, onSave, categories, saving = false, styles: parentStyles
}: ModalProps) => {
    if (!editingPost) return null

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <Card style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Cập nhật thông tin tin đăng</Text>

                    <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                        <Input
                            label="Tiêu đề tin đăng"
                            value={editData.title}
                            onChangeText={(t) => setEditData({ ...editData, title: t })}
                            placeholder="Ví dụ: Cây bonsai hiếm"
                        />

                        <Text style={styles.label}>Danh mục</Text>
                        <View style={styles.categoryWrap}>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.categoryId}
                                    style={[
                                        styles.catItem,
                                        editData.categoryId === cat.categoryId && styles.catActive
                                    ]}
                                    onPress={() => setEditData({ ...editData, categoryId: cat.categoryId })}
                                >
                                    <Text style={[
                                        styles.catText,
                                        editData.categoryId === cat.categoryId && styles.catTextActive
                                    ]}>
                                        {cat.categoryTitle}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Input
                            label="Giá bán (VND)"
                            type="numeric"
                            value={editData.price}
                            onChangeText={(t) => setEditData({ ...editData, price: t })}
                            placeholder="0"
                        />

                        <Input
                            label="Địa chỉ"
                            value={editData.location}
                            onChangeText={(t) => setEditData({ ...editData, location: t })}
                            placeholder="Ví dụ: Quận 1, TP.HCM"
                        />

                        <Input
                            label="Số điện thoại liên hệ"
                            type="phone-pad"
                            value={editData.contactPhone}
                            onChangeText={(t) => setEditData({ ...editData, contactPhone: t })}
                            placeholder="Để trống nếu dùng số mặc định"
                        />

                        <Input
                            label="Mô tả"
                            value={editData.content}
                            onChangeText={(t) => setEditData({ ...editData, content: t })}
                            multiline
                            numberOfLines={4}
                            placeholder="Mô tả cây của bạn..."
                        />
                    </ScrollView>

                    <View style={styles.modalButtons}>
                        <Button
                            style={{ flex: 1, backgroundColor: '#f1f1f1' }}
                            textStyle={{ color: '#666' }}
                            onPress={onClose}
                            disabled={saving}
                        >
                            Hủy
                        </Button>

                        <View style={{ width: 12 }} />

                        <Button
                            style={{ flex: 1 }}
                            loading={saving}
                            disabled={saving}
                            onPress={() => onSave(editingPost.postId, {
                                postTitle: editData.title,
                                postPrice: editData.price,
                                categoryId: editData.categoryId,
                                postContent: editData.content,
                                postLocation: editData.location,
                                postContactPhone: editData.contactPhone
                            })}
                        >
                            Lưu thay đổi
                        </Button>
                    </View>
                </Card>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20
    },
    modalCard: {
        padding: 20,
        borderRadius: 20,
        backgroundColor: '#fff'
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 20,
        textAlign: 'center',
        color: '#111827'
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4b5563',
        marginBottom: 8,
        marginTop: 10
    },
    categoryWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16
    },
    catItem: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: 'transparent'
    },
    catActive: {
        backgroundColor: '#e8f5e9',
        borderColor: '#10b981'
    },
    catText: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500'
    },
    catTextActive: {
        color: '#10b981',
        fontWeight: '700'
    },
    modalButtons: {
        flexDirection: 'row',
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6'
    }
})

export default EditPostModal
