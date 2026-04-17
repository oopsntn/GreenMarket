import type {
  PromotionPackage,
  PromotionPackageFormState,
} from "../types/promotionPackage";

export const initialPromotionPackages: PromotionPackage[] = [
  {
    id: 1,
    name: "Gói đẩy bài theo tháng vị trí 2 trang chủ",
    slot: "Vị trí 2 trang chủ",
    slotCode: "BOOST_POST_2",
    durationDays: 30,
    price: "99,000 VND",
    maxPosts: 1,
    displayQuota: 35000,
    status: "Active",
    description:
      "Gói đẩy bài dùng cho vị trí 2 trên trang chủ, phù hợp chiến dịch cần mức ưu tiên trung bình.",
  },
  {
    id: 2,
    name: "Gói đẩy bài theo tháng vị trí 1 trang chủ",
    slot: "Vị trí 1 trang chủ",
    slotCode: "BOOST_POST",
    durationDays: 30,
    price: "299,000 VND",
    maxPosts: 1,
    displayQuota: 180000,
    status: "Active",
    description:
      "Gói đẩy bài ưu tiên cao nhất cho vị trí 1 trên trang chủ, phù hợp bài cần kéo hiển thị mạnh.",
  },
  {
    id: 3,
    name: "Gói đẩy bài theo tháng vị trí 3 trang chủ",
    slot: "Vị trí 3 trang chủ",
    slotCode: "BOOST_POST_3",
    durationDays: 30,
    price: "29,000 VND",
    maxPosts: 1,
    displayQuota: 5000,
    status: "Active",
    description:
      "Gói đẩy bài chi phí thấp cho vị trí 3 trên trang chủ, phù hợp nhu cầu thử nghiệm hiển thị.",
  },
];

export const emptyPromotionPackageForm: PromotionPackageFormState = {
  name: "",
  slot: "Vị trí 1 trang chủ",
  durationDays: 30,
  price: "",
  maxPosts: 1,
  displayQuota: 10000,
  description: "",
};
