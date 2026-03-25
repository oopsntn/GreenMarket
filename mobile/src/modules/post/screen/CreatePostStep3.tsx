import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { StyleSheet, Text } from 'react-native'
import MobileLayout from '../../../components/MobileLayout/MobileLayout'
import Card from '../../../components/Card/Card'
import Button from '../../../components/Button/Button'

const CreatePostStep3 = () => {
    const navigation = useNavigation()

    return (
        <MobileLayout title='Xem trước tin' backButton={() => navigation.goBack()}>
            <Card padding='large' shadow>
                <Text style={styles.previewTitle}>Sen đá để bàn</Text>
                <Text style={styles.priceText}>45.000 đ</Text>
                <Text style={styles.previewDesc}>Mô tả hiển thị</Text>
            </Card>

            <Button onPress={() => console.log('Gửi duyệt')} style={{ marginTop: 24 }}>
                <Text>Gửi duyệt</Text>
            </Button>

            <Button
                variant="outline"
                onPress={() => console.log('Lưu nháp')}
                style={{ marginTop: 12 }}
            >
                Lưu nháp
            </Button>
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    previewTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    priceText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2e7d32',
        marginBottom: 12,
    },
    previewDesc: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
})

export default CreatePostStep3
