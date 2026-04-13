export type ActivitySeverity = "thấp" | "trung bình" | "cao";

export type ActivityRelatedIds = {
  userId: number | null;
  postId: number | null;
  shopId: number | null;
  slotId: number | null;
  categoryId: number | null;
};

export type ActivityLogItem = {
  id: number;
  eventType: string;
  occurredAt: string;
  occurredAtLabel: string;
  actorName: string;
  actorRole: string;
  moduleKey: string;
  moduleLabel: string;
  action: string;
  actionType: string;
  targetType: string;
  targetName: string;
  targetCode: string;
  result: string;
  severity: ActivitySeverity;
  detail: string;
  relatedIds: ActivityRelatedIds;
};
