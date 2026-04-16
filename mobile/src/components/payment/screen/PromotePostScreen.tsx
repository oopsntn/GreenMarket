import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import { CheckCircle2, CreditCard, Rocket, ShieldCheck } from 'lucide-react-native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import Card from '../../Reused/Card/Card';
import Button from '../../Reused/Button/Button';
import { paymentService, PromotionPackage } from '../service/paymentService';
import CustomAlert from '../../../utils/AlertHelper';

const PromotePostScreen = ({ route }: any) => {
    const navigation = useNavigation<any>();
    const { post } = route.params;

    const [packages, setPackages] = useState<PromotionPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPackage, setSelectedPackage] = useState<PromotionPackage | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            setLoading(true);
            const res = await paymentService.getPackages();
            setPackages(Array.isArray(res) ? res : []);
        } catch (error) {
            console.error('Error fetching packages:', error);
            CustomAlert('Lỗi', 'Không thể tải các gói đẩy tin.');
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async () => {
        if (!selectedPackage) {
            CustomAlert('Yêu cầu chọn', 'Vui lòng chọn một gói đẩy tin trước.');
            return;
        }

        try {
            setProcessing(true);
            const res = await paymentService.buyPackage(post.postId, selectedPackage.promotionPackageId);
            
            if (res.paymentUrl) {
                await WebBrowser.openBrowserAsync(res.paymentUrl);
                
                CustomAlert(
                    'Trạng thái thanh toán',
                    'Cổng thanh toán đã được mở. Sau khi hoàn tất thanh toán, vui lòng kiểm tra trạng thái trong bảng điều khiển của cửa hàng.',
                    [
                        { 
                            text: 'OK', 
                            onPress: () => navigation.replace('ShopDashboard') 
                        }
                    ]
                );
            } else {
                CustomAlert('Lỗi', 'Không thể tạo liên kết thanh toán.');
            }
        } catch (error: any) {
            console.error('Promotion error:', error);
            CustomAlert('Lỗi', error?.response?.data?.error || 'Đã xảy ra lỗi trong quá trình thanh toán.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <MobileLayout title="Đẩy tin đăng" backButton={() => navigation.goBack()}>
            <View style={styles.container}>
                <Card style={styles.postCard}>
                    <View style={styles.postHeader}>
                        <Rocket size={20} color="#8b5cf6" />
                        <Text style={styles.postTitle} numberOfLines={1}>Đang đẩy: {post.postTitle}</Text>
                    </View>
                    <Text style={styles.postDesc}>Đẩy tin sẽ giúp bài viết của bạn xuất hiện ở đầu kết quả tìm kiếm, tăng lượt xem và tương tác.</Text>
                </Card>

                <Text style={styles.sectionTitle}>Chọn một gói</Text>

                {loading ? (
                    <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {packages.map((pkg) => (
                            <TouchableOpacity
                                key={pkg.promotionPackageId}
                                onPress={() => setSelectedPackage(pkg)}
                                activeOpacity={0.7}
                            >
                                <Card style={[
                                    styles.packageCard,
                                    selectedPackage?.promotionPackageId === pkg.promotionPackageId && styles.selectedCard
                                ]}>
                                    <View style={styles.packageInfo}>
                                        <View style={styles.pkgMain}>
                                            <Text style={styles.pkgTitle}>{pkg.promotionPackageTitle}</Text>
                                            <Text style={styles.pkgDuration}>Gói {pkg.promotionPackageDurationDays} ngày</Text>
                                            <Text style={styles.pkgMeta}>
                                                {pkg.slotTitle || pkg.slotCode || 'Vị trí tiêu chuẩn'}
                                                {pkg.slotRules?.priority ? ` • Ưu tiên ${pkg.slotRules.priority}` : ''}
                                            </Text>
                                        </View>
                                        <Text style={styles.pkgPrice}>
                                            {new Intl.NumberFormat('en-US').format(pkg.promotionPackagePrice)} VND
                                        </Text>
                                    </View>
                                    
                                    {selectedPackage?.promotionPackageId === pkg.promotionPackageId && (
                                        <View style={styles.checkIcon}>
                                            <CheckCircle2 size={24} color="#10b981" />
                                        </View>
                                    )}
                                </Card>
                            </TouchableOpacity>
                        ))}

                        <View style={styles.guaranteeBox}>
                            <ShieldCheck size={16} color="#059669" />
                            <Text style={styles.guaranteeText}>Thanh toán an toàn qua cổng tích hợp sẵn</Text>
                        </View>
                    </ScrollView>
                )}
            </View>

            <View style={styles.bottomBar}>
                <Button
                    variant="primary"
                    icon={<CreditCard size={20} color="#fff" />}
                    loading={processing}
                    disabled={processing || !selectedPackage}
                    onPress={handlePromote}
                    style={styles.payBtn}
                >
                    Tiến hành thanh toán
                </Button>
            </View>
        </MobileLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    postCard: {
        padding: 16,
        backgroundColor: '#f5f3ff',
        borderColor: '#ddd6fe',
        borderWidth: 1,
        marginBottom: 24,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    postTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#4c1d95',
    },
    postDesc: {
        fontSize: 13,
        color: '#6d28d9',
        lineHeight: 18,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    packageCard: {
        padding: 18,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#f3f4f6',
    },
    selectedCard: {
        borderColor: '#10b981',
        backgroundColor: '#f0fdf4',
    },
    packageInfo: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pkgMain: {
        flex: 1,
    },
    pkgTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    pkgDuration: {
        fontSize: 12,
        color: '#6b7280',
    },
    pkgMeta: {
        marginTop: 4,
        fontSize: 11,
        color: '#64748b',
    },
    pkgPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: '#10b981',
    },
    checkIcon: {
        marginLeft: 12,
    },
    guaranteeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
        marginBottom: 30,
    },
    guaranteeText: {
        fontSize: 12,
        color: '#059669',
        fontWeight: '500',
    },
    bottomBar: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    payBtn: {
        height: 52,
    }
});

export default PromotePostScreen;
