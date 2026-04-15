import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { 
    ArrowLeft, 
    Upload, 
    X, 
    FileText, 
    CheckCircle,
    Image as ImageIcon
} from 'lucide-react-native';
import { CollaboratorService } from '../services/collaboratorService';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

const SubmitWorkScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { jobId, title } = route.params;

    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [note, setNote] = useState('');

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Cần cấp quyền', 'Chúng tôi cần quyền truy cập thư viện ảnh để tải lên kết quả.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            const newImages = result.assets.map(asset => asset.uri);
            setImages(prev => [...prev, ...newImages].slice(0, 5)); // Limit to 5 images
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (images.length === 0) {
            Alert.alert('Thiếu thông tin', 'Vui lòng tải lên ít nhất một hình ảnh về kết quả công việc của bạn.');
            return;
        }

        setLoading(true);
        try {
            // In a real app, you would upload the local URIs to a server first 
            // to get permanent URLs. Here we simulate that by using the local URIs 
            // as the fileUrls for the mock backend.
            await CollaboratorService.submitDeliverables(jobId, images, note);
            
            Alert.alert(
                'Hoàn thành công việc', 
                'Kết quả công việc của bạn đã được nộp thành công!',
                [{ text: 'Tuyệt vời!', onPress: () => navigation.navigate('MyWork') }]
            );
        } catch (error: any) {
            console.error('Submission error:', error);
            Alert.alert('Lỗi', error.response?.data?.error || 'Lỗi khi nộp kết quả công việc.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <ArrowLeft color="#1E293B" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Nộp kết quả</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.jobBox}>
                        <Text style={styles.jobLabel}>NỘP KẾT QUẢ CHO</Text>
                        <Text style={styles.jobTitle}>{title}</Text>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Tài liệu kết quả</Text>
                            <Text style={styles.sectionCount}>{images.length}/5</Text>
                        </View>
                        <Text style={styles.sectionDesc}>Tải lên bằng chứng, ảnh chụp màn hình hoặc file kết quả.</Text>

                        <View style={styles.imageGrid}>
                            {images.map((uri, index) => (
                                <View key={index} style={styles.imageWrapper}>
                                    <View style={styles.imagePlaceholder}>
                                        <ImageIcon color="#94A3B8" size={32} />
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.removeBtn}
                                        onPress={() => removeImage(index)}
                                    >
                                        <X color="white" size={14} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {images.length < 5 && (
                                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                                    <Upload color="#16A34A" size={24} />
                                    <Text style={styles.uploadText}>Thêm File</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ghi chú hoàn thành</Text>
                        <TextInput
                            style={styles.noteInput}
                            placeholder="Thêm nhận xét hoặc hướng dẫn cho khách hàng..."
                            placeholderTextColor="#94A3B8"
                            multiline
                            numberOfLines={4}
                            value={note}
                            onChangeText={setNote}
                            textAlignVertical="top"
                        />
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.submitBtn, loading && styles.disabledBtn]} 
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <CheckCircle color="white" size={20} />
                                <Text style={styles.submitBtnText}>Hoàn thành & Kết thúc công việc</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    backBtn: {
        padding: 8,
    },
    scrollContent: {
        padding: 24,
    },
    jobBox: {
        backgroundColor: '#F1F5F9',
        padding: 20,
        borderRadius: 20,
        marginBottom: 32,
        borderLeftWidth: 4,
        borderLeftColor: '#16A34A',
    },
    jobLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 1,
        marginBottom: 6,
    },
    jobTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    sectionCount: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
    },
    sectionDesc: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 16,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    imageWrapper: {
        width: '30%',
        aspectRatio: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    imagePlaceholder: {
        flex: 1,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeBtn: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadBtn: {
        width: '30%',
        aspectRatio: 1,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#16A34A',
        borderStyle: 'dashed',
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    uploadText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#16A34A',
    },
    noteInput: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        height: 120,
        fontSize: 15,
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    footer: {
        padding: 24,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    submitBtn: {
        backgroundColor: '#111827',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    disabledBtn: {
        opacity: 0.6,
    },
    submitBtnText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    }
});

export default SubmitWorkScreen;
