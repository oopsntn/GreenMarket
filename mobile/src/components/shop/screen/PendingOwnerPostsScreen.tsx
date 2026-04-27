import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { CheckCircle, XCircle, FileText, ArrowRight } from 'lucide-react-native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import { ShopService, PendingOwnerPost } from '../service/shopService';
import CustomAlert from '../../../utils/AlertHelper';
import Button from '../../Reused/Button/Button';

const PendingOwnerPostsScreen = () => {
    const navigation = useNavigation<any>();
    const [posts, setPosts] = useState<PendingOwnerPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Action states
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState<PendingOwnerPost | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const fetchPendingPosts = async () => {
        try {
            const data = await ShopService.getPendingOwnerPosts();
            setPosts(data);
        } catch (error: any) {
            CustomAlert('Lỗi', error?.response?.data?.error || 'Không thể tải danh sách bài chờ duyệt');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchPendingPosts();
        }, [])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPendingPosts();
    };

    const confirmAction = (post: PendingOwnerPost, type: 'approve' | 'reject') => {
        setSelectedPost(post);
        setActionType(type);
        setReason('');
        setActionModalVisible(true);
    };

    const handleSubmitAction = async () => {
        if (!selectedPost) return;
        
        if (actionType === 'reject' && !reason.trim()) {
            CustomAlert('Lỗi', 'Vui lòng nhập lý do từ chối');
            return;
        }

        setProcessing(true);
        try {
            if (actionType === 'approve') {
                await ShopService.approveCollaboratorPost(selectedPost.postId);
                CustomAlert('Thành công', 'Đã duyệt bài thành công');
            } else {
                await ShopService.rejectCollaboratorPost(selectedPost.postId, reason.trim());
                CustomAlert('Thành công', 'Đã từ chối bài');
            }
            
            setActionModalVisible(false);
            fetchPendingPosts();
        } catch (error: any) {
            CustomAlert('Lỗi', error?.response?.data?.error || 'Không thể xử lý yêu cầu');
        } finally {
            setProcessing(false);
        }
    };

    const renderItem = ({ item }: { item: PendingOwnerPost }) => {
        const date = new Date(item.postCreatedAt).toLocaleDateString('vi-VN');
        
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <FileText size={20} color="#047857" />
                    </View>
                    <View style={styles.info}>
                        <Text style={styles.title} numberOfLines={2}>
                            {item.postTitle || `Bài đăng #${item.postId}`}
                        </Text>
                        <Text style={styles.meta}>Đăng bởi CTV: {item.authorName || item.authorMobile} • {date}</Text>
                    </View>
                </View>
                
                <View style={styles.cardActions}>
                    <TouchableOpacity 
                        style={[styles.btn, styles.btnReject]}
                        onPress={() => confirmAction(item, 'reject')}
                    >
                        <XCircle size={18} color="#EF4444" />
                        <Text style={styles.textReject}>Từ chối</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.btn, styles.btnApprove]}
                        onPress={() => confirmAction(item, 'approve')}
                    >
                        <CheckCircle size={18} color="#16A34A" />
                        <Text style={styles.textApprove}>Duyệt bài</Text>
                    </TouchableOpacity>

                    {item.postSlug ? (
                        <TouchableOpacity 
                            style={styles.viewBtn}
                            onPress={() => navigation.navigate('PendingOwnerPostReview', { post: item })}
                        >
                            <ArrowRight size={20} color="#64748B" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        );
    };

    return (
        <MobileLayout 
            title="Bài cần chủ vườn duyệt" 
            backButton={() => navigation.goBack()}
        >
            <View style={styles.container}>
                {loading ? (
                    <Text style={styles.loadingText}>Đang tải...</Text>
                ) : (
                    <FlatList
                        data={posts}
                        keyExtractor={(item) => item.postId.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContainer}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <CheckCircle size={40} color="#10B981" />
                                <Text style={styles.emptyText}>Tất cả bài viết đều đã được duyệt!</Text>
                            </View>
                        }
                    />
                )}

                {/* Approve/Reject Modal */}
                <Modal visible={actionModalVisible} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                {actionType === 'approve' ? 'Xác nhận duyệt bài' : 'Từ chối bài đăng'}
                            </Text>
                            
                            <Text style={styles.modalDesc}>
                                {actionType === 'approve' 
                                    ? `Bài đăng "${selectedPost?.postTitle}" sẽ được xuất bản công khai.` 
                                    : `Vui lòng cho quản lý biết lý do bạn từ chối bài đăng "${selectedPost?.postTitle}".`}
                            </Text>

                            {actionType === 'reject' && (
                                <TextInput
                                    style={styles.input}
                                    placeholder="Lý do từ chối..."
                                    value={reason}
                                    onChangeText={setReason}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            )}

                            <View style={styles.modalActions}>
                                <Button
                                    variant="outline"
                                    style={{ flex: 1, marginRight: 8 }}
                                    onPress={() => setActionModalVisible(false)}
                                    disabled={processing}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    style={{ 
                                        flex: 1, 
                                        backgroundColor: actionType === 'approve' ? '#16A34A' : '#EF4444',
                                        borderColor: actionType === 'approve' ? '#16A34A' : '#EF4444'
                                    }}
                                    loading={processing}
                                    disabled={processing || (actionType === 'reject' && !reason.trim())}
                                    onPress={handleSubmitAction}
                                >
                                    {actionType === 'approve' ? 'Duyệt bài' : 'Xác nhận'}
                                </Button>
                            </View>
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
    listContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 4,
    },
    meta: {
        fontSize: 12,
        color: '#64748B',
    },
    cardActions: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginRight: 8,
    },
    btnReject: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
    },
    btnApprove: {
        backgroundColor: '#DCFCE7',
        borderColor: '#BBF7D0',
    },
    viewBtn: {
        padding: 8,
        marginLeft: 'auto',
    },
    textReject: {
        color: '#EF4444',
        fontWeight: '600',
        marginLeft: 6,
        fontSize: 13,
    },
    textApprove: {
        color: '#16A34A',
        fontWeight: '600',
        marginLeft: 6,
        fontSize: 13,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#64748B',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#64748B',
        fontSize: 15,
        marginTop: 12,
        textAlign: 'center',
    },
    // Modal
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
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 12,
    },
    modalDesc: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 20,
        lineHeight: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        color: '#0F172A',
        marginBottom: 20,
        backgroundColor: '#F8FAFC',
        minHeight: 80,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});

export default PendingOwnerPostsScreen;
