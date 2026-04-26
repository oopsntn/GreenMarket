import { useState } from 'react'
import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { ReportService } from './reportService'
import { useAuth } from '../../../context/AuthContext'

type ReportReason = {
    code: string;
    label: string;
    description: string;
}

const REPORT_REASONS: ReportReason[] = [
    {
        code: 'scam',
        label: 'Lừa đảo, gian lận',
        description: 'Người bán có dấu hiệu lừa đảo hoặc thông tin giá không trung thực.'
    },
    {
        code: 'prohibited',
        label: 'Hàng cấm kinh doanh',
        description: 'Sản phẩm thuộc danh mục cấm hoặc vi phạm pháp luật.'
    },
    {
        code: 'wrong_category',
        label: 'Sai danh mục',
        description: 'Bài đăng được đặt sai chuyên mục hoặc thuộc tính.'
    },
    {
        code: 'poor_quality',
        label: 'Nội dung/Hình ảnh kém',
        description: 'Hình ảnh mờ, sai thực tế hoặc nội dung spam.'
    },
    {
        code: 'other',
        label: 'Lý do khác',
        description: 'Các vấn đề khác không nằm trong danh sách trên.'
    },
]

export const useCreateReport = (postId: number) => {
    const { user } = useAuth()
    const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
    const [description, setDescription] = useState('')
    const [evidenceImages, setEvidenceImages] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    const pickEvidenceImages = async () => {
        const remaining = 5 - evidenceImages.length
        if (remaining <= 0) {
            Alert.alert('Thông báo', 'Chỉ được tải lên tối đa 5 ảnh bằng chứng.')
            return
        }

        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permission.granted) {
            Alert.alert('Yêu cầu quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để chọn bằng chứng.')
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: remaining,
            quality: 0.8,
        })

        if (result.canceled) {
            return
        }

        const newUris = result.assets.map((asset) => asset.uri)
        setEvidenceImages((prev) => [...prev, ...newUris].slice(0, 5))
    }

    const removeEvidenceImage = (index: number) => {
        setEvidenceImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
    }

    const handleSubmit = async (onSuccess: () => void) => {
        if (!selectedReason) {
            return Alert.alert('Thông báo', 'Vui lòng chọn lý do báo cáo')
        }
        if (!user?.id) {
            return Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập trước khi gửi báo cáo.')
        }

        setLoading(true)
        try {
            let evidenceUrls: string[] = []

            if (evidenceImages.length > 0) {
                const uploadRes = await ReportService.uploadEvidenceImages(evidenceImages)
                evidenceUrls = Array.isArray(uploadRes?.urls) ? uploadRes.urls : []
            }

            await ReportService.createReport({
                postId,
                reportReason: selectedReason.label,
                reportReasonCode: selectedReason.code,
                reportNote: description.trim() || undefined,
                evidenceUrls,
            })

            Alert.alert('Thành công', 'Báo cáo của bạn đã được gửi. Đội ngũ quản trị sẽ xem xét sớm.')
            onSuccess()
        } catch (e: any) {
            console.error('Report submit error', e)
            Alert.alert(
                'Lỗi',
                e?.response?.data?.error || 'Không thể gửi báo cáo. Vui lòng thử lại sau.'
            )
        } finally {
            setLoading(false)
        }
    }

    return {
        selectedReason,
        setSelectedReason,
        description,
        setDescription,
        evidenceImages,
        loading,
        reasons: REPORT_REASONS,
        pickEvidenceImages,
        removeEvidenceImage,
        handleSubmit
    }
}
