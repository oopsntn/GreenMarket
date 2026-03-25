import React, { useState } from 'react'
import MobileLayout from '../../../components/MobileLayout/MobileLayout'
import { useNavigation } from '@react-navigation/native'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Input from '../../../components/Input/Input'
import Card from '../../../components/Card/Card'

const CreatePostStep1 = () => {
    const navigation = useNavigation()
    const [text, setText] = useState('')
    return (
        <MobileLayout title='Chọn danh mục' backButton={() => navigation.goBack()}>
            <View style={{ padding: 16 }}>
                <Input placeholder='Tìm danh mục' icon="search" value={text} onChangeText={setText} />
                <Text style={styles.sectionTitle}>
                    Danh mục phổ biến
                </Text>

                {/* Giả lập Grid 2 cột */}
                <View style={styles.grid}>
                </View>
            </View>
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 12
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridItem: {
        width: '48%',
        marginBottom: 10,
    },
    categoryText: {
        textAlign: 'center',
        fontWeight: '500',
    }
})

export default CreatePostStep1
