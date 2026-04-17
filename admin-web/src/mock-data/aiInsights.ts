import type {
  AIInsightHistoryItem,
  AIInsightSettings,
  AITrendScoreRow,
} from "../types/aiInsight";

export const initialAIInsightSettings: AIInsightSettings = {
  autoDailySummary: true,
  anomalyAlerts: true,
  operatorDigest: false,
  recommendationTone: "Balanced",
  confidenceThreshold: 78,
  promptVersion: "gm-admin-v1.4",
  reviewMode: "Required",
};

export const initialAITrendRows: AITrendScoreRow[] = [
  {
    id: 1,
    focus: "Placement Performance",
    entity: "Vị trí 1 trang chủ / Gói đẩy bài theo tháng",
    score: 91,
    scoreNote: "Hiệu suất cao nhất",
    momentum: "Up",
    momentumNote: "Đang tăng",
    recommendation:
      "Giữ ổn định slot vị trí 1 vì đây là nơi tạo doanh thu và CTR tốt nhất trong nhóm bài đẩy.",
    updatedAt: "2026-04-02 09:10",
  },
  {
    id: 2,
    focus: "Promotion Watchlist",
    entity: "BST-BOOSTPOST2-0011",
    score: 84,
    scoreNote: "Cần theo dõi",
    momentum: "Down",
    momentumNote: "Đang giảm",
    recommendation:
      "Rà soát lại chiến dịch vị trí 2 đang tạm dừng để tránh bỏ trống slot quá lâu.",
    updatedAt: "2026-04-02 08:40",
  },
  {
    id: 3,
    focus: "Revenue Signals",
    entity: "Gói đẩy bài theo tháng vị trí 2 trang chủ",
    score: 88,
    scoreNote: "Đóng góp tốt",
    momentum: "Up",
    momentumNote: "Đang tăng",
    recommendation:
      "Gói vị trí 2 có chi phí vừa phải và chuyển đổi ổn, phù hợp làm gói trung gian để upsell.",
    updatedAt: "2026-04-01 18:25",
  },
  {
    id: 4,
    focus: "Operator Load",
    entity: "Nhóm vận hành A",
    score: 67,
    scoreNote: "Ổn định",
    momentum: "Stable",
    momentumNote: "Không đổi",
    recommendation:
      "Tiếp tục theo dõi tải xử lý vì nhóm đang phụ trách cả 3 slot trang chủ và đơn quảng bá đang hoạt động.",
    updatedAt: "2026-04-01 17:05",
  },
  {
    id: 5,
    focus: "Promotion Watchlist",
    entity: "BST-BOOSTPOST3-0014",
    score: 73,
    scoreNote: "Theo dõi nhẹ",
    momentum: "Stable",
    momentumNote: "Không đổi",
    recommendation:
      "Gói vị trí 3 đang chạy ổn nhưng quota còn nhiều, có thể giữ như gói thử nghiệm chi phí thấp.",
    updatedAt: "2026-04-01 14:30",
  },
  {
    id: 6,
    focus: "Placement Performance",
    entity: "Vị trí 3 trang chủ / Gói đẩy bài theo tháng",
    score: 79,
    scoreNote: "Hiệu suất thấp hơn",
    momentum: "Down",
    momentumNote: "Đang giảm",
    recommendation:
      "Vị trí 3 có hiệu suất thấp hơn hai slot đầu, nên dùng như gói entry để giữ đủ lựa chọn giá.",
    updatedAt: "2026-03-31 16:00",
  },
];

export const initialAIInsightHistory: AIInsightHistoryItem[] = [
  {
    id: 1,
    title: "Tóm tắt hiệu suất vị trí trang chủ",
    focus: "Placement Performance",
    summary:
      "Vị trí 1 trang chủ đang vượt vị trí 2 và 3 về CTR lẫn doanh thu trong chu kỳ gần nhất.",
    detail:
      "Doanh thu đang tập trung ở vị trí 1. Vị trí 2 giữ vai trò cân bằng chi phí và hiệu quả. Vị trí 3 phù hợp làm gói thử nghiệm hoặc mở rộng danh mục giá.",
    generatedBy: "AI Summary Job",
    generatedAt: "2026-04-02 09:15",
    status: "Generated",
  },
  {
    id: 2,
    title: "Danh sách chiến dịch cần rà soát",
    focus: "Promotion Watchlist",
    summary:
      "Có các chiến dịch đang tạm dừng hoặc gần bỏ trống slot, cần admin đọc lại trước khi quyết định tiếp tục.",
    detail:
      "Ưu tiên kiểm tra các slot đang tạm dừng ở vị trí 1 và 2, vì đây là các vị trí ảnh hưởng trực tiếp đến hiển thị trang chủ.",
    generatedBy: "AI Summary Job",
    generatedAt: "2026-04-02 08:50",
    status: "Needs Review",
  },
  {
    id: 3,
    title: "Tín hiệu doanh thu gói đẩy bài",
    focus: "Revenue Signals",
    summary:
      "Gói vị trí 2 đang có tỷ lệ chi phí/hiệu quả khá tốt trong nhóm khách mua lại.",
    detail:
      "Nếu cần giữ nhịp mua đều, vị trí 2 là gói phù hợp để đẩy mạnh truyền thông hơn vị trí 1, vì rào cản giá thấp hơn.",
    generatedBy: "Revenue Desk",
    generatedAt: "2026-04-01 17:40",
    status: "Generated",
  },
  {
    id: 4,
    title: "Ghi chú cân tải vận hành",
    focus: "Operator Load",
    summary:
      "Nhóm vận hành hiện vẫn có thể xử lý thêm một số điều chỉnh mà chưa ảnh hưởng SLA.",
    detail:
      "Tuy vậy nếu số lượng chiến dịch vị trí 1 và 2 tăng mạnh cùng lúc, nên tách người phụ trách để tránh dồn việc vào cuối ngày.",
    generatedBy: "System",
    generatedAt: "2026-04-01 15:20",
    status: "Archived",
  },
];
