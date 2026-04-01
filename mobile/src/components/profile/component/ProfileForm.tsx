import React from 'react';
import { View } from 'react-native';
import Input from '../../Reused/Input/Input';
import { Store, User, Phone, Mail, MapPin } from 'lucide-react-native';

export const ProfileForm = ({ formData, setFormData, isShop }: any) => (
    <View>
        <Input
            label={isShop ? "Tên nhà vườn" : "Tên hiển thị"}
            value={isShop ? formData.shopName : formData.displayName}
            onChangeText={(txt) => setFormData({ ...formData, [isShop ? 'shopName' : 'displayName']: txt })}
            icon={isShop ? <Store size={18} color="#666" /> : <User size={18} color="#666" />}
        />

        <Input
            label={isShop ? "Điện thoại vườn" : "Số điện thoại"}
            value={isShop ? formData.shopPhone : formData.mobile}
            disabled={!isShop}
            onChangeText={(txt) => setFormData({ ...formData, shopPhone: txt })}
            icon={<Phone size={18} color="#666" />}
        />

        <Input
            label="Email liên hệ"
            value={formData.email}
            onChangeText={(txt) => setFormData({ ...formData, email: txt })}
            icon={<Mail size={18} color="#666" />}
        />

        <Input
            label="Địa chỉ"
            value={isShop ? formData.shopLocation : formData.location}
            onChangeText={(txt) => setFormData({ ...formData, [isShop ? 'shopLocation' : 'location']: txt })}
            icon={<MapPin size={18} color="#666" />}
        />

        <Input
            label={isShop ? "Mô tả nhà vườn" : "Giới thiệu bản thân"}
            value={isShop ? formData.shopDescription : formData.bio}
            multiline
            numberOfLines={4}
            onChangeText={(txt) => setFormData({ ...formData, [isShop ? 'shopDescription' : 'bio']: txt })}
        />
    </View>
);