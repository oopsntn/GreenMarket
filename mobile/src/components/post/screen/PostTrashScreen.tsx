import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { CalendarDays, MapPin, PackageOpen, Phone, RotateCcw, Store, Trash2, X } from 'lucide-react-native'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import { postService } from '../service/postService'
import CustomAlert from '../../../utils/AlertHelper'
import { resolveImageUrl } from '../../../utils/resolveImageUrl'

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Chưa có'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Chưa có'

  return date.toLocaleString('vi-VN')
}

const PostTrashScreen = () => {
  const navigation = useNavigation<any>()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [selectedPost, setSelectedPost] = useState<any | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      const res = await postService.getMyPosts()
      setPosts(Array.isArray(res) ? res : [])
    } catch (e) {
      console.error('Failed to load trashed posts:', e)
      setPosts([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load(false)
  }, [load])

  const trashed = useMemo(() => posts.filter((p) => p?.postStatus === 'hidden'), [posts])

  const handleRestore = async (postId: number) => {
    try {
      await postService.restorePost(postId)
      CustomAlert('Thành công', 'Đã khôi phục bài đăng.')
      if (selectedPost?.postId === postId) {
        setSelectedPost(null)
      }
      await load(true)
    } catch (e) {
      console.error('Restore failed:', e)
      CustomAlert('Xin thông báo', 'Không thể khôi phục bài đăng.')
    }
  }

  const renderMetaRow = (icon: React.ReactNode, value: string) => (
    <View style={styles.metaRow}>
      {icon}
      <Text style={styles.metaText}>{value}</Text>
    </View>
  )

  return (
    <MobileLayout title="Thùng rác" scrollEnabled={false} backButton={() => navigation.goBack()}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      ) : (
        <>
          <FlatList
            data={trashed}
            keyExtractor={(item, index) => String(item?.postId ?? index)}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
            renderItem={({ item }) => {
              const firstImage = item?.images?.[0]?.imageUrl || item?.images?.[0] || ''
              const imageUrl = firstImage ? resolveImageUrl(firstImage) : ''
              const attrCount = Array.isArray(item?.attributes) ? item.attributes.length : 0
              const sellerLabel = item?.postShopId ? 'Bài đăng của cửa hàng' : 'Bài đăng cá nhân'

              return (
                <View style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.thumbnailWrap}>
                      {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
                      ) : (
                        <View style={styles.thumbnailPlaceholder}>
                          <PackageOpen size={26} color="#94A3B8" />
                        </View>
                      )}
                    </View>

                    <View style={styles.mainInfo}>
                      <Text style={styles.title} numberOfLines={2}>
                        {item?.postTitle || 'Bài đăng đã ẩn'}
                      </Text>
                      <View style={styles.hiddenBadge}>
                        <Trash2 size={12} color="#B91C1C" />
                        <Text style={styles.hiddenBadgeText}>Đã chuyển vào thùng rác</Text>
                      </View>
                      <Text style={styles.summaryText} numberOfLines={1}>
                        {sellerLabel}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaBlock}>
                    {renderMetaRow(
                      <MapPin size={15} color="#64748B" />,
                      item?.postLocation || 'Chưa cập nhật địa chỉ'
                    )}
                    {renderMetaRow(
                      <Phone size={15} color="#64748B" />,
                      item?.postContactPhone || 'Chưa cập nhật số điện thoại'
                    )}
                    {renderMetaRow(
                      <CalendarDays size={15} color="#64748B" />,
                      `Cập nhật: ${formatDateTime(item?.postUpdatedAt)}`
                    )}
                  </View>

                  <View style={styles.footerRow}>
                    <Text style={styles.attributeNote}>
                      {attrCount > 0 ? `${attrCount} thuộc tính chi tiết` : 'Không có thuộc tính chi tiết'}
                    </Text>

                    <View style={styles.actionGroup}>
                      <TouchableOpacity
                        style={styles.detailBtn}
                        onPress={() => setSelectedPost(item)}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.detailBtnText}>Xem chi tiết</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.restoreBtn}
                        onPress={() => handleRestore(Number(item.postId))}
                        activeOpacity={0.9}
                      >
                        <RotateCcw size={16} color="#065F46" />
                        <Text style={styles.restoreText}>Khôi phục</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )
            }}
            ListEmptyComponent={
              <View style={styles.center}>
                <Trash2 size={42} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>Thùng rác trống</Text>
                <Text style={styles.emptyDesc}>Các bài đăng đã ẩn sẽ hiển thị ở đây.</Text>
              </View>
            }
          />

          <Modal visible={!!selectedPost} transparent animationType="slide" onRequestClose={() => setSelectedPost(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chi tiết bài trong thùng rác</Text>
                  <TouchableOpacity onPress={() => setSelectedPost(null)} style={styles.closeBtn}>
                    <X size={18} color="#475569" />
                  </TouchableOpacity>
                </View>

                {selectedPost && (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.modalImageWrap}>
                      {selectedPost?.images?.[0]?.imageUrl || selectedPost?.images?.[0] ? (
                        <Image
                          source={{ uri: resolveImageUrl(selectedPost?.images?.[0]?.imageUrl || selectedPost?.images?.[0]) }}
                          style={styles.modalImage}
                        />
                      ) : (
                        <View style={styles.modalPlaceholder}>
                          <PackageOpen size={34} color="#94A3B8" />
                        </View>
                      )}
                    </View>

                    <Text style={styles.modalPostTitle}>{selectedPost?.postTitle || 'Bài đăng đã ẩn'}</Text>

                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
                      {renderMetaRow(
                        <Store size={16} color="#64748B" />,
                        selectedPost?.postShopId ? 'Bài đăng thuộc cửa hàng' : 'Bài đăng cá nhân'
                      )}
                      {renderMetaRow(
                        <MapPin size={16} color="#64748B" />,
                        selectedPost?.postLocation || 'Chưa cập nhật địa chỉ'
                      )}
                      {renderMetaRow(
                        <Phone size={16} color="#64748B" />,
                        selectedPost?.postContactPhone || 'Chưa cập nhật số điện thoại'
                      )}
                      {renderMetaRow(
                        <CalendarDays size={16} color="#64748B" />,
                        `Tạo lúc: ${formatDateTime(selectedPost?.postCreatedAt)}`
                      )}
                      {renderMetaRow(
                        <CalendarDays size={16} color="#64748B" />,
                        `Cập nhật: ${formatDateTime(selectedPost?.postUpdatedAt)}`
                      )}
                    </View>

                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>Thuộc tính chi tiết</Text>
                      {Array.isArray(selectedPost?.attributes) && selectedPost.attributes.length > 0 ? (
                        <View style={styles.attributeList}>
                          {selectedPost.attributes.map((attr: any, index: number) => (
                            <View key={`${attr?.attributeId ?? index}-${index}`} style={styles.attributeItem}>
                              <Text style={styles.attributeName}>{attr?.name || 'Thuộc tính'}</Text>
                              <Text style={styles.attributeValue}>{String(attr?.value ?? 'Chưa có')}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.emptyAttrText}>Bài đăng này chưa có thuộc tính chi tiết.</Text>
                      )}
                    </View>

                    {!!selectedPost?.postRejectedReason && (
                      <View style={styles.detailSection}>
                        <Text style={styles.sectionTitle}>Lý do gần nhất</Text>
                        <View style={styles.reasonBox}>
                          <Text style={styles.reasonText}>{selectedPost.postRejectedReason}</Text>
                        </View>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.restoreLargeBtn}
                      onPress={() => handleRestore(Number(selectedPost.postId))}
                      activeOpacity={0.9}
                    >
                      <RotateCcw size={18} color="#065F46" />
                      <Text style={styles.restoreLargeText}>Khôi phục bài đăng này</Text>
                    </TouchableOpacity>
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>
        </>
      )}
    </MobileLayout>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  list: { padding: 14, paddingBottom: 100, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnailWrap: {
    width: 92,
    height: 92,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
  },
  hiddenBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  hiddenBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  summaryText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  metaBlock: {
    marginTop: 14,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
  },
  footerRow: {
    marginTop: 16,
    gap: 12,
  },
  attributeNote: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  detailBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  restoreBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  restoreText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  emptyTitle: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  emptyDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '88%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  modalImageWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    marginBottom: 14,
  },
  modalImage: {
    width: '100%',
    height: 220,
  },
  modalPlaceholder: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPostTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 26,
    marginBottom: 16,
  },
  detailSection: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  attributeList: {
    gap: 10,
  },
  attributeItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  attributeName: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '700',
  },
  attributeValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },
  emptyAttrText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  reasonBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
  },
  reasonText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#991B1B',
    fontWeight: '600',
  },
  restoreLargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 12,
  },
  restoreLargeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
})

export default PostTrashScreen
