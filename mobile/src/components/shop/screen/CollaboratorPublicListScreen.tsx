import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Search, MapPin, Briefcase } from 'lucide-react-native';
import MobileLayout from '../../Reused/MobileLayout/MobileLayout';
import { CollaboratorService } from '../../../collaborator/services/collaboratorService';
import CustomAlert from '../../../utils/AlertHelper';
import { resolveImageUrl } from '../../../utils/resolveImageUrl';

const CollaboratorPublicListScreen = () => {
    const navigation = useNavigation<any>();
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchPublicCollaborators = async (pageNum = 1) => {
        try {
            if (pageNum === 1) setLoading(true);
            const response = await CollaboratorService.getPublicCollaborators({ page: pageNum, limit: 15 });
            
            if (pageNum === 1) {
                setCollaborators(response.data || []);
            } else {
                setCollaborators(prev => [...prev, ...(response.data || [])]);
            }
            
            setHasMore(pageNum < (response.meta?.totalPages || 1));
            setPage(pageNum);
        } catch (error: any) {
            CustomAlert('Lỗi', 'Không thể tải danh sách cộng tác viên');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchPublicCollaborators(1);
        }, [])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPublicCollaborators(1);
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            fetchPublicCollaborators(page + 1);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const isOnline = item.availabilityStatus === 'available';
        
        return (
            <TouchableOpacity 
                style={styles.card}
                onPress={() => navigation.navigate('PublicCollaboratorDetail', { id: item.userId })}
            >
                <View style={styles.cardContent}>
                    <View style={styles.avatarContainer}>
                        <Image 
                            source={{ uri: resolveImageUrl(item.avatarUrl) }} 
                            style={styles.avatar} 
                        />
                        <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#F59E0B' }]} />
                    </View>
                    
                    <View style={styles.info}>
                        <Text style={styles.name}>{item.displayName || 'CTV chưa có tên'}</Text>
                        
                        {item.bio ? (
                            <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
                        ) : null}
                        
                        <View style={styles.metaRow}>
                            {item.location && (
                                <View style={styles.metaBadge}>
                                    <MapPin size={12} color="#64748B" />
                                    <Text style={styles.metaText}>{item.location}</Text>
                                </View>
                            )}
                            
                            {item.relationshipStatus === 'active' && (
                                <View style={[styles.metaBadge, styles.activeBadge]}>
                                    <Briefcase size={12} color="#16A34A" />
                                    <Text style={[styles.metaText, { color: '#16A34A' }]}>Đang cộng tác</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <MobileLayout 
            title="Thị trường Cộng tác viên" 
            backButton={() => navigation.goBack()}
        >
            <View style={styles.container}>
                <View style={styles.headerArea}>
                    <Text style={styles.headerTitle}>Tìm Người Quản Lý Gian Hàng</Text>
                    <Text style={styles.headerDesc}>
                        Thuê Cộng tác viên từ xa để giúp bạn đăng tin, chăm sóc khách hàng và phát triển gian hàng trên GreenMarket.
                    </Text>
                </View>

                {loading && page === 1 ? (
                    <Text style={styles.loadingText}>Đang tải danh sách...</Text>
                ) : (
                    <FlatList
                        data={collaborators}
                        keyExtractor={(item) => item.userId.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContainer}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                        }
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Search size={40} color="#94A3B8" />
                                <Text style={styles.emptyText}>Chưa có Cộng tác viên nào công khai hồ sơ.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </MobileLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerArea: {
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 6,
    },
    headerDesc: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },
    listContainer: {
        padding: 16,
        paddingBottom: 30,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardContent: {
        flexDirection: 'row',
        padding: 16,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E2E8F0',
    },
    statusDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: 'white',
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    bio: {
        fontSize: 13,
        color: '#475569',
        marginBottom: 8,
        lineHeight: 18,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    activeBadge: {
        backgroundColor: '#DCFCE7',
    },
    metaText: {
        fontSize: 11,
        color: '#64748B',
        marginLeft: 4,
        fontWeight: '500',
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 30,
        color: '#64748B',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#64748B',
        fontSize: 14,
        marginTop: 12,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default CollaboratorPublicListScreen;
