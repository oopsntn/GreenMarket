import { apiClient } from "../lib/apiClient";
import type {
  BoostedPost,
  BoostedPostApiResponse,
  BoostedPostDeliveryHealth,
  BoostedPostStatus,
  BoostedPostSummaryCard,
} from "../types/boostedPost";

const OPERATOR_LABELS: Record<string, string> = {
  "Ops Team A": "Nhóm vận hành A",
  "Ops Team B": "Nhóm vận hành B",
  "Ops Team C": "Nhóm vận hành C",
};

const NOTE_LABELS: Record<string, string> = {
  "Campaign is actively delivering boosted impressions under operations monitoring.":
    "Chiến dịch đang phân phối lượt hiển thị nổi bật và được đội vận hành theo dõi.",
  "Campaign is paused while the team reviews content and quota strategy.":
    "Chiến dịch đang tạm dừng để đội vận hành rà soát nội dung và chiến lược quota.",
  "Campaign is scheduled and waiting for the start time window.":
    "Chiến dịch đã lên lịch và đang chờ tới khung giờ bắt đầu.",
  "Campaign finished the purchased quota and closed successfully.":
    "Chiến dịch đã dùng hết quota đã mua và kết thúc thành công.",
  "Campaign expired before additional payment or reopen confirmation.":
    "Chiến dịch đã hết hạn trước khi có xác nhận thanh toán hoặc mở lại.",
  "Campaign was manually closed by the operations team.":
    "Chiến dịch đã được đội vận hành đóng thủ công.",
};

const translateOperator = (value: string) => OPERATOR_LABELS[value] || value;
const translateNote = (value: string) => NOTE_LABELS[value] || value;

const mapBoostedPost = (item: BoostedPostApiResponse): BoostedPost => ({
  ...item,
  assignedOperator: translateOperator(item.assignedOperator),
  notes: translateNote(item.notes),
});

const getAverageCtr = (posts: BoostedPost[]) => {
  const livePosts = posts.filter((item) => item.impressions > 0);

  if (livePosts.length === 0) {
    return "0.00%";
  }

  const totalCtr = livePosts.reduce(
    (sum, item) => sum + (item.clicks / item.impressions) * 100,
    0,
  );

  return `${(totalCtr / livePosts.length).toFixed(2)}%`;
};

const countByDeliveryHealth = (
  posts: BoostedPost[],
  health: BoostedPostDeliveryHealth,
) => posts.filter((item) => item.deliveryHealth === health).length;

export const boostedPostService = {
  async getBoostedPosts(): Promise<BoostedPost[]> {
    const data = await apiClient.request<BoostedPostApiResponse[]>(
      "/api/admin/boosted-posts",
      {
        defaultErrorMessage:
          "Không thể tải danh sách chiến dịch đẩy nổi bật.",
      },
    );

    return data.map(mapBoostedPost);
  },

  getSummaryCards(posts: BoostedPost[]): BoostedPostSummaryCard[] {
    const activeCount = posts.filter((item) => item.status === "Active").length;
    const scheduledCount = posts.filter(
      (item) => item.status === "Scheduled",
    ).length;
    const needsReviewCount = posts.filter(
      (item) => item.reviewStatus !== "Approved",
    ).length;
    const atRiskCount = countByDeliveryHealth(posts, "At Risk");
    const deliveredQuota = posts.reduce((sum, item) => sum + item.usedQuota, 0);
    const averageCtr = getAverageCtr(posts);

    return [
      {
        title: "Đang phân phối",
        value: String(activeCount),
        subtitle:
          "Chiến dịch đang hiển thị trên các vị trí đẩy nổi bật",
      },
      {
        title: "Đã lên lịch",
        value: String(scheduledCount),
        subtitle: "Chiến dịch sẵn sàng cho khung phân phối tiếp theo",
      },
      {
        title: "Cần rà soát",
        value: String(needsReviewCount),
        subtitle: "Chiến dịch đang chờ kiểm tra nội dung hoặc vận hành",
      },
      {
        title: "Có rủi ro",
        value: String(atRiskCount),
        subtitle:
          "Chiến dịch có chất lượng phân phối dưới ngưỡng an toàn",
      },
      {
        title: "CTR TB / Quota đã dùng",
        value: `${averageCtr} / ${deliveredQuota.toLocaleString("en-US")}`,
        subtitle:
          "Ảnh chụp nhanh hiệu quả vận hành trên toàn bộ chiến dịch",
      },
    ];
  },

  async updateBoostedPostStatus(
    posts: BoostedPost[],
    postId: number,
    status: BoostedPostStatus,
  ): Promise<BoostedPost[]> {
    const updatedPost = await apiClient.request<BoostedPostApiResponse>(
      `/api/admin/boosted-posts/${postId}/status`,
      {
        method: "PATCH",
        includeJsonContentType: true,
        defaultErrorMessage:
          "Không thể cập nhật trạng thái chiến dịch đẩy nổi bật.",
        body: JSON.stringify({ status }),
      },
    );

    const normalizedPost = mapBoostedPost(updatedPost);

    return posts.map((item) => (item.id === postId ? normalizedPost : item));
  },
};
