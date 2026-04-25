import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
} from 'react-native';
import { ArrowLeft, CircleAlert, MessageSquareMore } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const PayoutRequestScreen = () => {
    const navigation = useNavigation<any>();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ArrowLeft color="#1E293B" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thông tin thanh toán</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.noticeCard}>
                    <CircleAlert color="#CA8A04" size={28} />
                    <Text style={styles.noticeTitle}>Không còn yêu cầu rút tiền trong app</Text>
                    <Text style={styles.noticeText}>
                        GreenMarket không xử lý ví hoặc chi trả cho cộng tác viên. Sau khi hoàn thành công việc, bạn cần liên hệ trực tiếp với khách hàng để thống nhất chi phí và nhận thanh toán ngoài hệ thống.
                    </Text>
                </View>

                <View style={styles.tipCard}>
                    <MessageSquareMore color="#2563EB" size={22} />
                    <View style={styles.tipBody}>
                        <Text style={styles.tipTitle}>Gợi ý làm việc an toàn</Text>
                        <Text style={styles.tipText}>
                            Hãy xác nhận rõ đầu việc, chi phí, thời gian thanh toán và lưu lại nội dung trao đổi với khách hàng trước khi bắt đầu.
                        </Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.primaryButtonText}>Quay lại</Text>
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
    content: {
        flex: 1,
        padding: 24,
        gap: 18,
    },
    noticeCard: {
        backgroundColor: '#FEFCE8',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 24,
        padding: 20,
        gap: 10,
    },
    noticeTitle: {
        fontSize: 21,
        lineHeight: 28,
        fontWeight: '800',
        color: '#92400E',
    },
    noticeText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#78350F',
    },
    tipCard: {
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
    tipBody: {
        flex: 1,
        gap: 4,
    },
    tipTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    tipText: {
        fontSize: 13,
        lineHeight: 20,
        color: '#64748B',
    },
    primaryButton: {
        marginTop: 'auto',
        height: 56,
        borderRadius: 18,
        backgroundColor: '#111827',
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '800',
    },
});

export default PayoutRequestScreen;
