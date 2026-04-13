import type { Template, TemplateFormState } from "../types/template";

export const initialTemplates: Template[] = [
  {
    id: 1,
    name: "Từ chối bài đăng thiếu thông tin",
    type: "Rejection Reason",
    content:
      "Bài đăng của bạn đang thiếu một số thông tin bắt buộc như tiêu đề rõ ràng, mô tả chi tiết hoặc hình ảnh phù hợp. Vui lòng bổ sung và gửi duyệt lại.",
    status: "Active",
    description:
      "Mẫu từ chối dùng cho bài đăng còn thiếu nội dung cơ bản trước khi được duyệt.",
    usageNote:
      "Dùng khi bài đăng thiếu thông tin bắt buộc nhưng vẫn có thể chỉnh sửa và gửi lại.",
    updatedAt: "14/04/2026 09:00",
  },
];

export const emptyTemplateForm: TemplateFormState = {
  name: "",
  type: "Rejection Reason",
  content: "",
  description: "",
  usageNote: "",
  status: "Active",
};
