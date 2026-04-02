import React from 'react'
import { Modal, Text, View } from 'react-native';
import Card from '../../Reused/Card/Card';
import Input from '../../Reused/Input/Input';
import Button from '../../Reused/Button/Button';

interface ModalProps {
  visible: boolean;
  editingPost: any;
  editData: { title: string, price: string };
  setEditData: (data: { title: string; price: string }) => void;
  onClose: () => void;
  onSave: (postId: number, data: any) => void;
  saving?: boolean;
  styles: any;
}

const EditPostModal = ({
  visible, editingPost, editData, setEditData, onClose, onSave, saving = false, styles
}: ModalProps) => {
  if (!editingPost) return null

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Card style={styles.modalCard}>
          <Text style={styles.modalTitle}>Edit post</Text>

          <Input
            label="Title"
            value={editData.title}
            onChangeText={(t) => setEditData({ ...editData, title: t })}
          />

          <Input
            label="Price"
            type="numeric"
            value={editData.price}
            onChangeText={(t) => setEditData({ ...editData, price: t })}
          />

          <View style={styles.modalButtons}>
            <Button
              style={{ flex: 1, backgroundColor: '#666' }}
              onPress={onClose}
              disabled={saving}
            >
              Cancel
            </Button>

            <View style={{ width: 10 }} />

            <Button
              style={{ flex: 1 }}
              loading={saving}
              disabled={saving}
              onPress={() => onSave(editingPost.postId, {
                postTitle: editData.title,
                postPrice: editData.price
              })}
            >
              Save
            </Button>
          </View>
        </Card>
      </View>
    </Modal>
  )
}

export default EditPostModal
