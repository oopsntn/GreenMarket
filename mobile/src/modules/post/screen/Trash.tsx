import React, { useEffect, useState } from 'react'
import MobileLayout from '../../../components/MobileLayout/MobileLayout'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Card from '../../../components/Card/Card'
import { RotateCcw, Trash2 } from 'lucide-react-native'

const Trash = () => {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(false)
    const [userId, setUserId] = useState(1)
    useEffect(() => {

    })
    return (
        <MobileLayout title="Thùng rác">
            {/* Nội dung của Trash sẽ được thêm vào đây */}
            {posts.map((post: any) => (
                <Card key={post.id} style={styles.trashCard}>
                    <Text style={styles.trashTitle}>{post.title}</Text>
                    <Text style={styles.dateText}>{post.date}</Text>

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionBtn}>
                            <RotateCcw size={16} color='#2e7d32' />
                            <Text style={styles.restoreText}>Khôi phục</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.actionBtn}>
                            <Trash2 size={16} color='#c62828' />
                            <Text style={styles.deleteText}>Xóa vĩnh viễn</Text>
                        </TouchableOpacity>
                    </View>
                </Card>
            ))}

        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    trashCard: {
        marginBottom: 12,
    },
    trashTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    dateText: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
        marginBottom: 12,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    restoreText: {
        color: '#2e7d32',
        fontSize: 13,
        fontWeight: '500',
    },
    deleteText: {
        color: '#c62828',
        fontSize: 13,
        fontWeight: '500'
    }
})
export default Trash
