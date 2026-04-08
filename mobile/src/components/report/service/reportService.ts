import { api } from "../../../config/api";

export const ReportService = {
    createReport: async (data: {
        postId: number;
        reportReason: string;
    }) => {
        const res = await api.post('/reports/', data)
        return res.data
    }
}
