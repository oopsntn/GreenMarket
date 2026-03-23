import React from 'react'
import MobileLayout from '../../../components/MobileLayout/MobileLayout'
import { Outlet } from 'react-router-native';

const CreatePostLayout = () => {
    return (
        <MobileLayout title='Tạo tin mới'>
            {/* Nội dung tạo tin sẽ nằm ở đây */}
            <Outlet />
        </MobileLayout>
    )
}

export default CreatePostLayout
