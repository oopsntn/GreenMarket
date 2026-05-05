import React from 'react'
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Card from '../../Reused/Card/Card'
import Input from '../../Reused/Input/Input'
import Button from '../../Reused/Button/Button'

interface EditData {
    title: string;
    categoryId: number;
    location: string;
    contactPhone: string;
    attributes: Record<number, string>;
}

interface ModalProps {
    visible: boolean;
    editingPost: any;
    editData: EditData;
    setEditData: React.Dispatch<React.SetStateAction<EditData>>;
    onClose: () => void;
    onSave: (postId: number, data: any) => void;
    onCategoryChange: (categoryId: number) => Promise<void> | void;
    categories: any[];
    categoryAttributes: any[];
    saving?: boolean;
    hideLocation?: boolean;
}

const EditPostModal = ({
    visible,
    editingPost,
    editData,
    setEditData,
    onClose,
    onSave,
    onCategoryChange,
    categories,
    categoryAttributes,
    saving = false,
    hideLocation = false,
}: ModalProps) => {
    if (!editingPost) return null

    const handleAttributeChange = (attributeId: number, value: string) => {
        setEditData((prev) => ({
            ...prev,
            attributes: {
                ...prev.attributes,
                [attributeId]: value,
            },
        }))
    }

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <Card style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Cập nhật thông tin tin đăng</Text>

                    <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 560 }}>
                        <Input
                            label="Tiêu đề tin đăng"
                            value={editData.title}
                            onChangeText={(t) => setEditData((prev) => ({ ...prev, title: t }))}
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
                                    onPress={() => onCategoryChange(cat.categoryId)}
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

                        {!hideLocation && (
                            <Input
                                label="Địa chỉ"
                                value={editData.location}
                                onChangeText={(t) => setEditData((prev) => ({ ...prev, location: t }))}
                                placeholder="Ví dụ: Quận 1, TP.HCM"
                            />
                        )}

                        <Input
                            label="Số điện thoại liên hệ"
                            type="phone-pad"
                            value={editData.contactPhone}
                            onChangeText={(t) => setEditData((prev) => ({ ...prev, contactPhone: t }))}
                            placeholder="Để trống nếu dùng số mặc định"
                        />

                        {categoryAttributes.length > 0 && (
                            <View style={styles.attributesSection}>
                                <Text style={styles.sectionTitle}>Thuộc tính chi tiết</Text>
                                {categoryAttributes.map((attr) => {
                                    const isNumeric =
                                        attr.attributeDataType === 'number' ||
                                        attr.attributeDataType === 'decimal'

                                    const attributeOptions = Array.isArray(attr.attributeOptions)
                                        ? attr.attributeOptions.filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
                                        : []

                                    return (
                                        <View key={attr.attributeId}>
                                            {attributeOptions.length > 0 ? (
                                                <View style={styles.optionGroup}>
                                                    <Text style={styles.optionLabel}>{`${attr.attributeTitle}${attr.required ? ' *' : ''}`}</Text>
                                                    <View style={styles.optionWrap}>
                                                        {attributeOptions.map((option: string) => (
                                                            <TouchableOpacity
                                                                key={`${attr.attributeId}-${option}`}
                                                                style={[
                                                                    styles.optionChip,
                                                                    editData.attributes[attr.attributeId] === option && styles.optionChipActive,
                                                                ]}
                                                                onPress={() => handleAttributeChange(attr.attributeId, option)}
                                                            >
                                                                <Text
                                                                    style={[
                                                                        styles.optionChipText,
                                                                        editData.attributes[attr.attributeId] === option && styles.optionChipTextActive,
                                                                    ]}
                                                                >
                                                                    {option}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </View>
                                                </View>
                                            ) : (
                                                <Input
                                                    label={`${attr.attributeTitle}${attr.required ? ' *' : ''}`}
                                                    value={editData.attributes[attr.attributeId] || ''}
                                                    type={isNumeric ? 'decimal-pad' : 'default'}
                                                    onChangeText={(value) => handleAttributeChange(attr.attributeId, value)}
                                                    placeholder={`Nhập ${attr.attributeTitle}`}
                                                />
                                            )}
                                        </View>
                                    )
                                })}
                            </View>
                        )}
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
                                categoryId: editData.categoryId,
                                postLocation: editData.location,
                                postContactPhone: editData.contactPhone,
                                attributes: Object.entries(editData.attributes)
                                    .filter(([, value]) => value.trim())
                                    .map(([attributeId, value]) => ({
                                        attributeId: Number(attributeId),
                                        value: value.trim(),
                                    })),
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
    attributesSection: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    optionGroup: {
        marginBottom: 12,
    },
    optionLabel: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    optionWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    optionChipActive: {
        backgroundColor: '#e8f5e9',
        borderColor: '#10b981',
    },
    optionChipText: {
        fontSize: 12,
        color: '#4b5563',
        fontWeight: '600',
    },
    optionChipTextActive: {
        color: '#047857',
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
