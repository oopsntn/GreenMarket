import type {
  PlacementSlot,
  PlacementSlotFormState,
} from "../types/placementSlot";

export const initialPlacementSlots: PlacementSlot[] = [
  {
    id: 1,
    name: "Homepage Top Hero",
    scope: "Homepage",
    positionCode: "HOME_TOP_01",
    capacity: 3,
    displayRule: "Round Robin",
    priority: 1,
    status: "Active",
    notes:
      "Main premium slot at the top of homepage for the most visible boosted posts.",
  },
  {
    id: 2,
    name: "Category Header Spotlight",
    scope: "Category",
    positionCode: "CATEGORY_TOP_01",
    capacity: 2,
    displayRule: "First Purchased First Served",
    priority: 2,
    status: "Active",
    notes: "Shows promoted posts at the top of each category result page.",
  },
  {
    id: 3,
    name: "Search Result Boost",
    scope: "Search",
    positionCode: "SEARCH_BOOST_01",
    capacity: 5,
    displayRule: "Priority Score",
    priority: 3,
    status: "Disabled",
    notes:
      "Reserved for search-based ranking boosts when package campaigns are active.",
  },
];

export const emptyPlacementSlotForm: PlacementSlotFormState = {
  name: "",
  scope: "Homepage",
  positionCode: "",
  capacity: 1,
  displayRule: "Round Robin",
  priority: 1,
  notes: "",
};
