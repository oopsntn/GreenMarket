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
            Alert.alert('Permission needed', 'We need access to your gallery to upload results.');
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
            Alert.alert('Missing Info', 'Please upload at least one image of your work.');
            return;
        }

        setLoading(true);
        try {
            // In a real app, you would upload the local URIs to a server first 
            // to get permanent URLs. Here we simulate that by using the local URIs 
            // as the fileUrls for the mock backend.
            await CollaboratorService.submitDeliverables(jobId, images, note);
            
            Alert.alert(
                'Job Completed', 
                'Your work has been submitted successfully!',
                [{ text: 'Great!', onPress: () => navigation.navigate('MyWork') }]
            );
        } catch (error: any) {
            console.error('Submission error:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to submit deliverables.');
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
                    <Text style={styles.headerTitle}>Submit Work</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.jobBox}>
                        <Text style={styles.jobLabel}>SUBMITTING FOR</Text>
                        <Text style={styles.jobTitle}>{title}</Text>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Deliverables</Text>
                            <Text style={styles.sectionCount}>{images.length}/5</Text>
                        </View>
                        <Text style={styles.sectionDesc}>Upload proofs, screenshots or result files.</Text>

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
                                    <Text style={styles.uploadText}>Add File</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Completion Note</Text>
                        <TextInput
                            style={styles.noteInput}
                            placeholder="Add any comments or instructions for the customer..."
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
                                <Text style={styles.submitBtnText}>Finish & Complete Job</Text>
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
