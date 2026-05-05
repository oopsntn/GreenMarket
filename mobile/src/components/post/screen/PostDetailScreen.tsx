import React, { useEffect, useMemo, useState } from 'react'
import { Linking, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { postService } from '../service/postService'
import { AlertCircle, Bookmark, ExternalLink, Eye, MapPin, Maximize2, MessageCircle, Phone, Share2, ShieldCheck, Store } from 'lucide-react-native'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import Button from '../../Reused/Button/Button'
import { MediaGallery } from '../components/MediaGallery'
import Card from '../../Reused/Card/Card'
import { resolveImageUrl } from '../../../utils/resolveImageUrl'
import { WEB_BASE_URL } from '../../../config/api'
import { useAuth } from '../../../context/AuthContext'

interface Props {
  route: any,
  navigation: any
}

const PostDetailScreen = ({ route, navigation }: Props) => {
  const [post, setPost] = useState<any>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const { slug } = route.params
  const { user, shop } = useAuth()
  const isOwner = post?.postAuthorId === user?.id || (!!post?.postShopId && post?.postShopId === shop?.shopId)

  useEffect(() => {
    loadData()
  }, [slug])

  const loadData = async () => {
    try {
      const res = await postService.getPostDetail(slug)
      if (res && res.postId) {
        setPost(res)
        try {
          const saved = await postService.checkIsSaved(res.postId)
          setIsSaved(!!saved?.isSaved)
        } catch (savedError) {
          console.error('PostDetail checkIsSaved error:', savedError)
          setIsSaved(false)
        }
      } else {
        setPost(null)
        console.error('PostDetail loadData: No post data returned for slug:', slug)
      }
    } catch (e) {
      console.error('PostDetail loadData error:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    try {
      const shareSlug = post?.postSlug || post?.postId
      const webUrl = `${WEB_BASE_URL}/san-pham/${shareSlug}`
      await Share.share({
        message: `${post?.postTitle}\n${webUrl}`,
        url: webUrl,
        title: post?.postTitle || 'GreenMarket',
      })
    } catch (error) {
      console.error(error)
    }
  }

  const handleToggleSave = async () => {
    try {
      if (post?.postId) {
        const res = await postService.toggleFavorite(post.postId)
        setIsSaved(res.isSaved)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const ownerShopFallback = useMemo(() => {
    if (!isOwner || !shop?.shopId || !post?.postShopId) return null
    return Number(shop.shopId) === Number(post.postShopId) ? shop : null
  }, [isOwner, post?.postShopId, shop])

  const displayShop = post?.shop || ownerShopFallback || null
  const sellerName = displayShop?.shopName || post?.author?.userDisplayName || user?.userDisplayName || 'Người bán'
  const contactPhoneRaw = displayShop?.shopPhone || displayShop?.phones?.[0] || post?.postContactPhone || (isOwner ? user?.userMobile : '') || ''
  const contactPhone = String(contactPhoneRaw).replace(/\s+/g, '')
  const displayAddress = displayShop?.shopLocation || post?.postLocation || (isOwner ? shop?.shopLocation : '') || ''
  const displayLat = displayShop?.shopLat || post?.postLat
  const displayLng = displayShop?.shopLng || post?.postLng

  const openMap = () => {
    const lat = displayLat
    const lng = displayLng
    const addr = displayAddress
    const label = encodeURIComponent(post?.postTitle || 'Vị trí cây cảnh')

    if (Platform.OS === 'web') {
      const webUrl = lat && lng
        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`
      Linking.openURL(webUrl)
      return
    }

    let url = ''
    if (Platform.OS === 'ios') {
      url = lat && lng
        ? `maps:0,0?q=${label}@${lat},${lng}`
        : `maps:0,0?q=${encodeURIComponent(addr)}`
    } else {
      url = lat && lng
        ? `geo:${lat},${lng}?q=${lat},${lng}(${label})`
        : `geo:0,0?q=${encodeURIComponent(addr)}`
    }

    Linking.openURL(url).catch(() => {
      const fallbackUrl = lat && lng
        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`
      Linking.openURL(fallbackUrl)
    })
  }

  const openZalo = () => {
    if (!contactPhone) return
    if (post?.postId && !isOwner) {
      postService.recordContactClick(post.postId).catch(console.error)
    }
    Linking.openURL(`https://zalo.me/${contactPhone}`).catch(console.error)
  }

  const makeCall = () => {
    if (!contactPhone) return
    if (post?.postId && !isOwner) {
      postService.recordContactClick(post.postId).catch(console.error)
    }
    Linking.openURL(`tel:${contactPhone}`).catch(console.error)
  }

  if (loading) return <View style={styles.center}><Text>Đang tải...</Text></View>
  if (!post) return <View style={styles.center}><Text>Không tìm thấy tin đăng hoặc đã bị xóa.</Text></View>

  const normalizeMediaUrl = (raw: unknown): string => {
    if (!raw) return ''
    if (typeof raw === 'string') return resolveImageUrl(raw)
    if (typeof raw === 'object') {
      const record = raw as Record<string, unknown>
      const url =
        (typeof record.imageUrl === 'string' && record.imageUrl) ||
        (typeof record.videoUrl === 'string' && record.videoUrl) ||
        (typeof record.url === 'string' && record.url) ||
        ''
      return resolveImageUrl(url)
    }
    return resolveImageUrl(String(raw))
  }

  const media = [
    ...(post?.images || []).map((i: any) => ({ type: 'image', url: normalizeMediaUrl(i) })),
    ...(post?.videos || []).map((v: any) => ({ type: 'video', url: normalizeMediaUrl(v) })),
  ]

  const renderRightActions = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {!isOwner && (
        <TouchableOpacity onPress={() => navigation.navigate('CreateReport', { postId: post?.postId, postTitle: post?.postTitle })}>
          <AlertCircle size={24} color="#ff4d4f" />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={handleShare}>
        <Share2 size={24} color="#fff" />
      </TouchableOpacity>
      {!isOwner && (
        <TouchableOpacity onPress={handleToggleSave}>
          <Bookmark size={24} color={isSaved ? '#10b981' : '#fff'} fill={isSaved ? '#10b981' : 'transparent'} />
        </TouchableOpacity>
      )}
    </View>
  )

  return (
    <MobileLayout
      title="Chi tiết tin đăng"
      headerStyle="default"
      backButton={() => navigation.goBack()}
      rightAction={renderRightActions()}
      scrollEnabled={true}
      bottom={
        !isOwner ? (
          <View style={styles.bottomActions}>
            <Button
              variant="outline"
              style={{ flex: 1, borderColor: '#1890ff' }}
              textStyle={{ color: '#1890ff' }}
              icon={<MessageCircle size={20} color="#1890ff" />}
              disabled={!contactPhone}
              onPress={openZalo}
            >
              Zalo
            </Button>
            <Button
              variant="primary"
              style={{ flex: 2 }}
              icon={<Phone size={20} color="#fff" />}
              disabled={!contactPhone}
              onPress={makeCall}
            >
              Gọi ngay
            </Button>
          </View>
        ) : undefined
      }
    >
      <MediaGallery media={media} />

      <View style={styles.container}>
        <View style={styles.mainInfo}>
          <Text style={styles.postTitle}>{post?.postTitle}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.verifyBadge}>
              <ShieldCheck size={14} color="#52c41a" />
              <Text style={styles.verifyText}>Đã xác thực</Text>
            </View>
            {/* <View style={styles.metaBadge}>
              <Eye size={14} color="#8c8c8c" />
              <Text style={styles.metaText}>{post?.postViewCount || 0} lượt xem</Text>
            </View> */}
          </View>

          <View style={styles.contactBadge}>
            <Text style={styles.contactBadgeText}>{isOwner ? 'Thông tin hiển thị trên bài đăng' : 'Liên hệ'}</Text>
          </View>
        </View>

        {(sellerName || contactPhone || displayAddress) && (
          <Card style={styles.sectionCard} padding="medium">
            <View style={styles.sectionHeader}>
              <Store size={18} color="#52c41a" />
              <Text style={styles.sectionTitle}>Cửa hàng / Người bán</Text>
            </View>

            <View style={styles.infoRow}>
              <Store size={16} color="#94a3b8" />
              <Text style={styles.infoText}>{sellerName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Phone size={16} color="#94a3b8" />
              <Text style={styles.infoText}>{contactPhone || 'Chưa cập nhật số điện thoại'}</Text>
            </View>

            <View style={styles.infoRow}>
              <MapPin size={16} color="#94a3b8" />
              <Text style={styles.infoText}>{displayAddress || 'Chưa cập nhật địa chỉ'}</Text>
            </View>
          </Card>
        )}

        {post?.attributes && (
          <Card style={styles.sectionCard} shadow padding="medium">
            <View style={styles.sectionHeader}>
              <Maximize2 size={18} color="#52c41a" />
              <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>
            </View>
            <View style={styles.attrGrid}>
              {post?.attributes.map((attr: any, index: number) => (
                <View key={index} style={styles.attrItem}>
                  <Text style={styles.attrLabel}>{attr.name}</Text>
                  <Text style={styles.attrValue}>{attr.value}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {!!post?.postShopId && (
          <Card
            style={styles.shopCard}
            padding="medium"
            onClick={() => navigation.navigate('PublicShopDetail', { shopId: post?.postShopId })}
          >
            <View style={styles.shopContent}>
              <View style={styles.shopAvatar}>
                <Store size={24} color="#52c41a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shopName}>{displayShop?.shopName || 'Cửa hàng của bài đăng'}</Text>
                <Text style={styles.shopSub}>{isOwner ? 'Xem lại trang cửa hàng của bạn' : 'Xem chi tiết người bán'}</Text>
              </View>
              <ExternalLink size={18} color="#bfbfbf" />
            </View>
          </Card>
        )}

        {(displayAddress || (displayLat && displayLng)) && (
          <Card style={styles.sectionCard} padding="medium">
            <View style={styles.sectionHeader}>
              <MapPin size={18} color="#52c41a" />
              <Text style={styles.sectionTitle}>Vị trí</Text>
            </View>
            <Text style={styles.locationText}>{displayAddress || 'Chưa cập nhật vị trí'}</Text>
            <Button
              variant="outline"
              size="small"
              style={{ marginTop: 12, borderColor: '#d9d9d9' }}
              textStyle={{ color: '#595959' }}
              onPress={openMap}
            >
              Mở trong bản đồ
            </Button>
          </Card>
        )}

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
  contactBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#6ee7b7',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 12,
  },
  contactBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
  },
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#595959',
    lineHeight: 20,
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
