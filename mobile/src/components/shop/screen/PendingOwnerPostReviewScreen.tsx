import React, { useMemo, useState } from 'react'
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native'
import { BadgeInfo, CalendarDays, CheckCircle, CircleAlert, FileText, UserRound, XCircle } from 'lucide-react-native'

import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import Card from '../../Reused/Card/Card'
import Button from '../../Reused/Button/Button'
import CustomAlert from '../../../utils/AlertHelper'
import { PendingOwnerPost, ShopService } from '../service/shopService'

interface Props {
  route: {
    params?: {
      post?: PendingOwnerPost
    }
  }
  navigation: any
}

const formatDate = (value?: string) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString('vi-VN')
}

const PendingOwnerPostReviewScreen = ({ route, navigation }: Props) => {
  const post = route?.params?.post || null
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [actionModalVisible, setActionModalVisible] = useState(false)
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const createdAtLabel = useMemo(() => formatDate(post?.postCreatedAt), [post?.postCreatedAt])

  const openActionModal = (type: 'approve' | 'reject') => {
    setActionType(type)
    setReason('')
    setActionModalVisible(true)
  }

  const handleSubmitAction = async () => {
    if (!post?.postId) return

    if (actionType === 'reject' && !reason.trim()) {
      CustomAlert('Loi', 'Vui long nhap ly do tu choi')
      return
    }

    setProcessing(true)
    try {
      if (actionType === 'approve') {
        await ShopService.approveCollaboratorPost(post.postId)
        CustomAlert('Thanh cong', 'Da duyet bai thanh cong', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ])
      } else {
        await ShopService.rejectCollaboratorPost(post.postId, reason.trim())
        CustomAlert('Thanh cong', 'Da tu choi bai', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ])
      }

      setActionModalVisible(false)
    } catch (error: any) {
      CustomAlert('Loi', error?.response?.data?.error || 'Khong the xu ly yeu cau')
    } finally {
      setProcessing(false)
    }
  }

  if (!post) {
    return (
      <MobileLayout title="Kiem duyet bai dang" backButton={() => navigation.goBack()}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Khong tim thay du lieu bai dang.</Text>
          <Text style={styles.emptyText}>
            Hay quay lai danh sach cho duyet va mo lai bai dang.
          </Text>
        </View>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout
      title="Kiem duyet bai dang"
      backButton={() => navigation.goBack()}
      scrollEnabled
    >
      <View style={styles.container}>
        <Card style={styles.heroCard} padding="medium">
          <View style={styles.heroHeader}>
            <View style={styles.heroIcon}>
              <FileText size={22} color="#047857" />
            </View>
            <View style={styles.heroBody}>
              <Text style={styles.title}>{post.postTitle || `Bai dang #${post.postId}`}</Text>
              <Text style={styles.subtitle}>Trang thai: {post.postStatus || 'pending_owner'}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.sectionCard} padding="medium">
          <View style={styles.sectionHeader}>
            <BadgeInfo size={18} color="#2563EB" />
            <Text style={styles.sectionTitle}>Thong tin cho duyet</Text>
          </View>

          <View style={styles.infoRow}>
            <UserRound size={16} color="#64748B" />
            <View style={styles.infoBody}>
              <Text style={styles.infoLabel}>Cong tac vien</Text>
              <Text style={styles.infoValue}>
                {post.authorName || 'Khong ro ten'} • {post.authorMobile || 'Khong co so dien thoai'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <CalendarDays size={16} color="#64748B" />
            <View style={styles.infoBody}>
              <Text style={styles.infoLabel}>Thoi gian tao</Text>
              <Text style={styles.infoValue}>{createdAtLabel}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <FileText size={16} color="#64748B" />
            <View style={styles.infoBody}>
              <Text style={styles.infoLabel}>Slug</Text>
              <Text style={styles.infoValue}>{post.postSlug || 'Chua co slug'}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.noticeCard} padding="medium">
          <View style={styles.sectionHeader}>
            <CircleAlert size={18} color="#D97706" />
            <Text style={styles.sectionTitle}>Luu y</Text>
          </View>
          <Text style={styles.noticeText}>
            Mobile hien chi co du lieu danh sach cho duyet cho owner. Vi vay man nay dung de review nhanh
            thong tin co san va xu ly duyet/tu choi ma khong bi loi 404.
          </Text>
        </Card>

        <View style={styles.actions}>
          <Button
            variant="outline"
            style={styles.rejectButton}
            textStyle={{ color: '#DC2626' }}
            icon={<XCircle size={18} color="#DC2626" />}
            onPress={() => openActionModal('reject')}
          >
            Tu choi
          </Button>
          <Button
            style={styles.approveButton}
            icon={<CheckCircle size={18} color="#fff" />}
            onPress={() => openActionModal('approve')}
          >
            Duyet bai
          </Button>
        </View>
      </View>

      <Modal visible={actionModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {actionType === 'approve' ? 'Xac nhan duyet bai' : 'Tu choi bai dang'}
            </Text>

            <Text style={styles.modalDesc}>
              {actionType === 'approve'
                ? `Bai dang "${post.postTitle}" se duoc xuat ban cong khai.`
                : `Nhap ly do tu choi bai dang "${post.postTitle}".`}
            </Text>

            {actionType === 'reject' ? (
              <TextInput
                style={styles.input}
                placeholder="Ly do tu choi..."
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            ) : null}

            <View style={styles.modalActions}>
              <Button
                variant="outline"
                style={{ flex: 1 }}
                disabled={processing}
                onPress={() => setActionModalVisible(false)}
              >
                Huy
              </Button>
              <Button
                style={{
                  flex: 1,
                  backgroundColor: actionType === 'approve' ? '#16A34A' : '#DC2626',
                  borderColor: actionType === 'approve' ? '#16A34A' : '#DC2626',
                }}
                loading={processing}
                disabled={processing || (actionType === 'reject' && !reason.trim())}
                onPress={handleSubmitAction}
              >
                {actionType === 'approve' ? 'Duyet' : 'Xac nhan'}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </MobileLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  heroCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  heroHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBody: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#065F46',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#047857',
  },
  sectionCard: {
    backgroundColor: '#fff',
  },
  noticeCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  infoBody: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 20,
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#9A3412',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  rejectButton: {
    flex: 1,
    borderColor: '#FCA5A5',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
  },
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
})

export default PendingOwnerPostReviewScreen
