import * as ImagePicker from 'expo-image-picker'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { FileText, LogOut, Store } from 'lucide-react-native'
import Button from '../../Reused/Button/Button'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import { ProfileAvatar } from '../component/ProfileAvatar'
import { ProfileForm } from '../component/ProfileForm'
import { useProfile } from '../service/useProfile'
import { useAuth } from '../../../context/AuthContext'
import CustomAlert from '../../../utils/AlertHelper'
import { ProfileService } from '../service/ProfileService'

const ProfileScreen = () => {
    const {
        formData,
        setFormData,
        loading,
        saving,
        handleSave,
        isShop,
    } = useProfile()
    const { logout, updateUser, refreshShop, shop } = useAuth()
    const navigation = useNavigation<any>()

    const handleUpdateAvatar = async (localUri: string) => {
        try {
            const uploadRes = await ProfileService.uploadAvatar(localUri)
            if (!uploadRes?.urls?.[0]) {
                throw new Error('Invalid upload response')
            }

            const serverImageUrl = uploadRes.urls[0]

            if (isShop && shop?.shopId) {
                await ProfileService.updateShop(shop.shopId, { shopLogoUrl: serverImageUrl })
                await refreshShop()
            } else {
                await ProfileService.updateProfile({ userAvatarUrl: serverImageUrl })
                await updateUser({ userAvatarUrl: serverImageUrl })
            }

            setFormData((prev) => ({ ...prev, avatarUrl: serverImageUrl }))
            CustomAlert('Success', 'Profile photo updated successfully.')
        } catch (e) {
            console.error('Avatar update error: ', e)
            CustomAlert('Error', 'Unable to save profile photo.')
        }
    }

    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permission.granted) {
            CustomAlert('Notice', 'Please grant photo library access')
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        })

        if (!result.canceled) {
            await handleUpdateAvatar(result.assets[0].uri)
        }
    }

    const handleLogout = () => {
        CustomAlert(
            'Sign out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel' },
                { text: 'Sign out', onPress: () => logout() }
            ]
        )
    }

    const renderShopStatus = () => {
        if (!isShop) {
            return (
                <Button
                    variant="outline"
                    onPress={() => navigation.navigate('RegisterShop')}
                    style={styles.primaryOutline}
                    textStyle={{ color: '#10b981' }}
                >
                    Open your shop now
                </Button>
            )
        }

        switch (shop?.shopStatus) {
            case 'pending':
                return (
                    <View style={styles.statusBannerPending}>
                        <Text style={styles.statusText}>Your shop profile is pending approval</Text>
                        <Text style={styles.statusSubText}>You can still update the information before it is activated.</Text>
                        <View style={styles.statusActions}>
                            <Button
                                variant="outline"
                                onPress={() => navigation.navigate('EditShop', { shop })}
                                style={styles.statusButton}
                                textStyle={{ color: '#b45309' }}
                            >
                                Edit profile
                            </Button>
                        </View>
                    </View>
                )
            case 'active':
                return (
                    <View style={styles.quickActions}>
                        <Button
                            variant="primary"
                            onPress={() => navigation.navigate('MyShop')}
                            icon={<Store size={18} color="#fff" />}
                            style={styles.quickButtonPrimary}
                        >
                            Go to my shop
                        </Button>
                        <Button
                            variant="outline"
                            onPress={() => navigation.navigate('MyPost')}
                            icon={<FileText size={18} color="#10b981" />}
                            style={styles.quickButtonOutline}
                            textStyle={{ color: '#10b981' }}
                        >
                            Manage posts
                        </Button>
                    </View>
                )
            case 'blocked':
                return (
                    <View style={styles.statusBannerBlocked}>
                        <Text style={styles.blockedTitle}>This shop has been blocked</Text>
                        <Text style={styles.blockedSubText}>Please contact support for more details.</Text>
                    </View>
                )
            case 'closed':
                return (
                    <TouchableOpacity
                        style={styles.statusBannerClosed}
                        onPress={() => navigation.navigate('EditShop', { shop })}
                    >
                        <Text style={styles.closedTitle}>This shop is currently closed</Text>
                        <Text style={styles.closedSubText}>Tap to update the information or prepare to reopen your shop.</Text>
                    </TouchableOpacity>
                )
            default:
                return (
                    <TouchableOpacity
                        style={styles.statusBannerBlocked}
                        onPress={() => navigation.navigate('EditShop', { shop })}
                    >
                        <Text style={styles.blockedTitle}>Profile rejected</Text>
                        <Text style={styles.blockedSubText}>Tap to review the information and resubmit your changes.</Text>
                    </TouchableOpacity>
                )
        }
    }

    if (loading) {
        return <ActivityIndicator style={{ flex: 1 }} size="large" color="#10b981" />
    }

    return (
        <MobileLayout title="My Profile">
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <ProfileAvatar uri={formData.avatarUrl} onPickImage={pickImage} />

                <View style={styles.section}>
                    {renderShopStatus()}
                    <Button
                        variant="outline"
                        onPress={() => navigation.navigate('BrowseShops')}
                        style={styles.browseButton}
                        textStyle={{ color: '#10b981' }}
                    >
                        Explore shops
                    </Button>
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>
                        {isShop ? 'Shop information' : 'Personal information'}
                    </Text>
                    <ProfileForm formData={formData} setFormData={setFormData} isShop={isShop} />
                </View>

                <Button onPress={handleSave} loading={saving} style={styles.saveBtn}>
                    Save all changes
                </Button>

                <Button
                    onPress={handleLogout}
                    variant="outline"
                    style={styles.logoutBtn}
                    icon={<LogOut size={18} color="#ef4444" />}
                    textStyle={{ color: '#ef4444' }}
                >
                    Sign out
                </Button>
            </ScrollView>
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    section: { marginBottom: 18 },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    saveBtn: {
        marginTop: 20,
        backgroundColor: '#10b981',
    },
    logoutBtn: {
        marginTop: 15,
        marginBottom: 30,
        borderColor: '#fee2e2',
        borderWidth: 1,
    },
    primaryOutline: {
        borderColor: '#10b981',
        marginBottom: 0,
    },
    quickActions: {
        gap: 12,
    },
    quickButtonPrimary: {
        backgroundColor: '#10b981',
    },
    quickButtonOutline: {
        borderColor: '#10b981',
    },
    browseButton: {
        borderColor: '#10b981',
        marginTop: 12,
    },
    statusBannerPending: {
        backgroundColor: '#fffbeb',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fef3c7',
    },
    statusBannerBlocked: {
        backgroundColor: '#fef2f2',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fee2e2',
        alignItems: 'center',
    },
    statusBannerClosed: {
        backgroundColor: '#f3f4f6',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    statusText: { color: '#b45309', fontWeight: '700', fontSize: 14 },
    statusSubText: { color: '#d97706', fontSize: 12, marginTop: 4 },
    statusActions: { marginTop: 14 },
    statusButton: { borderColor: '#f59e0b' },
    blockedTitle: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
    blockedSubText: { color: '#7f1d1d', fontSize: 12, marginTop: 6, textAlign: 'center' },
    closedTitle: { color: '#6b7280', fontWeight: 'bold', fontSize: 14 },
    closedSubText: { color: '#374151', fontSize: 12, marginTop: 6 },
})

export default ProfileScreen
