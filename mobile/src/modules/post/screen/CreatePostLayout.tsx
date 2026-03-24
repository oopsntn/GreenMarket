import React from 'react'
import MobileLayout from '../../../components/MobileLayout/MobileLayout'
import { useNavigation } from '@react-navigation/native'
import { View } from 'react-native'

const CreatePostLayout = () => {
    const navigation = useNavigation()
    return (
        <MobileLayout
            title='Tạo tin mới'
            backButton={() => navigation.goBack()}>
            {/* Nội dung tạo tin sẽ nằm ở đây */}

            <View style={{ padding: 20 }}>

            </View>
        </MobileLayout>
    )
}

export default CreatePostLayout
