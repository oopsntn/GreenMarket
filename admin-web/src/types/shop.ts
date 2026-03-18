export type ShopStatus = "Pending" | "Active" | "Suspended" | "Rejected";

export type Shop = {
  id: number;
  name: string;
  ownerName: string;
  ownerEmail: string;
  totalPosts: number;
  status: ShopStatus;
  createdAt: string;
  description: string;
};
