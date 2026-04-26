import React from 'react'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useCreateReport } from '../service/useCreatereport'
import { AlertTriangle, FileText, ImagePlus, Trash2 } from 'lucide-react-native'
import Button from '../../Reused/Button/Button'
import Input from '../../Reused/Input/Input'

const CreateReportScreen = ({ route, navigation }: any) => {
    const { postId, postTitle } = route.params
    const {
        selectedReason,
        setSelectedReason,
        description,
        setDescription,
        evidenceImages,
        loading,
        reasons,
        pickEvidenceImages,
        removeEvidenceImage,
        handleSubmit,
    } = useCreateReport(postId)

    return (
        <MobileLayout title="Báo cáo vi phạm" backButton={() => navigation.goBack()}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.headerInfo}>
                    <AlertTriangle color="#ef4444" size={20} />
                    <Text style={styles.headerText}>Bạn đang báo cáo tin: </Text>
                    <Text style={[styles.headerText, { fontWeight: 'bold' }]}>{postTitle}</Text>
                </View>

                <Text style={styles.sectionTitle}>Chọn lý do vi phạm</Text>

                {reasons.map((item) => (
                    <TouchableOpacity
                        key={item.code}
                        style={[styles.reasonItem, selectedReason?.code === item.code && styles.activeReason]}
                        onPress={() => setSelectedReason(item)}
                    >
                        <View style={styles.reasonContent}>
                            <Text style={[styles.reasonText, selectedReason?.code === item.code && styles.activeReasonText]}>
                                {item.label}
                            </Text>
                            <Text style={styles.reasonDescription}>{item.description}</Text>
                        </View>
                        <View style={[styles.radio, selectedReason?.code === item.code && styles.radioActive]} />
                    </TouchableOpacity>
                ))}

                <Text style={styles.sectionTitle}>Mô tả chi tiết (không bắt buộc)</Text>
                <Input
                    label="Mô tả chi tiết"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Cung cấp thêm thông tin để chúng tôi xử lý nhanh hơn..."
                    multiline
                    numberOfLines={4}
                    icon={<FileText size={18} color="#999" />}
                />

                <View style={styles.evidenceHeader}>
                    <Text style={styles.sectionTitle}>Ảnh bằng chứng</Text>
                    <Text style={styles.evidenceCount}>{evidenceImages.length}/5</Text>
                </View>

                <View style={styles.imageGrid}>
                    {evidenceImages.map((uri, index) => (
                        <View key={`${uri}-${index}`} style={styles.imageItem}>
                            <Image source={{ uri }} style={styles.imagePreview} />
                            <TouchableOpacity
                                style={styles.removeBadge}
                                onPress={() => removeEvidenceImage(index)}
                            >
                                <Trash2 size={12} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {evidenceImages.length < 5 && (
                        <TouchableOpacity style={styles.addImageBtn} onPress={pickEvidenceImages}>
                            <ImagePlus size={24} color="#ef4444" />
                            <Text style={styles.addImageText}>Thêm ảnh</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={styles.helperText}>
                    Ảnh bằng chứng sẽ được tải lên trước khi gửi báo cáo. Tối đa 5 ảnh.
                </Text>

                <Button
                    disabled={loading}
                    loading={loading}
                    onPress={() => handleSubmit(() => navigation.goBack())}
                    style={styles.submitBtn}
                >
                    Gửi báo cáo
                </Button>
            </ScrollView>
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    container: { padding: 16 },
    headerInfo: {
        flexDirection: 'row',
        backgroundColor: '#fee2e2',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20
    },
    headerText: {
        fontSize: 13,
        color: '#991b1b',
        marginLeft: 8,
        flexShrink: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 15,
        color: '#333',
    },
    reasonItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#eee',
        gap: 12,
    },
    activeReason: {
        borderColor: '#ef4444',
        backgroundColor: '#fff1f2'
    },
    reasonContent: {
        flex: 1,
    },
    reasonText: {
        fontSize: 14,
        color: '#444',
        fontWeight: '700',
    },
    activeReasonText: {
        color: '#ef4444',
    },
    reasonDescription: {
        marginTop: 4,
        fontSize: 12,
        lineHeight: 18,
        color: '#6b7280',
    },
    radio: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#ccc',
        marginTop: 2,
    },
    radioActive: {
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
    },
    evidenceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    evidenceCount: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9ca3af',
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    imageItem: {
        width: 96,
        height: 96,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#f3f4f6',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    removeBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(239,68,68,0.95)',
        borderRadius: 10,
        padding: 4,
    },
    addImageBtn: {
        width: 96,
        height: 96,
        borderRadius: 12,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: '#fca5a5',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff5f5',
        gap: 6,
    },
    addImageText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ef4444',
    },
    helperText: {
        marginTop: 10,
        marginBottom: 20,
        fontSize: 12,
        lineHeight: 18,
        color: '#6b7280',
    },
    submitBtn: {
        backgroundColor: '#ef4444',
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 24,
        minHeight: 52,
    },
    scrollContent: {
        paddingBottom: 120,
    },
})

export default CreateReportScreen
