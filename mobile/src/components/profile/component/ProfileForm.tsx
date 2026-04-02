import React from 'react'
import { View } from 'react-native'
import { Mail, MapPin, Phone, Store, User } from 'lucide-react-native'
import Input from '../../Reused/Input/Input'
import { ProfileFormData } from '../service/useProfile'

interface ProfileFormProps {
    formData: ProfileFormData
    setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>
    isShop: boolean
}

export const ProfileForm = ({ formData, setFormData, isShop }: ProfileFormProps) => (
    <View>
        <Input
            label={isShop ? 'Shop name' : 'Display name'}
            value={isShop ? formData.shopName : formData.displayName}
            onChangeText={(txt) =>
                setFormData((prev) => ({ ...prev, [isShop ? 'shopName' : 'displayName']: txt }))
            }
            icon={isShop ? <Store size={18} color="#666" /> : <User size={18} color="#666" />}
            required
        />

        <Input
            label={isShop ? 'Shop phone number' : 'Phone number'}
            value={isShop ? formData.shopPhone : formData.mobile}
            disabled={!isShop}
            onChangeText={(txt) => setFormData((prev) => ({ ...prev, shopPhone: txt }))}
            icon={<Phone size={18} color="#666" />}
            type="phone-pad"
            required={isShop}
        />

        <Input
            label="Contact email"
            value={formData.email}
            onChangeText={(txt) => setFormData((prev) => ({ ...prev, email: txt }))}
            icon={<Mail size={18} color="#666" />}
            type="email-address"
        />

        <Input
            label="Address"
            value={isShop ? formData.shopLocation : formData.location}
            onChangeText={(txt) =>
                setFormData((prev) => ({ ...prev, [isShop ? 'shopLocation' : 'location']: txt }))
            }
            icon={<MapPin size={18} color="#666" />}
            required={isShop}
        />

        <Input
            label={isShop ? 'Shop description' : 'About you'}
            value={isShop ? formData.shopDescription : formData.bio}
            multiline
            numberOfLines={4}
            onChangeText={(txt) =>
                setFormData((prev) => ({ ...prev, [isShop ? 'shopDescription' : 'bio']: txt }))
            }
        />
    </View>
)
