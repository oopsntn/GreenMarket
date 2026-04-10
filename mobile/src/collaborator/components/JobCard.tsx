import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Calendar, Clock, ChevronRight } from 'lucide-react-native';
import { Job } from '../services/collaboratorService';

interface JobCardProps {
    job: Job;
    onPress: () => void;
}

const JobCard = ({ job, onPress }: JobCardProps) => {
    const formattedPrice = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(job.price));

    const deadline = new Date(job.deadline).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.header}>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{job.category || 'General'}</Text>
                </View>
                <Text style={styles.priceText}>{formattedPrice}</Text>
            </View>

            <Text style={styles.title} numberOfLines={2}>{job.title}</Text>

            <View style={styles.footer}>
                <View style={styles.infoRow}>
                    <MapPin size={14} color="#64748B" />
                    <Text style={styles.infoText} numberOfLines={1}>{job.location || 'Remote'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Calendar size={14} color="#64748B" />
                    <Text style={styles.infoText}>{deadline}</Text>
                </View>
            </View>

            <View style={styles.customerRow}>
                <View style={styles.customerInfo}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{job.customer.displayName?.charAt(0) || 'C'}</Text>
                    </View>
                    <Text style={styles.customerName}>{job.customer.displayName || 'Customer'}</Text>
                </View>
                <ChevronRight size={18} color="#94A3B8" />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryBadge: {
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#16A34A',
        textTransform: 'uppercase',
    },
    priceText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#16A34A',
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 12,
        lineHeight: 22,
    },
    footer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 12,
        color: '#64748B',
    },
    customerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    customerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
});

export default JobCard;
