import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import Card from '../../Reused/Card/Card'
import { Edit, PackageOpen, Trash2 } from 'lucide-react-native';

interface PostItemProps {
    item: any;
    onEdit: (item: any) => void;
    onDelete: (id: number) => void;
    styles: any;
    renderStatus?: (status: string) => React.ReactNode;
}
const PostItem = ({ item, onEdit, onDelete, styles, renderStatus }: PostItemProps) => (
    <Card style={styles.postCard}>
        <View style={styles.postContent}>
            <View style={styles.imgPlaceholder}>
                <PackageOpen color="#999" size={24} />
            </View>

            <View style={styles.info}>
                <Text style={styles.postTitle} numberOfLines={1}>{item.postTitle}</Text>
                <Text style={styles.postPrice}>
                    {new Intl.NumberFormat('en-US').format(item.postPrice)} VND
                </Text>
                {renderStatus && renderStatus(item.postStatus)}
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

export default PostItem
