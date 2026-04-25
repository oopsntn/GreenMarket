import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
} from 'react-native';
import { CircleHelp, Handshake, Briefcase, ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const EarningsScreen = () => {
    const navigation = useNavigation<any>();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.heroCard}>
                    <CircleHelp color="#16A34A" size={28} />
                    <Text style={styles.heroTitle}>Thanh toán cộng tác không đi qua hệ thống</Text>
                    <Text style={styles.heroText}>
                        GreenMarket chỉ hỗ trợ kết nối cộng tác viên với khách hàng và theo dõi tiến độ công việc. Việc báo giá, thanh toán và đối soát sẽ do hai bên tự liên hệ trực tiếp.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Bạn nên làm gì sau khi nhận việc?</Text>

                    <View style={styles.stepCard}>
                        <Handshake color="#0F766E" size={20} />
                        <View style={styles.stepBody}>
                            <Text style={styles.stepTitle}>Trao đổi rõ phạm vi công việc</Text>
                            <Text style={styles.stepText}>
                                Chốt trước với khách hàng về đầu việc, thời gian, chi phí và cách thanh toán.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.stepCard}>
                        <Briefcase color="#2563EB" size={20} />
                        <View style={styles.stepBody}>
                            <Text style={styles.stepTitle}>Nộp kết quả trên app để lưu dấu vết công việc</Text>
                            <Text style={styles.stepText}>
                                Sau khi hoàn thành, hãy tải kết quả lên để khách hàng tiện đối chiếu và liên hệ tiếp.
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.navigate('Explore')}
                >
                    <Text style={styles.primaryButtonText}>Tiếp tục tìm việc</Text>
                    <ArrowRight color="white" size={18} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    content: {
        flex: 1,
        padding: 24,
        gap: 20,
    },
    heroCard: {
        backgroundColor: 'white',
        borderRadius: 28,
        padding: 24,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#ECFDF5',
    },
    heroTitle: {
        fontSize: 22,
        lineHeight: 30,
        fontWeight: '800',
        color: '#111827',
    },
    heroText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#475569',
        fontWeight: '500',
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },
    stepCard: {
        flexDirection: 'row',
        gap: 14,
        backgroundColor: 'white',
        borderRadius: 22,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    stepBody: {
        flex: 1,
        gap: 4,
    },
    stepTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    stepText: {
        fontSize: 13,
        lineHeight: 20,
        color: '#64748B',
    },
    primaryButton: {
        marginTop: 'auto',
        height: 56,
        borderRadius: 18,
        backgroundColor: '#16A34A',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '800',
    },
});

export default EarningsScreen;
