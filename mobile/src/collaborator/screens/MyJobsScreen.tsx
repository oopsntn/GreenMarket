import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
} from 'react-native';
import { CollaboratorService, Job } from '../services/collaboratorService';
import JobCard from '../components/JobCard';
import { useNavigation } from '@react-navigation/native';

const MyJobsScreen = () => {
    const navigation = useNavigation<any>();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState<'accepted' | 'completed' | 'cancelled'>('accepted');
    const [error, setError] = useState<string | null>(null);

    const fetchMyJobs = async (isRefresh = false) => {
        try {
            setError(null);
            const res = await CollaboratorService.getMyJobs({ status });
            setJobs(res.data);
        } catch (error: any) {
            console.error('Error fetching my jobs:', error);
            setError(error?.response?.data?.error || 'Unable to load your jobs.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMyJobs();
    }, [status]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchMyJobs(true);
    };

    const StatusTab = ({ label, value }: { label: string; value: typeof status }) => (
        <TouchableOpacity 
            style={[styles.tab, status === value && styles.activeTab]}
            onPress={() => {
                setLoading(true);
                setStatus(value);
            }}
        >
            <Text style={[styles.tabText, status === value && styles.activeTabText]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{error || 'No jobs found in this section.'}</Text>
            {error ? (
                <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Việc của tôi</Text>
                <View style={styles.tabBar}>
                    <StatusTab label="Đang làm" value="accepted" />
                    <StatusTab label="Đã xong" value="completed" />
                    <StatusTab label="Lịch sử" value="cancelled" />
                </View>
            </View>

            {error && jobs.length > 0 ? (
                <View style={styles.inlineError}>
                    <Text style={styles.inlineErrorText}>{error}</Text>
                </View>
            ) : null}

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#16A34A" />
                </View>
            ) : (
                <FlatList
                    data={jobs}
                    renderItem={({ item }) => (
                        <View>
                            <JobCard 
                                job={item} 
                                onPress={() => navigation.navigate('JobDetail', { jobId: item.jobId })} 
                            />
                            {status === 'accepted' && (
                                <TouchableOpacity 
                                    style={styles.submitBtn}
                                    onPress={() => navigation.navigate('SubmitWork', { jobId: item.jobId, title: item.title })}
                                >
                                    <Text style={styles.submitBtnText}>Nộp kết quả</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                    keyExtractor={(item) => item.jobId.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
    tabBar: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: '#F1F5F9',
        padding: 4,
        borderRadius: 14,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    activeTabText: {
        color: '#16A34A',
        fontWeight: '700',
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
    retryBtn: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#111827',
        borderRadius: 12,
    },
    retryBtnText: {
        color: 'white',
        fontWeight: '700',
    },
    submitBtn: {
        backgroundColor: '#16A34A',
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: -8,
        marginBottom: 24,
        alignItems: 'center',
    },
    submitBtnText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    inlineError: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginHorizontal: 24,
        marginTop: 16,
    },
    inlineErrorText: {
        color: '#B91C1C',
        fontSize: 13,
        fontWeight: '600',
    },
});

export default MyJobsScreen;
