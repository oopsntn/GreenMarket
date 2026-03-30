import { api } from "../../../config/api";

export const ReportService = {
    createReport: async (data: {
        reporterId: number | null;
        postId: number;
        reportReason: string;
    }) => {
        try {
            const res = await api.post('/reports/', data)
            return res.data
        } catch (e) {
            console.error("Error submit report: ", e);
        }
    }
}