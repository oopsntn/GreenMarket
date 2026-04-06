import React, { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import PostItem from '../components/PostItem'
import { postService } from '../service/postService'
import { useNavigation } from '@react-navigation/native'

const SavedPostsScreen = () => {
    const navigation = useNavigation<any>()
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchSaved = async () => {
        try {
            setLoading(true)
            const res = await postService.getFavoritePosts()
            setPosts(Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []))
        } catch (e) {
            console.error('Error fetching saved:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchSaved()
        })
        return unsubscribe
    }, [navigation])

    return (
        <MobileLayout title="Saved Posts" backButton={() => navigation.goBack()}>
            {loading ? (
                <ActivityIndicator style={{ marginTop: 50 }} color="#10b981" />
            ) : (
                <FlatList 
                    data={posts}
                    contentContainerStyle={{ padding: 16 }}
                    renderItem={({ item }) => (
                        <PostItem
                            item={item.post || item}
                            onEdit={() => {}}
                            onDelete={() => {}}
                            styles={styles}
                        />
                    )}
                    keyExtractor={(item, index) => `${item.postId || index}`}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>You haven't saved any posts yet.</Text>
                        </View>
                    }
                />
            )}
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    postCard: { marginBottom: 16, padding: 12 },
    postContent: { flexDirection: 'row', alignItems: 'center' },
    imgPlaceholder: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    postImage: { width: '100%', height: '100%', borderRadius: 10 },
    info: { flex: 1, marginLeft: 12 },
    postTitle: { fontWeight: '700', fontSize: 16, marginBottom: 4 },
    postPrice: { color: '#10b981', fontWeight: '800', fontSize: 14, marginBottom: 6 },
    actions: { display: 'none' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginVertical: 20, color: '#999' }
})

export default SavedPostsScreen
