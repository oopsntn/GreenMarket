import React, { useEffect, useState } from 'react'
import MobileLayout from '../../../components/MobileLayout/MobileLayout'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { postService } from '../service/post'
import PostItem from '../components/PostItem'

const TABS = ["Đang hiển thị", "Chờ duyệt", "Bị từ chối", "Thùng rác"]
const MyPost = () => {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(false)
    const [userId, setUserId] = useState(1)
    const [activeTab, setActiveTab] = useState("Đang hiển thị")
    useEffect(() => {
        const fetchMyPosts = async () => {
            setLoading(true)
            try {
                const data = await postService.myPost(userId)
                setPosts(data)
            } catch (error) {
                console.error("Lỗi khi lấy tin của tôi: ", error)
            } finally {
                setLoading(false)
            }
        }
    })
    return (
        <MobileLayout title="Tin của tôi">
            {/* Nội dung của MyPost sẽ được thêm vào đây */}
            <View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tabRow}
                    contentContainerStyle={styles.tabRowContent}
                >
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[styles.tabItem, activeTab === tab && styles.tabActive]}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* List myPosts */}
            {posts.map((post: any) => (
                <PostItem key={post.id} post={post} />
            ))}
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    tabRow: {
        marginBottom: 16,
    },
    tabRowContent: {
        gap: 8,
        paddingRight: 16,
    },
    tabItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f3f4',
    },
    tabActive: {
        backgroundColor: '#2e7d32',
    },
    tabText: {
        fontSize: 12,
        color: '#666',
    },
    tabTextActive: {
        color: '#fff',
        fontWeight: '600',
    }
})

export default MyPost
