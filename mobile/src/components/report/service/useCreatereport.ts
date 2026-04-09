import { useState } from 'react'
import { Alert } from 'react-native'
import { ReportService } from './reportService'
import { useAuth } from '../../../context/AuthContext'

export const useCreateReport = (postId: number) => {
    const { user } = useAuth()
    const [reportReason, setReportReason] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)

    const reasons = [
        'False information',
        'Fake price / Scam',
        'Inappropriate images',
        'Prohibited product',
        'Other'
    ]

    const handleSubmit = async (onSuccess: () => void) => {
        if (!reportReason) {
            return Alert.alert('Notice', 'Please choose a report reason')
        }
        if (!user?.id) {
            return Alert.alert('Authentication required', 'Please sign in before sending a report.')
        }
        setLoading(true)
        try {
            const finalReason = description ? `${reportReason} - Details: ${description}` : reportReason
            await ReportService.createReport({
                postId,
                reportReason: finalReason,
            })
            Alert.alert('Success', 'Your report has been submitted. The admin team will review it soon.')
            onSuccess()
        } catch (e) {
            console.error('Error', e)
            Alert.alert('Error', 'Unable to submit the report. Please try again later.')
        } finally {
            setLoading(false)
        }
    }

    return {
        reportReason,
        setReportReason,
        description,
        setDescription,
        loading,
        reasons,
        handleSubmit
    }
}
