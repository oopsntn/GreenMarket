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
    "Bài đang được phân phối ở vị trí quảng bá và được đội vận hành theo dõi.",
  "Campaign is paused while the team reviews content and quota strategy.":
    "Bài đang tạm dừng để đội vận hành rà soát nội dung và kế hoạch phân phối.",
  "Campaign is scheduled and waiting for the start time window.":
    "Bài đã được lên lịch và đang chờ tới thời gian bắt đầu phân phối.",
  "Campaign finished the purchased quota and closed successfully.":
    "Bài đã dùng hết quota quảng bá và kết thúc thành công.",
  "Campaign expired before additional payment or reopen confirmation.":
    "Bài đã hết hạn trước khi có thanh toán bổ sung hoặc xác nhận mở lại.",
  "Campaign was manually closed by the operations team.":
    "Bài đã được đội vận hành dừng hẳn khỏi hàng chờ phân phối.",
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
        defaultErrorMessage: "Không thể tải danh sách quảng bá.",
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
        subtitle: "Số lượt quảng bá đang hiển thị tại các vị trí quảng bá",
      },
      {
        title: "Đã lên lịch",
        value: String(scheduledCount),
        subtitle: "Lượt quảng bá đã được xếp lịch và chờ đến ngày chạy",
      },
      {
        title: "Cần rà soát",
        value: String(needsReviewCount),
        subtitle: "Lượt quảng bá cần kiểm tra lại nội dung hoặc cách phân phối",
      },
      {
        title: "Có rủi ro",
        value: String(atRiskCount),
        subtitle: "Lượt quảng bá có tiến độ hiển thị thấp hơn mức an toàn",
      },
      {
        title: "CTR TB / Quota đã dùng",
        value: `${averageCtr} / ${deliveredQuota.toLocaleString("en-US")}`,
        subtitle: "Ảnh chụp nhanh hiệu quả quảng bá hiện tại",
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
        defaultErrorMessage: "Không thể cập nhật trạng thái quảng bá.",
        body: JSON.stringify({ status }),
      },
    );

    const normalizedPost = mapBoostedPost(updatedPost);

    return posts.map((item) => (item.id === postId ? normalizedPost : item));
  },
};