import { API_URL } from "../../../../App";
import axios from "axios";

export const postService = {
    createPost: async (postData: any) => {
        try {
            const response = await axios.post(`${API_URL}/posts`, postData)
            return response.data
        } catch (error) {
            console.error("Lỗi gọi API createPost: , error");
            throw error
        }
    }
}