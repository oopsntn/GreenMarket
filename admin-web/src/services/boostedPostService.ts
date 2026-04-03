import { initialBoostedPosts } from "../mock-data/boostedPosts";
import type {
  BoostedPost,
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
  getBoostedPosts(): BoostedPost[] {
    return initialBoostedPosts;
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
        title: "Live Delivery",
        value: String(activeCount),
        subtitle: "Campaigns currently serving boosted placements",
      },
      {
        title: "Queued Campaigns",
        value: String(scheduledCount),
        subtitle: "Prepared for the next delivery window",
      },
      {
        title: "Needs Review",
        value: String(needsReviewCount),
        subtitle: "Campaigns waiting for content or operations follow-up",
      },
      {
        title: "At Risk",
        value: String(atRiskCount),
        subtitle: "Delivery health currently below the safe threshold",
      },
      {
        title: "Avg. CTR / Used Quota",
        value: `${averageCtr} / ${deliveredQuota.toLocaleString("en-US")}`,
        subtitle: "Operational performance snapshot across boosted delivery",
      },
    ];
  },

  updateBoostedPostStatus(
    posts: BoostedPost[],
    postId: number,
    status: BoostedPostStatus,
  ): BoostedPost[] {
    return posts.map((item) =>
      item.id === postId ? { ...item, status } : item,
    );
  },
};
