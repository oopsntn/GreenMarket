import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StatusBar,
    Image,
} from 'react-native';
import {
    MapPin,
    Calendar,
    CircleDollarSign,
    ArrowLeft,
    MessageSquare,
    CheckCircle,
    XCircle,
    Info
} from 'lucide-react-native';
import { CollaboratorService, JobDetail } from '../services/collaboratorService';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const JobDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { jobId } = route.params;
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<JobDetail | null>(null);
    const [processing, setProcessing] = useState(false);

    const fetchDetail = async () => {
        try {
            const res = await CollaboratorService.getJobDetail(jobId);
            setData(res);
        } catch (error) {
            console.error('Error fetching job detail:', error);
            Alert.alert('Lỗi', 'Không thể tải chi tiết công việc.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [jobId]);

    const handleDecision = async (decision: 'accept' | 'decline') => {
        if (decision === 'decline') {
            // In a real app, you might show a reason modal
            Alert.alert(
                'Từ chối công việc',
                'Bạn có chắc chắn muốn từ chối công việc này không?',
                [
                    { text: 'Hủy', style: 'cancel' },
                    {
                        text: 'Có, Từ chối',
                        style: 'destructive',
                        onPress: () => submitDecision('decline')
                    }
                ]
            );
        } else {
            submitDecision('accept');
        }
    };

    const submitDecision = async (decision: 'accept' | 'decline', reason?: string) => {
        setProcessing(true);
        try {
            await CollaboratorService.decideJob(jobId, decision, reason);
            Alert.alert(
                'Thành công',
                decision === 'accept' ? 'Đã nhận việc! Bạn có thể theo dõi trong Việc của tôi.' : 'Đã từ chối công việc.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            console.error('Decision error:', error);
            Alert.alert('Lỗi', error.response?.data?.error || 'Thao tác thất bại.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#16A34A" />
            </View>
        );
    }

    if (!data) return null;

    const formattedPrice = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(data.price));

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Custom Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <ArrowLeft color="#1E293B" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Chi tiết công việc</Text>
                    <TouchableOpacity style={styles.actionBtn}>
                        <MessageSquare color="#16A34A" size={24} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {/* Main Info Card */}
                    <View style={styles.mainCard}>
                        <View style={styles.categoryRow}>
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>{data.category || 'Chung'}</Text>
                            </View>
                            <Text style={styles.dateText}>
                                Đã thêm {new Date(data.createdAt).toLocaleDateString()}
                            </Text>
                        </View>

                        <Text style={styles.title}>{data.title}</Text>

                        <View style={styles.priceContainer}>
                            <CircleDollarSign color="#16A34A" size={24} />
                            <Text style={styles.priceText}>{formattedPrice}</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoGrid}>
                            <View style={styles.infoBox}>
                                <MapPin size={18} color="#64748B" />
                                <View>
                                    <Text style={styles.infoLabel}>Địa điểm</Text>
                                    <Text style={styles.infoValue}>{data.location || 'Từ xa'}</Text>
                                </View>
                            </View>
                            <View style={styles.infoBox}>
                                <Calendar size={18} color="#64748B" />
                                <View>
                                    <Text style={styles.infoLabel}>Hạn chót</Text>
                                    <Text style={styles.infoValue}>{new Date(data.deadline).toLocaleDateString()}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Section: Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Mô tả</Text>
                        <Text style={styles.descriptionText}>{data.description}</Text>
                    </View>

                    {/* Section: Requirements */}
                    {data.requirements && data.requirements.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Yêu cầu</Text>
                            {data.requirements.map((req, index) => (
                                <View key={index} style={styles.requirementRow}>
                                    <CheckCircle size={16} color="#16A34A" />
                                    <Text style={styles.requirementText}>{req}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Section: Customer */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
                        <View style={styles.customerCard}>
                            <View style={styles.customerAvatar}>
                                <Text style={styles.avatarText}>{data.customer.displayName?.charAt(0)}</Text>
                            </View>
                            <View style={styles.customerInfo}>
                                <Text style={styles.customerName}>{data.customer.displayName}</Text>
                                <Text style={styles.customerLocation}>{data.customer.location || 'Khách hàng đã xác thực'}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            {!data.isAssignedToMe && data.status === 'open' && (
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={styles.declineBtn}
                        onPress={() => handleDecision('decline')}
                        disabled={processing}
                    >
                        <XCircle color="#EF4444" size={20} />
                        <Text style={styles.declineText}>Từ chối</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => handleDecision('accept')}
                        disabled={processing}
                    >
                        {processing ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <CheckCircle color="white" size={20} />
                                <Text style={styles.acceptText}>Nhận việc</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {data.isAssignedToMe && (
                <View style={styles.bottomBar}>
                    <View style={styles.assignedBadge}>
                        <Info color="#3B82F6" size={20} />
                        <Text style={styles.assignedText}>Bạn đang thực hiện công việc này</Text>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    actionBtn: {
        padding: 8,
    },
    content: {
        padding: 20,
    },
    mainCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    categoryBadge: {
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#16A34A',
        textTransform: 'uppercase',
    },
    dateText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 16,
        lineHeight: 28,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    priceText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#16A34A',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 20,
    },
    infoGrid: {
        flexDirection: 'row',
        gap: 20,
    },
    infoBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoLabel: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    infoValue: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '700',
        marginTop: 2,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 12,
    },
    descriptionText: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 24,
    },
    requirementRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 8,
    },
    requirementText: {
        fontSize: 14,
        color: '#475569',
        flex: 1,
    },
    customerCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    customerAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#64748B',
    },
    customerInfo: {

    },
    customerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    customerLocation: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    declineBtn: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FECACA',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    declineText: {
        color: '#EF4444',
        fontSize: 15,
        fontWeight: '700',
    },
    acceptBtn: {
        flex: 2,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#16A34A',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    acceptText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    assignedBadge: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#EFF6FF',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    assignedText: {
        color: '#3B82F6',
        fontSize: 14,
        fontWeight: '700',
    }
});

export default JobDetailScreen;
