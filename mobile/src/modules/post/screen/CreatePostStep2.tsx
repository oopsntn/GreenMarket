import { useNavigation } from '@react-navigation/native'
import React, { useState } from 'react'
import MobileLayout from '../../../components/MobileLayout/MobileLayout'
import { Button, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native'
import Input from '../../../components/Input/Input'
import { ImagePlus } from 'lucide-react-native'

const CreatePostStep2 = () => {
  const navigation = useNavigation()
  const [text, setText] = useState('')
  return (
    <MobileLayout title='Thông tin chi tiết' backButton={() => navigation.goBack()}>
      <ScrollView style={{ padding: 16 }}>
        <Input value={text} onChangeText={setText} label='Tiêu đề *' placeholder='Ví dụ: Sen đá mini cute' required />
        <Input value={text} onChangeText={setText} label='Giá (đ)' placeholder='Ví dụ: 10000' type="numeric" />
        <Input value={text} onChangeText={setText} label='Mô tả' placeholder='Mô tả chi tiết về sản phẩm' multiline style={{ height: 100, textAlignVertical: 'top' }} />

        <Text style={styles.sectionTitle}>Thuộc tính</Text>
        <Input value={text} onChangeText={setText} placeholder="Loại cây (Ví dụ: Sen đá)" />
        <Input value={text} onChangeText={setText} placeholder="Kích thước (Ví dụ: 10cm)" />

        <Input label="Địa điểm" icon="map-pin" value={text} onChangeText={setText} />

        <TouchableOpacity style={styles.uploadBox}>
          <ImagePlus size={24} color="#666" />
          <Text style={styles.uploadText}>Upload hình ảnh (tối đa 10)</Text>
        </TouchableOpacity>

        <Button onPress={() => navigation.navigate('CreatePostPreview')} style={styles.nextBtn}>
          Tiếp tục
        </Button>
      </ScrollView>
    </MobileLayout>
  )
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginVertical: 12,
    color: '#333',
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    backgroundColor: '#f9f9f9',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 13,
    color: '#666',
  },
  nextBtn: {
    marginTop: 10,
    marginBottom: 30,
  },
})
export default CreatePostStep2
