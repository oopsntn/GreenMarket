import { useState } from "react"
import { Alert } from 'react-native'
import { ReportService } from "./reportService"

export const useCreateReport = (postId: number, reporterId: number | null) => {
    const [reportReason, setReportReason] = useState('')
    const [loading, setLoading] = useState(true)

    // Danh sách các lý do báo cáo để map vào reportReason
    const reasons = [
        "Nội dung sai sự thật",
        "Giá ảo / Lừa đảo",
        "Hình ảnh không phù hợp",
        "Sản phẩm cấm kinh doanh",
        "Lý do khác"
    ];

    const handleSubmit = async (onSuccess: () => void) => {
        if (!reportReason) {
            return Alert.alert("Thông báo", "Vui lòng chọn lý do báo cáo")
        }
        try {
            setLoading(true)
            await ReportService.createReport({
                reporterId,
                postId,
                reportReason
            })
            Alert.alert("Thành công", "Báo cáo của bạn đã được gửi. Admin sẽ xem xét sớm nhất.")
            // Quay lại màn hình trước đó
            onSuccess()
        } catch (e) {
            console.error("Lỗi", "Không thể gửi báo cáo. Vui lòng thử lại sau.");
        } finally {
            setLoading(false)
        }
    }

    return {
        reportReason,
        setReportReason,
        loading,
        reasons,
        handleSubmit
    }
}