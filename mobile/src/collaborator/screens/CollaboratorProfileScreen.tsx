import React from 'react';
import PersonalProfileEditor from '../../components/profile/component/PersonalProfileEditor';

const CollaboratorProfileScreen = () => {
    return (
        <PersonalProfileEditor
            title="Hồ sơ cộng tác viên"
            subtitle="Cập nhật thông tin cá nhân để chủ shop nhận diện và liên hệ với bạn chính xác hơn."
            roleLabel="Cộng tác viên"
            gradientColors={['#166534', '#22C55E']}
        />
    );
};

export default CollaboratorProfileScreen;
