import React from 'react';
import PersonalProfileEditor from '../../components/profile/component/PersonalProfileEditor';

const ManagerProfileScreen = () => {
    return (
        <PersonalProfileEditor
            title="Hồ sơ quản lý"
            subtitle="Cập nhật thông tin cá nhân dùng cho vai trò kiểm duyệt và quản trị vận hành."
            roleLabel="Quản lý"
            gradientColors={['#14532D', '#16A34A']}
        />
    );
};

export default ManagerProfileScreen;
