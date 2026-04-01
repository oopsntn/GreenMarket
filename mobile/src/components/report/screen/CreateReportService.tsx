import React from 'react'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useCreateReport } from '../service/useCreatereport'
import { AlertTriangle, FileText } from 'lucide-react-native'
import Button from '../../Reused/Button/Button'
import Input from '../../Reused/Input/Input'

const CreateReportScreen = ({ route, navigation }: any) => {
    const { postId, postTitle } = route.params
    const { reportReason,
        setReportReason,
        description,
        setDescription,
        loading,
        reasons,
        handleSubmit } = useCreateReport(postId, 1)

    return (
        <MobileLayout title="Báo cáo vi phạm" backButton={() => navigation.goBack()}>
            <ScrollView style={styles.container}>
                {/* Tóm tắt bài đăng bị báo cáo */}
                <View style={styles.headerInfo}>
                    <AlertTriangle color="#ef4444" size={20} />
                    <Text style={styles.headerText}>Bạn đang báo cáo bài đăng: </Text>
                    <Text style={[styles.headerText, { fontWeight: 'bold' }]}>{postTitle}</Text>
                </View>

                <Text style={styles.sectionTitle}>Chọn lý do vi phạm</Text>

                {reasons.map((item) => (
                    <TouchableOpacity key={item}
                        style={[styles.reasonItem, reportReason === item && styles.activeReason]}
                        onPress={() => setReportReason(item)}>
                        <Text style={[styles.reasonText, reportReason === item && styles.activeReasonText]}>{item}</Text>
                        <View style={[styles.radio, reportReason === item && styles.radioActive]} />
                    </TouchableOpacity>
                ))}

                <Text style={styles.sectionTitle}>Mô tả chi tiết (không bắt buộc)</Text>
                <Input
                    label="Mô tả chi tiết (không bắt buộc)"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Cung cấp thêm thông tin để chúng tôi xử lý nhanh hơn..."
                    multiline={true} // Bật chế độ nhiều dòng
                    numberOfLines={4}
                    icon={<FileText size={18} color="#999" />} // Thêm icon cho đẹp
                />
                <Button
                    disabled={loading}
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
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    activeReason: {
        borderColor: '#ef4444',
        backgroundColor: '#fff1f2'
    },
    reasonText: {
        fontSize: 14,
        color: '#444',
    },
    activeReasonText: {
        color: '#ef4444',
        fontWeight: 'bold',
    },
    radio: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#ccc',
    },
    radioActive: {
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 30,
    },
    submitBtn: {
        backgroundColor: '#ef4444',
        borderRadius: 12,
    }
})

export default CreateReportScreen
