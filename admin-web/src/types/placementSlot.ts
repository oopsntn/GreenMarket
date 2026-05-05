export type PlacementSlotScope = "Homepage" | "Category" | "Search";
export type PlacementDisplayRule =
  | "Round Robin"
  | "First Purchased First Served"
  | "Random"
  | "Priority Score";

export const HOMEPAGE_BOOST_SLOT_CODE_PREFIX = "BOOST_POST";
export const SHOP_VIP_SLOT_CODE = "SHOP_VIP";
const HOMEPAGE_BOOST_SLOT_CODE_PATTERN = /^BOOST_POST(?:_\d+)?$/i;

export const isHomepageBoostSlotCode = (code?: string | null) => {
  const normalizedCode = code?.trim().toUpperCase();
  return Boolean(
    normalizedCode &&
      normalizedCode.startsWith(HOMEPAGE_BOOST_SLOT_CODE_PREFIX),
  );
};

export const isStrictHomepageBoostSlotCode = (code?: string | null) =>
  HOMEPAGE_BOOST_SLOT_CODE_PATTERN.test(code?.trim() || "");

export type PlacementSlotStatus = "Active" | "Disabled";

export type PlacementSlot = {
  id: number;
  name: string;
  scope: PlacementSlotScope;
  positionCode: string;
  capacity: number;
  displayRule: PlacementDisplayRule;
  priority: number;
  status: PlacementSlotStatus;
  notes: string;
};

export type PlacementSlotApiResponse = {
  placementSlotId: number;
  placementSlotCode: string | null;
  placementSlotTitle: string | null;
  placementSlotCapacity: number | null;
  placementSlotRules: Record<string, unknown> | null;
  placementSlotPublished: boolean | null;
  placementSlotCreatedAt?: string | null;
};

export type PlacementSlotFormState = {
  name: string;
  scope: PlacementSlotScope;
  positionCode: string;
  capacity: number;
  displayRule: PlacementDisplayRule;
  priority: number;
  notes: string;
};

export type PlacementSlotSummaryCard = {
  title: string;
  value: string;
  subtitle: string;
};
