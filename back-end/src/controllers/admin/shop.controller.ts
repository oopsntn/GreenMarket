import { Request, Response } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { posts } from "../../models/schema/posts.ts";
import { shops, type NewShop } from "../../models/schema/shops.ts";
import { users } from "../../models/schema/users.ts";
import { parseId } from "../../utils/parseId.ts";

type AdminShopStatus = "Pending" | "Active" | "Suspended" | "Rejected";
type DbShopStatus = "pending" | "active" | "blocked" | "closed";

type AdminShopResponse = {
  id: number;
  name: string;
  ownerName: string;
  ownerEmail: string;
  totalPosts: number;
  status: AdminShopStatus;
  createdAt: string;
  description: string;
};

const mapDbStatusToAdminStatus = (status: string | null): AdminShopStatus => {
  switch (status) {
    case "active":
      return "Active";
    case "blocked":
      return "Suspended";
    case "closed":
      return "Rejected";
    case "pending":
    default:
      return "Pending";
  }
};

const mapRequestStatusToDbStatus = (status: string): DbShopStatus | null => {
  switch (status) {
    case "Pending":
    case "pending":
      return "pending";
    case "Active":
    case "active":
      return "active";
    case "Suspended":
    case "suspended":
    case "blocked":
      return "blocked";
    case "Rejected":
    case "rejected":
    case "closed":
      return "closed";
    default:
      return null;
  }
};

