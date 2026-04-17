import type { RevenueCard, RevenueRow } from "../types/revenue";

export const revenueCards: RevenueCard[] = [
  {
    title: "Doanh thu gói đẩy bài",
    value: "427,000 VND",
    note: "Tổng thu từ 3 vị trí trang chủ trong kỳ mẫu",
  },
  {
    title: "Gói đang bán",
    value: "3",
    note: "Ba gói vị trí 1, 2, 3 đang mở bán",
  },
  {
    title: "Đơn đang hiệu lực",
    value: "3",
    note: "Đang có 3 chiến dịch còn thời hạn",
  },
  {
    title: "Slot doanh thu cao nhất",
    value: "Vị trí 1 trang chủ",
    note: "299,000 VND trong kỳ mẫu",
  },
];

export const revenueRows: RevenueRow[] = [
  {
    id: 1,
    packageName: "Gói đẩy bài theo tháng vị trí 1 trang chủ",
    slot: "Vị trí 1 trang chủ",
    orders: 1,
    revenue: "299,000 VND",
  },
  {
    id: 2,
    packageName: "Gói đẩy bài theo tháng vị trí 2 trang chủ",
    slot: "Vị trí 2 trang chủ",
    orders: 1,
    revenue: "99,000 VND",
  },
  {
    id: 3,
    packageName: "Gói đẩy bài theo tháng vị trí 3 trang chủ",
    slot: "Vị trí 3 trang chủ",
    orders: 1,
    revenue: "29,000 VND",
  },
];
