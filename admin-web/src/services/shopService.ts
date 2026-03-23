import { initialShops } from "../mock-data/shops";
import type { Shop, ShopStatus } from "../types/shop";

export const shopService = {
  getShops(): Shop[] {
    return initialShops;
  },

  updateShopStatus(shops: Shop[], shopId: number, status: ShopStatus): Shop[] {
    return shops.map((shop) =>
      shop.id === shopId ? { ...shop, status } : shop,
    );
  },
};