const formatDate = (value: Date | string | null | undefined): string => {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const mapRowToAdminShop = (row: {
  shopId: number;
  shopName: string;
  shopDescription: string | null;
  shopStatus: string | null;
  shopCreatedAt: Date | null;
  ownerName: string | null;
  ownerEmail: string | null;
  totalPosts: number;
}): AdminShopResponse => {
  return {
    id: row.shopId,
    name: row.shopName,
    ownerName: row.ownerName?.trim() || "Chưa có chủ sở hữu",
    ownerEmail: row.ownerEmail ?? "",
    totalPosts: Number(row.totalPosts ?? 0),
    status: mapDbStatusToAdminStatus(row.shopStatus),
    createdAt: formatDate(row.shopCreatedAt),
    description: row.shopDescription ?? "",
  };
};

export const getShops = async (req: Request, res: Response): Promise<void> => {
  try {
    const shopRows = await db
      .select({
        shopId: shops.shopId,
        shopName: shops.shopName,
        shopDescription: shops.shopDescription,
        shopStatus: shops.shopStatus,
        shopCreatedAt: shops.shopCreatedAt,
        ownerName: users.userDisplayName,
        ownerEmail: users.userEmail,
        totalPosts: sql<number>`count(${posts.postId})`,
      })
      .from(shops)
      .leftJoin(users, eq(shops.shopId, users.userId))
      .leftJoin(posts, eq(posts.postShopId, shops.shopId))
      .groupBy(
        shops.shopId,
        shops.shopName,
        shops.shopDescription,
        shops.shopStatus,
        shops.shopCreatedAt,
        users.userDisplayName,
        users.userEmail,
      )
      .orderBy(shops.shopId);

    const formattedShops = shopRows.map(mapRowToAdminShop);
    res.json(formattedShops);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const createShop = async (
  req: Request<{}, {}, NewShop>,
  res: Response,
): Promise<void> => {
  try {
    const shopData = req.body;
    const [newShop] = await db.insert(shops).values(shopData).returning();
    res.status(201).json(newShop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const getShopById = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const idNumber = parseId(req.params.id);
    if (idNumber === null) {
      res.status(400).json({ error: "Mã cửa hàng không hợp lệ" });
      return;
    }

    const [shopRow] = await db
      .select({
        shopId: shops.shopId,
        shopName: shops.shopName,
        shopDescription: shops.shopDescription,
        shopStatus: shops.shopStatus,
        shopCreatedAt: shops.shopCreatedAt,
        ownerName: users.userDisplayName,
        ownerEmail: users.userEmail,
        totalPosts: sql<number>`count(${posts.postId})`,
      })
      .from(shops)
      .leftJoin(users, eq(shops.shopId, users.userId))
      .leftJoin(posts, eq(posts.postShopId, shops.shopId))
      .where(eq(shops.shopId, idNumber))
      .groupBy(
        shops.shopId,
        shops.shopName,
        shops.shopDescription,
        shops.shopStatus,
        shops.shopCreatedAt,
        users.userDisplayName,
        users.userEmail,
      )
      .limit(1);

    if (!shopRow) {
      res.status(404).json({ error: "Không tìm thấy cửa hàng" });
      return;
    }

    res.json(mapRowToAdminShop(shopRow));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const updateShopStatus = async (
  req: Request<{ id: string }, {}, { status: string }>,
  res: Response,
): Promise<void> => {
  try {
    const idNumber = parseId(req.params.id);
    if (idNumber === null) {
      res.status(400).json({ error: "Mã cửa hàng không hợp lệ" });
      return;
    }

    const nextDbStatus = mapRequestStatusToDbStatus(req.body.status);
    if (!nextDbStatus) {
      res.status(400).json({ error: "Trạng thái cửa hàng không hợp lệ" });
      return;
    }

    const [updatedShop] = await db
      .update(shops)
      .set({
        shopStatus: nextDbStatus,
        shopUpdatedAt: new Date(),
      })
      .where(eq(shops.shopId, idNumber))
      .returning();

    if (!updatedShop) {
      res.status(404).json({ error: "Không tìm thấy cửa hàng" });
      return;
    }

    let postsAssigned = 0;
    if (nextDbStatus === "active") {
      const { rowCount } = await db
        .update(posts)
        .set({
          postShopId: updatedShop.shopId,
          postUpdatedAt: new Date(),
        })
        .where(eq(posts.postAuthorId, updatedShop.shopId));

      postsAssigned = rowCount ?? 0;
    }

    const [shopRow] = await db
      .select({
        shopId: shops.shopId,
        shopName: shops.shopName,
        shopDescription: shops.shopDescription,
        shopStatus: shops.shopStatus,
        shopCreatedAt: shops.shopCreatedAt,
        ownerName: users.userDisplayName,
        ownerEmail: users.userEmail,
        totalPosts: sql<number>`count(${posts.postId})`,
      })
      .from(shops)
      .leftJoin(users, eq(shops.shopId, users.userId))
      .leftJoin(posts, eq(posts.postShopId, shops.shopId))
      .where(eq(shops.shopId, idNumber))
      .groupBy(
        shops.shopId,
        shops.shopName,
        shops.shopDescription,
        shops.shopStatus,
        shops.shopCreatedAt,
        users.userDisplayName,
        users.userEmail,
      )
      .limit(1);

    if (!shopRow) {
      res.status(404).json({ error: "Không tìm thấy cửa hàng sau khi cập nhật" });
      return;
    }

    res.json({
      message: "Cập nhật trạng thái cửa hàng thành công",
      shop: mapRowToAdminShop(shopRow),
      postsAssigned,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const deleteShop = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const idNumber = parseId(req.params.id);
    if (idNumber === null) {
      res.status(400).json({ error: "Mã cửa hàng không hợp lệ" });
      return;
    }

    const [deletedShop] = await db
      .delete(shops)
      .where(eq(shops.shopId, idNumber))
      .returning();

    if (!deletedShop) {
      res.status(404).json({ error: "Không tìm thấy cửa hàng" });
      return;
    }

    res.json({ message: "Xóa cửa hàng thành công", deletedShop });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const verifyShop = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const idNumber = parseId(req.params.id);
    if (idNumber === null) {
      res.status(400).json({ error: "Mã cửa hàng không hợp lệ" });
      return;
    }

    const [updatedShop] = await db
      .update(shops)
      .set({
        shopStatus: "active",
        shopUpdatedAt: new Date(),
      })
      .where(eq(shops.shopId, idNumber))
      .returning();

    if (!updatedShop) {
      res.status(404).json({ error: "Không tìm thấy cửa hàng" });
      return;
    }

    const { rowCount } = await db
      .update(posts)
      .set({
        postShopId: updatedShop.shopId,
        postUpdatedAt: new Date(),
      })
      .where(eq(posts.postAuthorId, updatedShop.shopId));

    const [shopRow] = await db
      .select({
        shopId: shops.shopId,
        shopName: shops.shopName,
        shopDescription: shops.shopDescription,
        shopStatus: shops.shopStatus,
        shopCreatedAt: shops.shopCreatedAt,
        ownerName: users.userDisplayName,
        ownerEmail: users.userEmail,
        totalPosts: sql<number>`count(${posts.postId})`,
      })
      .from(shops)
      .leftJoin(users, eq(shops.shopId, users.userId))
      .leftJoin(posts, eq(posts.postShopId, shops.shopId))
      .where(eq(shops.shopId, idNumber))
      .groupBy(
        shops.shopId,
        shops.shopName,
        shops.shopDescription,
        shops.shopStatus,
        shops.shopCreatedAt,
        users.userDisplayName,
        users.userEmail,
      )
      .limit(1);

    if (!shopRow) {
      res.status(404).json({ error: "Không tìm thấy cửa hàng sau khi xác minh" });
      return;
    }

    res.json({
      message: "Xác minh cửa hàng thành công",
      shop: mapRowToAdminShop(shopRow),
      postsAssigned: rowCount ?? 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};
