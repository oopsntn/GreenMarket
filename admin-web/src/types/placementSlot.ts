export type PlacementSlotScope = "Homepage" | "Category" | "Search";
export type PlacementDisplayRule =
  | "Round Robin"
  | "First Purchased First Served"
  | "Random"
  | "Priority Score";

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
