import { apiClient } from "../lib/apiClient";
import type {
  BoostedPost,
  BoostedPostApiResponse,
  BoostedPostDeliveryHealth,
  BoostedPostStatus,
  BoostedPostSummaryCard,
} from "../types/boostedPost";

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
    return apiClient.request<BoostedPostApiResponse[]>("/api/admin/boosted-posts", {
      defaultErrorMessage: "KhÃ´ng thá»ƒ táº£i danh sÃ¡ch chiáº¿n dá»‹ch Ä‘áº©y ná»•i báº­t.",
    });
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
    const deliveredQuota = posts.reduce(
      (sum, item) => sum + item.usedQuota,
      0,
    );
    const averageCtr = getAverageCtr(posts);

    return [
      {
        title: "Äang phÃ¢n phá»‘i",
        value: String(activeCount),
        subtitle: "Chiáº¿n dá»‹ch Ä‘ang hiá»ƒn thá»‹ trÃªn cÃ¡c vá»‹ trÃ­ Ä‘áº©y ná»•i báº­t",
      },
      {
        title: "ÄÃ£ lÃªn lá»‹ch",
        value: String(scheduledCount),
        subtitle: "Chiáº¿n dá»‹ch sáºµn sÃ ng cho khung phÃ¢n phá»‘i tiáº¿p theo",
      },
      {
        title: "Cáº§n rÃ  soÃ¡t",
        value: String(needsReviewCount),
        subtitle: "Chiáº¿n dá»‹ch Ä‘ang chá» kiá»ƒm tra ná»™i dung hoáº·c váº­n hÃ nh",
      },
      {
        title: "CÃ³ rá»§i ro",
        value: String(atRiskCount),
        subtitle: "Chiáº¿n dá»‹ch cÃ³ cháº¥t lÆ°á»£ng phÃ¢n phá»‘i dÆ°á»›i ngÆ°á»¡ng an toÃ n",
      },
      {
        title: "CTR TB / Quota Ä‘Ã£ dÃ¹ng",
        value: `${averageCtr} / ${deliveredQuota.toLocaleString("en-US")}`,
        subtitle: "áº¢nh chá»¥p nhanh hiá»‡u quáº£ váº­n hÃ nh trÃªn toÃ n bá»™ chiáº¿n dá»‹ch",
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
        defaultErrorMessage: "KhÃ´ng thá»ƒ cáº­p nháº­t tráº¡ng thÃ¡i chiáº¿n dá»‹ch Ä‘áº©y ná»•i báº­t.",
        body: JSON.stringify({ status }),
      },
    );

    return posts.map((item) => (item.id === postId ? updatedPost : item));
  },
};
