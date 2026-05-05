import React, { useCallback, useState } from 'react';
import {
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Award, Briefcase, Info, Mail, MailPlus, MapPin, MessageCircle, Phone } from 'lucide-react-native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import { CollaboratorService } from '../../../collaborator/services/collaboratorService';
import { ShopService } from '../../shop/service/shopService';
import CustomAlert from '../../../utils/AlertHelper';
import Button from '../../Reused/Button/Button';
import { resolveImageUrl } from '../../../utils/resolveImageUrl';

const PublicCollaboratorDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const collaboratorId = route.params?.id;

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState(false);

    const fetchDetail = async () => {
        try {
            const data = await CollaboratorService.getPublicCollaboratorDetail(collaboratorId);
            setProfile(data);
        } catch (error: any) {
            CustomAlert('Lỗi', 'Không thể tải thông tin cộng tác viên');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (collaboratorId) {
                fetchDetail();
            }
        }, [collaboratorId]),
    );

    const handleInvite = async () => {
        if (!profile?.userId) return;

        setInviting(true);
        try {
            await ShopService.inviteCollaborator(profile.userId.toString());
            CustomAlert('Thành công', 'Đã gửi lời mời cộng tác thành công');
            fetchDetail();
        } catch (error: any) {
            CustomAlert('Lỗi', error?.response?.data?.error || 'Không thể gửi lời mời');
        } finally {
            setInviting(false);
        }
    };

    const openZalo = async () => {
        if (!profile?.mobile) {
            CustomAlert('Thông báo', 'Cộng tác viên này chưa có số điện thoại để mở Zalo.');
            return;
        }

        try {
            await Linking.openURL(`https://zalo.me/${String(profile.mobile).replace(/\s+/g, '')}`);
        } catch (error) {
            console.error('Failed to open collaborator zalo:', error);
            CustomAlert('Lỗi', 'Không thể mở Zalo lúc này.');
        }
    };

    const makeCall = async () => {
        if (!profile?.mobile) {
            CustomAlert('Thông báo', 'Cộng tác viên này chưa có số điện thoại liên hệ.');
            return;
        }

        try {
            await Linking.openURL(`tel:${String(profile.mobile).replace(/\s+/g, '')}`);
        } catch (error) {
            console.error('Failed to call collaborator:', error);
            CustomAlert('Lỗi', 'Không thể mở ứng dụng gọi điện.');
        }
    };

    const sendMail = async () => {
        if (!profile?.email) {
            CustomAlert('Thông báo', 'Cộng tác viên này chưa có email công khai.');
            return;
        }

        try {
            await Linking.openURL(`mailto:${profile.email}`);
        } catch (error) {
            console.error('Failed to open mail app:', error);
            CustomAlert('Lỗi', 'Không thể mở ứng dụng email.');
        }
    };

    if (loading || !profile) {
        return (
            <MobileLayout title="Hồ sơ cộng tác viên" backButton={() => navigation.goBack()}>
                <Text style={styles.loadingText}>Đang tải...</Text>
            </MobileLayout>
        );
    }

    const isActive = profile.relationshipStatus === 'active';
    const isPending = profile.relationshipStatus === 'pending';

    return (
        <MobileLayout title="Hồ sơ cộng tác viên" backButton={() => navigation.goBack()}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.avatarWrapper}>
                        {profile.avatarUrl ? (
                            <Image source={{ uri: resolveImageUrl(profile.avatarUrl) }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarFallback]}>
                                <Briefcase size={36} color="#16A34A" />
                            </View>
                        )}
                    </View>

                    <Text style={styles.name}>{profile.displayName || 'Người dùng ẩn danh'}</Text>

                    {profile.location ? (
                        <View style={styles.locationRow}>
                            <MapPin size={14} color="#64748B" />
                            <Text style={styles.locationText}>{profile.location}</Text>
                        </View>
                    ) : null}
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Briefcase size={20} color="#0EA5E9" />
                        <Text style={styles.statValue}>{profile.stats?.totalGardens || 0}</Text>
                        <Text style={styles.statLabel}>Shop hợp tác</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statBox}>
                        <Award size={20} color="#8B5CF6" />
                        <Text style={styles.statValue}>{profile.stats?.totalPosts || 0}</Text>
                        <Text style={styles.statLabel}>Nội dung đã làm</Text>
                    </View>
                </View>

                <View style={styles.actionSection}>
                    {!isActive ? (
                        <>
                            <View style={styles.contactMask}>
                                <Info size={20} color="#D97706" />
                                <Text style={styles.maskText}>
                                    Thông tin liên hệ được bảo mật. Bạn cần gửi lời mời và được cộng tác viên chấp nhận
                                    để xem số điện thoại hoặc email.
                                </Text>
                            </View>
                            <Button
                                fullWidth
                                icon={<MailPlus size={18} color="white" />}
                                onPress={handleInvite}
                                loading={inviting}
                                disabled={inviting || isPending}
                                style={isPending ? { backgroundColor: '#94A3B8' } : {}}
                            >
                                {isPending ? 'Đã gửi lời mời (chờ phản hồi)' : 'Mời vào shop của tôi'}
                            </Button>
                        </>
                    ) : (
                        <View style={styles.contactCard}>
                            <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
                            <View style={styles.contactRow}>
                                <Phone size={18} color="#047857" />
                                <Text style={styles.contactInfo}>{profile.mobile || 'Không có số điện thoại'}</Text>
                            </View>
                            {profile.email ? (
                                <View style={styles.contactRow}>
                                    <Mail size={18} color="#047857" />
                                    <Text style={styles.contactInfo}>{profile.email}</Text>
                                </View>
                            ) : null}

                            <View style={styles.contactActions}>
                                <TouchableOpacity style={styles.contactActionBtn} onPress={openZalo}>
                                    <MessageCircle size={16} color="#0EA5E9" />
                                    <Text style={styles.contactActionText}>Zalo</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.contactActionBtn} onPress={makeCall}>
                                    <Phone size={16} color="#047857" />
                                    <Text style={styles.contactActionText}>Gọi điện</Text>
                                </TouchableOpacity>
                                {profile.email ? (
                                    <TouchableOpacity style={styles.contactActionBtn} onPress={sendMail}>
                                        <Mail size={16} color="#7C3AED" />
                                        <Text style={styles.contactActionText}>Email</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Giới thiệu</Text>
                    <Text style={styles.bioText}>
                        {profile.bio || 'Cộng tác viên này chưa cập nhật phần giới thiệu về bản thân.'}
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </MobileLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#64748B',
    },
    header: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    avatarWrapper: {
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E2E8F0',
        borderWidth: 3,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    avatarFallback: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        marginLeft: 6,
        color: '#64748B',
        fontSize: 14,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    divider: {
        width: 1,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 16,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0F172A',
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
    },
    actionSection: {
        padding: 16,
    },
    contactMask: {
        flexDirection: 'row',
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    maskText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 13,
        color: '#B45309',
        lineHeight: 18,
    },
    contactCard: {
        backgroundColor: '#ECFDF5',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    contactInfo: {
        fontSize: 16,
        color: '#065F46',
        fontWeight: '600',
        marginLeft: 12,
    },
    contactActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 16,
    },
    contactActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#D1FAE5',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    contactActionText: {
        color: '#0F172A',
        fontWeight: '700',
        fontSize: 12,
    },
    section: {
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
    },
    bioText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
    },
});

export default PublicCollaboratorDetailScreen;
