import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck } from 'lucide-react-native';
import CustomAlert from '../../../utils/AlertHelper';
import { useProfile } from '../service/useProfile';
import { useAuth } from '../../../context/AuthContext';
import { ProfileService } from '../service/ProfileService';
import { resolveImageUrl } from '../../../utils/resolveImageUrl';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileForm } from './ProfileForm';

type PersonalProfileEditorProps = {
    title: string;
    subtitle: string;
    roleLabel: string;
    gradientColors: [string, string];
};

const PersonalProfileEditor = ({
    title,
    subtitle,
    roleLabel,
    gradientColors,
}: PersonalProfileEditorProps) => {
    const navigation = useNavigation<any>();
    const { formData, setFormData, loading, saving, handleSave } = useProfile();
    const { updateUser } = useAuth();

    const handleUpdateAvatar = async (localUri: string) => {
        try {
            const uploadRes = await ProfileService.uploadAvatar(localUri);
            if (!uploadRes?.urls?.[0]) {
                throw new Error('Invalid upload response');
            }

            const serverImageUrl = uploadRes.urls[0];
            await ProfileService.updateProfile({ userAvatarUrl: serverImageUrl });
            await updateUser({ userAvatarUrl: serverImageUrl });

            setFormData((prev) => ({
                ...prev,
                avatarUrl: resolveImageUrl(serverImageUrl),
            }));

            CustomAlert('Thành công', 'Đã cập nhật ảnh đại diện.');
        } catch (error) {
            console.error('Failed to update personal avatar:', error);
            CustomAlert('Lỗi', 'Không thể cập nhật ảnh đại diện lúc này.');
        }
    };

    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            CustomAlert('Thông báo', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            await handleUpdateAvatar(result.assets[0].uri);
        }
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >
                    <LinearGradient colors={gradientColors} style={styles.hero}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Text style={styles.backButtonText}>Quay lại</Text>
                        </TouchableOpacity>
                        <Text style={styles.heroTitle}>{title}</Text>
                        <Text style={styles.heroSubtitle}>{subtitle}</Text>
                    </LinearGradient>

                    <View style={styles.content}>
                        <ProfileAvatar uri={formData.avatarUrl} onPickImage={pickImage} isVerified />

                        <View style={styles.identityCard}>
                            <Text style={styles.displayName}>{formData.displayName || 'Chưa cập nhật tên hiển thị'}</Text>
                            <View style={styles.badgeRow}>
                                <View style={styles.roleBadge}>
                                    <ShieldCheck size={14} color="#047857" />
                                    <Text style={styles.roleBadgeText}>{roleLabel}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.formCard}>
                            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
                            <Text style={styles.sectionSubtitle}>
                                Bạn có thể cập nhật tên hiển thị, ảnh đại diện, email, địa chỉ và phần giới thiệu.
                            </Text>
                            <ProfileForm
                                formData={formData}
                                setFormData={setFormData}
                                isShop={false}
                                readOnly={false}
                            />
                        </View>

                        <TouchableOpacity style={styles.primaryButton} disabled={saving} onPress={handleSave}>
                            {saving ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Lưu thay đổi</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.bottomSpacer} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    keyboardContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 48,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    hero: {
        paddingTop: 18,
        paddingHorizontal: 20,
        paddingBottom: 88,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    backButton: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    heroTitle: {
        marginTop: 18,
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: '800',
    },
    heroSubtitle: {
        marginTop: 8,
        color: '#DCFCE7',
        fontSize: 14,
        lineHeight: 22,
    },
    content: {
        paddingHorizontal: 20,
        marginTop: -44,
    },
    identityCard: {
        marginTop: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 18,
        elevation: 3,
    },
    displayName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
    },
    badgeRow: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    roleBadgeText: {
        color: '#047857',
        fontSize: 12,
        fontWeight: '700',
    },
    formCard: {
        marginTop: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 14,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    sectionSubtitle: {
        marginTop: 6,
        marginBottom: 18,
        fontSize: 13,
        lineHeight: 20,
        color: '#64748B',
    },
    primaryButton: {
        marginTop: 20,
        backgroundColor: '#16A34A',
        borderRadius: 18,
        minHeight: 54,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
    bottomSpacer: {
        height: 96,
    },
});

export default PersonalProfileEditor;
