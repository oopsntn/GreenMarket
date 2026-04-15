export type PromotionSlot = string;
export type PromotionStatus =
  | "Scheduled"
  | "Active"
  | "Paused"
  | "Completed"
  | "Expired";
export type PromotionPaymentStatus = "Paid" | "Pending Verification";
export type PromotionHandledBy = "Manager" | "Admin";

export type PromotionPackageActionPayload = {
  packageId: number;
  packageName: string;
  slot: PromotionSlot;
  startDate: string;
  endDate: string;
  budget: string;
  paymentStatus: PromotionPaymentStatus;
  adminNote: string;
};

export type Promotion = {
  id: number;
  postId: number;
  postTitle: string;
  owner: string;
  packageId: number;
  slot: PromotionSlot;
  packageName: string;
  startDate: string;
  endDate: string;
  status: PromotionStatus;
  budget: string;
  note: string;
  paymentStatus: PromotionPaymentStatus;
  handledBy: PromotionHandledBy;
  reopenEligible: boolean;
  canPause: boolean;
  canResume: boolean;
  pauseBlockedReason?: string;
  resumeBlockedReason?: string;
  reopenBlockedReason?: string;
  warnings: string[];
};

export type PromotionApiResponse = Promotion;

export type PromotionSummaryCard = {
  title: string;
  value: string;
  subtitle: string;
};
