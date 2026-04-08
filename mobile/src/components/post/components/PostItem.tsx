import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Card from '../../Reused/Card/Card'
import { Edit, PackageOpen, Rocket, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import CustomAlert from '../../../utils/AlertHelper';

interface PostItemProps {
    item: any;
    onEdit: (item: any) => void;
    onDelete: (id: number) => void;
    styles: any;
    renderStatus?: (status: string) => React.ReactNode;
}
const PostItem = ({ item, onEdit, onDelete, styles, renderStatus }: PostItemProps) => {
    const navigation = useNavigation<any>()

    const handlePress = () => {
        if (item.postStatus === 'pending') {
            CustomAlert('Post Pending', 'This post is currently under review by our moderators. Please check back later.')
            return
        }

        if (item.postStatus === 'rejected') {
            onEdit(item) // Open edit modal directly as requested
            return
        }

        if (item.postStatus === 'approved') {
            navigation.navigate('PostDetail', { slug: item.postSlug })
        }
    }

    const isApproved = item.postStatus === 'approved'

    return (
        <Card onClick={handlePress} style={styles.postCard}>
            <View style={styles.postContent}>
                <View style={styles.imgPlaceholder}>
                    {item.images && item.images.length > 0 ? (
                        <Image
                            source={{ uri: item.images[0].imageUrl }}
                            style={{ width: '100%', height: '100%' }}
                        />
                    ) : (
                        <PackageOpen color="#9ca3af" size={32} />
                    )}
                </View>

                <View style={styles.info}>
                    <Text style={styles.postTitle} numberOfLines={1}>{item.postTitle}</Text>
                    <Text style={styles.postPrice}>
                        {new Intl.NumberFormat('en-US').format(item.postPrice)} VND
                    </Text>
                    {renderStatus && renderStatus(item.postStatus)}
                    {item.postStatus === 'rejected' && item.postRejectedReason && (
                        <View style={localStyles.rejectReason}>
                            <Text style={localStyles.rejectText}>Reason: {item.postRejectedReason}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, !isApproved && { opacity: 0.3 }]} 
                        onPress={() => isApproved && navigation.navigate('PromotePost', { post: item })}
                        disabled={!isApproved}
                    >
                        <Rocket size={18} color={isApproved ? "#8b5cf6" : "#9ca3af"} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(item)}>
                        <Edit size={18} color="#f59e0b" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(item.postId)}>
                        <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </Card>
    )
}

const localStyles = StyleSheet.create({
    rejectReason: { 
        marginTop: 6, 
        padding: 6, 
        backgroundColor: '#fef2f2', 
        borderRadius: 6, 
        borderWidth: 1, 
        borderColor: '#fee2e2' 
    },
    rejectText: { 
        fontSize: 10, 
        color: '#b91c1c', 
        fontWeight: '600' 
    }
})

export default PostItem

