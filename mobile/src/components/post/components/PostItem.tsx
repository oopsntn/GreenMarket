import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import Card from '../../Reused/Card/Card'
import { Edit, PackageOpen, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

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
        navigation.navigate('PostDetail', { slug: item.postSlug })
    }
    return (
        <Card onClick={handlePress} style={styles.postCard}>
            <View style={styles.postContent}>
                <View style={styles.imgPlaceholder}>
                    {item.images && item.images.length > 0 ? (
                        <Image
                            source={{ uri: item.images[0].imageUrl }}
                            style={styles.postImage}
                        />
                    ) : (
                        <PackageOpen color="#999" size={24} />
                    )}

                </View>

                <View style={styles.info}>
                    <Text style={styles.postTitle} numberOfLines={1}>{item.postTitle}</Text>
                    <Text style={styles.postPrice}>
                        {new Intl.NumberFormat('en-US').format(item.postPrice)} VND
                    </Text>
                    {renderStatus && renderStatus(item.postStatus)}
                    {item.postStatus === 'rejected' && item.postRejectedReason && (
                        <View style={{ marginTop: 8, padding: 8, backgroundColor: '#fff1f2', borderRadius: 8, borderColor: '#ffe4e6', borderWidth: 1 }}>
                            <Text style={{ fontSize: 12, color: '#e11d48', fontWeight: 'bold' }}>Reject reason: {item.postRejectedReason}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.actions}>
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

export default PostItem
