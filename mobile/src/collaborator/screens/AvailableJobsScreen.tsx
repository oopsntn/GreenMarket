import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
} from 'react-native';
import { Search, Filter, SlidersHorizontal } from 'lucide-react-native';
import { CollaboratorService, Job } from '../services/collaboratorService';
import JobCard from '../components/JobCard';
import { useNavigation } from '@react-navigation/native';

const AvailableJobsScreen = () => {
    const navigation = useNavigation<any>();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [meta, setMeta] = useState({ page: 1, totalPages: 1 });

    const fetchJobs = async (page = 1, isRefresh = false) => {
        try {
            const res = await CollaboratorService.getAvailableJobs({ 
                keyword: search, 
                page, 
                limit: 10 
            });
            if (isRefresh) {
                setJobs(res.data);
            } else {
                setJobs(prev => [...prev, ...res.data]);
            }
            setMeta(res.meta);
        } catch (error) {
            console.error('Error fetching available jobs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchJobs(1, true);
    }, [search]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchJobs(1, true);
    };

    const loadMore = () => {
        if (meta.page < meta.totalPages) {
            fetchJobs(meta.page + 1);
        }
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No jobs available at the moment.</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                <Text style={styles.refreshBtnText}>Tap to refresh</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Find Work</Text>
                <View style={styles.searchBar}>
                    <Search color="#94A3B8" size={20} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by title or description..."
                        value={search}
                        onChangeText={setSearch}
                        placeholderTextColor="#94A3B8"
                    />
                    <TouchableOpacity style={styles.filterBtn}>
                        <SlidersHorizontal color="#16A34A" size={20} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading && jobs.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#16A34A" />
                </View>
            ) : (
                <FlatList
                    data={jobs}
                    renderItem={({ item }) => (
                        <JobCard 
                            job={item} 
                            onPress={() => navigation.navigate('JobDetail', { jobId: item.jobId })} 
                        />
                    )}
                    keyExtractor={(item) => item.jobId.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={renderEmpty}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: 'white',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 16,
        borderRadius: 16,
        height: 52,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '500',
    },
    filterBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 24,
        paddingTop: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    refreshBtn: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#DCFCE7',
        borderRadius: 12,
    },
    refreshBtnText: {
        color: '#16A34A',
        fontWeight: '700',
    }
});

export default AvailableJobsScreen;
