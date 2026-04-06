import React, { useEffect, useState } from 'react'
import { Linking, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { postService } from '../service/postService'
import { AlertCircle, ExternalLink, Eye, Heart, Info, MapPin, Maximize2, MessageCircle, Phone, Share2, ShieldCheck, Store } from 'lucide-react-native'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import Button from '../../Reused/Button/Button'
import { MediaGallery } from '../components/MediaGallery'
import Card from '../../Reused/Card/Card'

interface Props {
  route: any,
  navigation: any
}

const PostDetailScreen = ({ route, navigation }: Props) => {
  const [post, setPost] = useState<any>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const { slug } = route.params

  useEffect(() => {
    loadData()
  }, [slug])

  const loadData = async () => {
    try {
      const res = await postService.getPostDetail(slug)
      setPost(res)
      console.log('getPostDetail res: ', res)
      const saved = await postService.checkIsSaved(res.postId)
      setIsSaved(saved.isSaved)
      console.log('checkIsSaved res: ', saved)
    } catch (e) {
      console.error("PostDetail loadData error: ", e);
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this plant: ${post.postTitle} on Bonsai App`,
        url: `https://yourdomain.com/post/${post.postSlug}`
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleSave = async () => {
    try {
      const res = await postService.toggleFavorite(post.postId);
      setIsSaved(res.isSaved);
    } catch (error) {
      console.error(error);
    }
  };

  const openMap = () => {
    const addr = post.shop?.shopLocation || post.postLocation;
    const label = post.postTitle;
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${addr}`,
      android: `geo:0,0?q=${addr}(${label})`
    });
    if (url) Linking.openURL(url);
  }

  if (loading) return <View style={styles.center}><Text>Đang tải...</Text></View>;

  const media = [
    ...(post.images || []).map((i: any) => ({ type: 'image', url: i.imageUrl })),
    ...(post.videos || []).map((v: any) => ({ type: 'video', url: v.videoUrl }))
  ];

  // Nút Share và Heart trên Header
  const renderRightActions = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <TouchableOpacity onPress={() => navigation.navigate('CreateReport', { postId: post?.postId, postTitle: post?.postTitle })}>
        <AlertCircle size={24} color="#ff4d4f" />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleShare}>
        <Share2 size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleToggleSave}>
        <Heart size={24} color={isSaved ? "#ff4d4f" : "#fff"} fill={isSaved ? "#ff4d4f" : "transparent"} />
      </TouchableOpacity>
    </View>
  );

  return (
    <MobileLayout
            title="Chi tiết bài đăng"
            headerStyle="default"
            backButton={() => navigation.goBack()}
            rightAction={renderRightActions()}
            bottom={
                <View style={styles.bottomActions}>
                    <Button
                        variant="outline"
                        style={{ flex: 1, borderColor: '#1890ff' }}
                        textStyle={{ color: '#1890ff' }}
                        icon={<MessageCircle size={20} color="#1890ff" />}
                        onPress={() => Linking.openURL(`https://zalo.me/${post.shop?.shopPhone}`)}
                    >
                        Zalo
                    </Button>
                    <Button
                        variant="primary"
                        style={{ flex: 2 }}
                        icon={<Phone size={20} color="#fff" />}
                        onPress={() => {
                            postService.recordContactClick(post.postId);
                            Linking.openURL(`tel:${post.shop?.shopPhone || post.postContactPhone}`);
                        }}
                    >
                        Gọi ngay
                    </Button>
                </View>
            }
        >
            {/* 1. Media Gallery */}
            <MediaGallery media={media} />

            <View style={styles.container}>
                {/* 2. Thông tin chính */}
                <View style={styles.mainInfo}>
                    <Text style={styles.postTitle}>{post.postTitle}</Text>
                    
                    <View style={styles.badgeRow}>
                        <View style={styles.verifyBadge}>
                            <ShieldCheck size={14} color="#52c41a" />
                            <Text style={styles.verifyText}>Nhà vườn uy tín</Text>
                        </View>
                        <View style={styles.metaBadge}>
                            <Eye size={14} color="#8c8c8c" />
                            <Text style={styles.metaText}>{post.postViewCount || 0} lượt xem</Text>
                        </View>
                    </View>

                    <Text style={styles.priceText}>
                        {new Intl.NumberFormat('vi-VN').format(post.postPrice)}
                        <Text style={styles.priceUnit}> đ / cây</Text>
                    </Text>
                </View>

                {/* 3. Card Mô tả nội dung */}
                <Card style={styles.sectionCard} shadow padding="medium">
                    <View style={styles.sectionHeader}>
                        <Info
                         size={18} color="#52c41a" />
                        <Text style={styles.sectionTitle}>Mô tả</Text>
                    </View>
                    <Text style={styles.descriptionText}>{post.postContent}</Text>
                </Card>

                {/* 4. Card Thông số kỹ thuật */}
                {post.attributes && (
                    <Card style={styles.sectionCard} shadow padding="medium">
                        <View style={styles.sectionHeader}>
                            <Maximize2 size={18} color="#52c41a" />
                            <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>
                        </View>
                        <View style={styles.attrGrid}>
                            {post.attributes.map((attr: any, index: number) => (
                                <View key={index} style={styles.attrItem}>
                                    <Text style={styles.attrLabel}>{attr.name}</Text>
                                    <Text style={styles.attrValue}>{attr.value}</Text>
                                </View>
                            ))}
                        </View>
                    </Card>
                )}

                {/* 5. Thông tin Shop/Nhà vườn */}
                <Card 
                    style={styles.shopCard} 
                    padding="medium"
                    onClick={() => navigation.navigate('ShopDetail', { id: post.postShopId })}
                >
                    <View style={styles.shopContent}>
                        <View style={styles.shopAvatar}>
                            <Store size={24} color="#52c41a" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.shopName}>{post.shop?.shopName}</Text>
                            <Text style={styles.shopSub}>Xem trang nhà vườn để biết thêm</Text>
                        </View>
                        <ExternalLink size={18} color="#bfbfbf" />
                    </View>
                </Card>

                {/* 6. Bản đồ & Vị trí */}
                <Card style={styles.sectionCard} padding="medium">
                    <View style={styles.sectionHeader}>
                        <MapPin size={18} color="#52c41a" />
                        <Text style={styles.sectionTitle}>Vị trí</Text>
                    </View>
                    <Text style={styles.locationText}>{post.shop?.shopLocation || post.postLocation}</Text>
                    <Button 
                        variant="outline" 
                        size="small" 
                        style={{ marginTop: 12, borderColor: '#d9d9d9' }}
                        textStyle={{ color: '#595959' }}
                        onPress={openMap}
                    >
                        Mở bằng Google Maps
                    </Button>
                </Card>

                {/* Padding cuối cùng để không bị lấp bởi bottom actions */}
                <View style={{ height: 40 }} />
            </View>
        </MobileLayout>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  mainInfo: {
    marginBottom: 20,
  },
  postTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#262626',
    lineHeight: 28,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  verifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6ffed',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#b7eb8f',
  },
  verifyText: { color: '#52c41a', fontSize: 12, marginLeft: 4, fontWeight: '600' },
  metaBadge: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: '#8c8c8c', fontSize: 12, marginLeft: 4 },
  priceText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#52c41a',
    marginTop: 15,
  },
  priceUnit: { fontSize: 14, color: '#8c8c8c', fontWeight: 'normal' },

  sectionCard: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#262626',
  },
  descriptionText: {
    fontSize: 14,
    color: '#595959',
    lineHeight: 22,
  },
  attrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  attrItem: {
    width: '47%',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  attrLabel: { fontSize: 11, color: '#8c8c8c', marginBottom: 2 },
  attrValue: { fontSize: 13, color: '#262626', fontWeight: '600' },

  shopCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  shopContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f6ffed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopName: { fontSize: 16, fontWeight: '700', color: '#262626' },
  shopSub: { fontSize: 12, color: '#8c8c8c' },

  locationText: { fontSize: 14, color: '#595959' },

  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  }
})

export default PostDetailScreen
