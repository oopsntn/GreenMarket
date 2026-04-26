import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, Modal, TextInput } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Mail, Search, ArrowLeft, Trash2, X, AlertCircle } from 'lucide-react-native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import { ShopService, ShopCollaborator } from '../service/shopService';
import CustomAlert from '../../../utils/AlertHelper';
import Button from '../../Reused/Button/Button';
import { resolveImageUrl } from '../../../utils/resolveImageUrl';

const ShopCollaboratorsScreen = () => {
    const navigation = useNavigation<any>();
    const [collaborators, setCollaborators] = useState<ShopCollaborator[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Modal states
    const [inviteModalVisible, setInviteModalVisible] = useState(false);
    const [inviteInput, setInviteInput] = useState('');
    const [inviting, setInviting] = useState(false);

    const fetchCollaborators = async () => {
        try {
            const data = await ShopService.getCollaborators();
            setCollaborators(data);
        } catch (error: any) {
            CustomAlert('Lỗi', error?.response?.data?.error || 'Không thể tải danh sách CTV');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchCollaborators();
        }, [])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        fetchCollaborators();
    };

    const handleInvite = async () => {
        if (!inviteInput.trim()) {
            CustomAlert('Lỗi', 'Vui lòng nhập SĐT hoặc Email');
            return;
        }

        setInviting(true);
        try {
            await ShopService.inviteCollaborator(inviteInput.trim());
            CustomAlert('Thành công', 'Đã gửi lời mời thành công');
            setInviteModalVisible(false);
            setInviteInput('');
            fetchCollaborators();
        } catch (error: any) {
            CustomAlert('Lỗi', error?.response?.data?.error || 'Không thể gửi lời mời');
        } finally {
            setInviting(false);
        }
    };

    const handleRemove = async (userId: number, isPending: boolean) => {
        try {
            await ShopService.removeCollaborator(userId);
            CustomAlert('Thành công', isPending ? 'Đã thu hồi lời mời' : 'Đã xóa cộng tác viên');
            fetchCollaborators();
        } catch (error: any) {
            CustomAlert('Lỗi', error?.response?.data?.error || 'Không thể thực hiện tao tác');
        }
    };

    const confirmRemove = (userId: number, isPending: boolean) => {
        CustomAlert(
            'Xác nhận',
            isPending ? 'Bạn có chắc chắn muốn thu hồi lời mời này?' : 'Bạn có chắc chắn muốn xóa cộng tác viên này?',
            [
                { text: 'Hủy', style: 'cancel' },
                { 
                    text: 'Đồng ý', 
                    style: 'destructive', 
                    onPress: () => handleRemove(userId, isPending) 
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: ShopCollaborator }) => {
        const isPending = item.relationshipStatus === 'pending';
        return (
            <View style={styles.card}>
                <Image 
                    source={{ uri: resolveImageUrl(item.avatarUrl) }} 
                    style={styles.avatar} 
                />
                <View style={styles.info}>
                    <Text style={styles.name}>{item.displayName || 'Người dùng'}</Text>
                    <Text style={styles.phone}>{item.mobile}</Text>
                    {isPending ? (
                        <View style={[styles.badge, styles.badgePending]}>
                            <Text style={styles.badgeTextPending}>Đang chờ xác nhận</Text>
                        </View>
                    ) : (
                        <View style={[styles.badge, styles.badgeActive]}>
                            <Text style={styles.badgeTextActive}>Đang hoạt động</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity 
                    style={styles.deleteBtn}
                    onPress={() => confirmRemove(item.userId, isPending)}
                >
                    <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <MobileLayout 
            title="Quản lý Cộng tác viên" 
            backButton={() => navigation.goBack()}
            rightAction={
                <TouchableOpacity onPress={() => navigation.navigate('CollaboratorPublicList')}>
                    <Search size={22} color="#111827" />
                </TouchableOpacity>
            }
        >
            <View style={styles.container}>
                <View style={styles.headerAlert}>
                    <AlertCircle size={20} color="#047857" />
                    <Text style={styles.alertText}>
                        CTV cần được quản trị viên hệ thống cấp quyền trước khi có thể được mời.
                    </Text>
                </View>

                {loading ? (
                    <Text style={styles.loadingText}>Đang tải...</Text>
                ) : (
                    <FlatList
                        data={collaborators}
                        keyExtractor={(item) => item.userId.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContainer}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Cửa hàng chưa có cộng tác viên nào.</Text>
                            </View>
                        }
                    />
                )}
                
                <View style={styles.footer}>
                    <Button 
                        fullWidth 
                        onPress={() => setInviteModalVisible(true)}
                    >
                        Mời người mới bằng SĐT/Email
                    </Button>
                </View>

                {/* Invite Modal */}
                <Modal visible={inviteModalVisible} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Mời Cộng tác viên</Text>
                                <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                                    <X size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.modalDesc}>
                                Nhập số điện thoại hoặc email của người bạn muốn mời làm Cộng tác viên.
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập SĐT hoặc Email"
                                value={inviteInput}
                                onChangeText={setInviteInput}
                                autoCapitalize="none"
                            />
                            <Button
                                fullWidth
                                loading={inviting}
                                disabled={inviting || !inviteInput.trim()}
                                onPress={handleInvite}
                                style={{ marginTop: 16 }}
                            >
                                Gửi lời mời
                            </Button>
                        </View>
                    </View>
                </Modal>
            </View>
        </MobileLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerAlert: {
        flexDirection: 'row',
        backgroundColor: '#ECFDF5',
        padding: 12,
        margin: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#10B981',
        alignItems: 'center',
    },
    alertText: {
        marginLeft: 8,
        color: '#047857',
        fontSize: 13,
        flex: 1,
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    card: {
        backgroundColor: 'white',
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E2E8F0',
    },
    info: {
        flex: 1,
        marginLeft: 12,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    phone: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 6,
    },
    badgePending: {
        backgroundColor: '#FEF3C7',
    },
    badgeTextPending: {
        color: '#D97706',
        fontSize: 11,
        fontWeight: '600',
    },
    badgeActive: {
        backgroundColor: '#DCFCE7',
    },
    badgeTextActive: {
        color: '#16A34A',
        fontSize: 11,
        fontWeight: '600',
    },
    deleteBtn: {
        padding: 8,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#64748B',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#64748B',
        fontSize: 14,
    },
    footer: {
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        width: '100%',
        borderRadius: 16,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    modalDesc: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 16,
        lineHeight: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#0F172A',
    },
});

export default ShopCollaboratorsScreen;
