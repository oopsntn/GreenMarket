import type { Shop } from "../types/shop";

export const initialShops: Shop[] = [
  {
    id: 1,
    name: "Green Leaf Corner",
    ownerName: "Nguyen Van A",
    ownerEmail: "vana@greenmarket.vn",
    totalPosts: 12,
    status: "Active",
    createdAt: "2026-03-10",
    description:
      "A specialty plant shop focusing on indoor plants, decorative pots, and beginner-friendly care guides.",
  },
  {
    id: 2,
    name: "Bonsai Home",
    ownerName: "Tran Thi B",
    ownerEmail: "thib@greenmarket.vn",
    totalPosts: 8,
    status: "Pending",
    createdAt: "2026-03-11",
    description:
      "A curated bonsai store offering premium miniature trees, pruning tools, and maintenance support.",
  },
  {
    id: 3,
    name: "Succulent Garden",
    ownerName: "Le Van C",
    ownerEmail: "vanc@greenmarket.vn",
    totalPosts: 15,
    status: "Suspended",
    createdAt: "2026-03-12",
    description:
      "A succulent-focused shop with themed combo sets, terrarium kits, and seasonal offers.",
  },
  {
    id: 4,
    name: "Mini Plant House",
    ownerName: "Pham Thi D",
    ownerEmail: "thid@greenmarket.vn",
    totalPosts: 4,
    status: "Rejected",
    createdAt: "2026-03-13",
    description:
      "A small plant startup shop currently under review for profile and product information completeness.",
  },
];
