import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MobileLayout from '../../../components/MobileLayout/MobileLayout';
import Card from '../../../components/Card/Card';
import CreatePostStep2 from './CreatePostStep2';
import { AlertCircle } from 'lucide-react-native';

export default function EditPost() {
    return (
        <MobileLayout title="Chỉnh sửa tin">
            {/* Thông báo lỗi dạng Card */}
            <Card padding="small" style={styles.errorCard}>
                <View style={styles.errorContent}>
                    <AlertCircle size={18} color="#c62828" />
                    <Text style={styles.errorText}>Tin bị từ chối: Thiếu hình ảnh rõ ràng</Text>
                </View>
            </Card>

            {/* Render Step 2 bên dưới */}
            <CreatePostStep2 />
        </MobileLayout>
    );
}

const styles = StyleSheet.create({
    errorCard: {
        backgroundColor: '#fdecea',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ffcfcf',
    },
    errorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    errorText: {
        color: '#c62828',
        fontSize: 13,
        fontWeight: '500',
    },
});