import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Card from '../../../components/Card/Card';
import { AlertCircle, Edit2, Trash2 } from 'lucide-react-native';

interface Post {
  title: string;
  price: number;
  status: 'active' | 'pending' | 'rejected';
  rejectedReason?: string;
}

const PostItem: React.FC<{ post: Post }> = ({ post }) => {
  return (
    <Card padding='medium' shadow style={styles.cardMargin}>
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.price}>{post.price.toLocaleString()}đ</Text>

      <View style={[styles.statusBadge, styles[post.status]]}>
        <Text style={[styles.statusText, styles[`${post.status}Text` as keyof typeof styles]]}>
          {post.status}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn}>
          <Edit2 size={16} color='#2e7d32' />
          <Text style={styles.actionTextMain}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Trash2 size={16} color='#c62828' />
          <Text style={styles.actionTextDanger}>Xóa</Text>
        </TouchableOpacity>
      </View>

      {post.rejectedReason && (
        <View style={styles.errorBox}>
          <AlertCircle size={14} color='#c62828' />
          <Text style={styles.errorText}>{post.rejectedReason}</Text>
        </View>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  cardMargin: { marginBottom: 12 },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  active: {
    backgroundColor: '#e8f5e9',
  },
  activeText: {
    color: '#2e7d32',
  },
  pending: {
    backgroundColor: '#fff8e1',
  },
  pendingText: {
    color: '#fdecea',
  },
  rejected: {
    backgroundColor: '#fdecea'
  },
  rejectedText: {
    color: '#c62828'
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  actionTextMain: {
    color: '#2e7d32',
    fontSize: 13,
    fontWeight: '500'
  },
  actionTextDanger: {
    color: '#c62828',
    fontSize: 13,
    fontWeight: '500'
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdecea',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    gap: 6,
  },
  errorText: {
    color: '#c62828',
    fontSize: 12
  }
})

export default PostItem
