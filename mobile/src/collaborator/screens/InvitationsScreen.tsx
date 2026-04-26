import React, { useCallback, useState } from 'react'
import { FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import { Building2, Check, MailOpen, X } from 'lucide-react-native'
import MobileLayout from '../../components/Reused/MobileLayout/MobileLayout'
import { CollaboratorService } from '../services/collaboratorService'
import CustomAlert from '../../utils/AlertHelper'
import { resolveImageUrl } from '../../utils/resolveImageUrl'

const InvitationsScreen = () => {
    const navigation = useNavigation<any>()
    const route = useRoute<any>()
    const [invitations, setInvitations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [actioningId, setActioningId] = useState<number | null>(null)
    const showBackButton = route.name !== 'InvitationsTab'

    const fetchInvitations = async () => {
        try {
            const data = await CollaboratorService.getMyInvitations()
            setInvitations(data)
        } catch (error: any) {
            CustomAlert('Lỗi', 'Không thể tải danh sách lời mời')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchInvitations()
        }, []),
    )

    const handleRefresh = () => {
        setRefreshing(true)
        fetchInvitations()
    }

    const handleAction = async (id: number, action: 'accept' | 'reject') => {
        setActioningId(id)
        try {
            await CollaboratorService.respondToInvitation(id, action)
            CustomAlert(
                'Thành công',
                action === 'accept'
                    ? 'Bạn đã chấp nhận lời mời và có thể thao tác với shop này.'
                    : 'Đã từ chối lời mời',
            )
            fetchInvitations()
        } catch (error: any) {
            CustomAlert('Lỗi', error?.response?.data?.error || 'Không thể phản hồi lời mời')
        } finally {
            setActioningId(null)
        }
    }

    const confirmReject = (id: number) => {
        CustomAlert('Từ chối lời mời', 'Bạn có chắc chắn muốn bỏ qua lời mời này không?', [
            { text: 'Suy nghĩ lại', style: 'cancel' },
            {
                text: 'Từ chối',
                style: 'destructive',
                onPress: () => handleAction(id, 'reject'),
            },
        ])
    }

    const renderItem = ({ item }: { item: any }) => {
        const isActioning = actioningId === item.invitationId

        return (
            <View style={styles.card}>
                <View style={styles.cardInfo}>
                    <View style={styles.imgContainer}>
                        {item.shopLogoUrl ? (
                            <Image source={{ uri: resolveImageUrl(item.shopLogoUrl) }} style={styles.shopLogo} />
                        ) : (
                            <View style={styles.fallbackLogo}>
                                <Building2 size={24} color="#64748B" />
                            </View>
                        )}
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={styles.shopName} numberOfLines={1}>
                            {item.shopName || `Shop #${item.shopId}`}
                        </Text>
                        <Text style={styles.ownerName}>Chủ vườn: {item.shopOwnerName || 'Unknown'}</Text>
                        <Text style={styles.dateText}>
                            Ngày mời: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={[styles.btn, styles.rejectBtn, isActioning && styles.btnDisabled]}
                        onPress={() => confirmReject(item.invitationId)}
                        disabled={isActioning}
                    >
                        <X size={20} color="#EF4444" />
                        <Text style={styles.rejectText}>Từ chối</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btn, styles.acceptBtn, isActioning && styles.btnDisabled]}
                        onPress={() => handleAction(item.invitationId, 'accept')}
                        disabled={isActioning}
                    >
                        <Check size={20} color="white" />
                        <Text style={styles.acceptText}>Chấp nhận</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <MobileLayout
            title="Lời mời hợp tác"
            backButton={showBackButton ? () => navigation.goBack() : undefined}
        >
            <View style={styles.container}>
                {loading ? (
                    <Text style={styles.loadingText}>Đang tải...</Text>
                ) : (
                    <FlatList
                        data={invitations}
                        keyExtractor={(item) => item.invitationId.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContainer}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <MailOpen size={50} color="#CBD5E1" />
                                <Text style={styles.emptyText}>Hiện chưa có lời mời hợp tác nào gửi đến bạn.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    listContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardInfo: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    imgContainer: {
        marginRight: 16,
    },
    shopLogo: {
        width: 60,
        height: 60,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    fallbackLogo: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    shopName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 4,
    },
    ownerName: {
        fontSize: 13,
        color: '#475569',
        marginBottom: 2,
    },
    dateText: {
        fontSize: 12,
        color: '#94A3B8',
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 16,
        gap: 12,
    },
    btn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
    },
    btnDisabled: {
        opacity: 0.5,
    },
    rejectBtn: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    rejectText: {
        color: '#EF4444',
        fontWeight: '600',
        marginLeft: 6,
    },
    acceptBtn: {
        backgroundColor: '#10B981',
    },
    acceptText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 6,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#64748B',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: '#64748B',
        fontSize: 15,
        marginTop: 16,
        textAlign: 'center',
        lineHeight: 22,
    },
})

export default InvitationsScreen
