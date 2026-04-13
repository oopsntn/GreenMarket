import { Request, Response } from "express";
import { asc, eq } from "drizzle-orm";
import { db } from "../../config/db";
import { AuthRequest } from "../../dtos/auth";
import {
  eventLogs,
  placementSlots,
  type NewPlacementSlot,
  promotionPackages,
} from "../../models/schema/index.ts";
import { type PlacementSlotParams } from "../../dtos/promotion";
import { parseId } from "../../utils/parseId";

const normalizeText = (value: string | null | undefined) =>
  (value ?? "").trim();

const validatePlacementSlotPayload = async (
  payload: Partial<NewPlacementSlot>,
  excludeId?: number,
): Promise<string | null> => {
  const placementSlotCode = normalizeText(payload.placementSlotCode);
  const placementSlotTitle = normalizeText(payload.placementSlotTitle);
  const placementSlotCapacity = payload.placementSlotCapacity;
  const placementSlotRules = payload.placementSlotRules as
    | Record<string, unknown>
    | null
    | undefined;

  if (!placementSlotCode) {
    return "placementSlotCode is required";
  }

  if (!placementSlotTitle) {
    return "placementSlotTitle is required";
  }

  if (
    typeof placementSlotCapacity !== "number" ||
    !Number.isFinite(placementSlotCapacity) ||
    placementSlotCapacity < 1
  ) {
    return "placementSlotCapacity must be a number greater than or equal to 1";
  }

  const priority = placementSlotRules?.priority;
  if (
    priority !== undefined &&
    (typeof priority !== "number" || !Number.isFinite(priority) || priority < 1)
  ) {
    return "placementSlotRules.priority must be a number greater than or equal to 1";
  }

  const allSlots = await db.select().from(placementSlots);

  const duplicatedCode = allSlots.some((slot) => {
    if (excludeId !== undefined && slot.placementSlotId === excludeId) {
      return false;
    }

    return (
      normalizeText(slot.placementSlotCode).toLowerCase() ===
      placementSlotCode.toLowerCase()
    );
  });

  if (duplicatedCode) {
    return "placementSlotCode already exists";
  }

  const duplicatedTitle = allSlots.some((slot) => {
    if (excludeId !== undefined && slot.placementSlotId === excludeId) {
      return false;
    }

    return (
      normalizeText(slot.placementSlotTitle).toLowerCase() ===
      placementSlotTitle.toLowerCase()
    );
  });

  if (duplicatedTitle) {
    return "placementSlotTitle already exists";
  }

  return null;
};

const buildPlacementSlotPayload = (
  payload: Partial<NewPlacementSlot>,
): Partial<NewPlacementSlot> => {
  const placementSlotRules =
    payload.placementSlotRules &&
    typeof payload.placementSlotRules === "object" &&
    !Array.isArray(payload.placementSlotRules)
      ? payload.placementSlotRules
      : {};

  return {
    placementSlotCode: normalizeText(payload.placementSlotCode),
    placementSlotTitle: normalizeText(payload.placementSlotTitle),
    placementSlotCapacity: payload.placementSlotCapacity,
    placementSlotPublished: payload.placementSlotPublished ?? false,
    placementSlotRules,
  };
};

const logPlacementSlotEvent = async (params: {
  slotId: number;
  action: string;
  detail: string;
  performedBy?: string | null;
  result?: string;
}) => {
  await db.insert(eventLogs).values({
    eventLogUserId: null,
    eventLogSlotId: params.slotId,
    eventLogEventType: "admin_slot_updated",
    eventLogEventTime: new Date(),
    eventLogMeta: {
      action: params.action,
      detail: params.detail,
      performedBy: params.performedBy?.trim() || "Quản trị viên hệ thống",
      actorRole: "Quản trị viên",
      moduleLabel: "Vị trí hiển thị",
      targetType: "Vị trí hiển thị",
      result: params.result ?? "Thành công",
    },
  });
};

export const getPlacementSlots = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const allSlots = await db
      .select()
      .from(placementSlots)
      .orderBy(asc(placementSlots.placementSlotId));

    res.json(allSlots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const getPlacementSlotById = async (
  req: Request<PlacementSlotParams>,
  res: Response,
): Promise<void> => {
  try {
    const idNumber = parseId(req.params.id);

    if (idNumber === null) {
      res.status(400).json({ error: "Mã vị trí hiển thị không hợp lệ" });
      return;
    }

    const [slot] = await db
      .select()
      .from(placementSlots)
      .where(eq(placementSlots.placementSlotId, idNumber))
      .limit(1);

    if (!slot) {
      res.status(404).json({ error: "Không tìm thấy vị trí hiển thị" });
      return;
    }

    res.json(slot);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const createPlacementSlot = async (
  req: AuthRequest & Request<{}, {}, NewPlacementSlot>,
  res: Response,
): Promise<void> => {
  try {
    const validationError = await validatePlacementSlotPayload(req.body);

    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const payload = buildPlacementSlotPayload(req.body);

    const [newSlot] = await db
      .insert(placementSlots)
      .values(payload)
      .returning();

    await logPlacementSlotEvent({
      slotId: newSlot.placementSlotId,
      action: "Tạo vị trí hiển thị",
      detail: `Đã tạo vị trí "${newSlot.placementSlotTitle}" với mã ${newSlot.placementSlotCode}.`,
      performedBy: req.user?.email ?? null,
    });

    res.status(201).json(newSlot);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const updatePlacementSlot = async (
  req: AuthRequest &
    Request<PlacementSlotParams, {}, Partial<NewPlacementSlot>>,
  res: Response,
): Promise<void> => {
  try {
    const idNumber = parseId(req.params.id);

    if (idNumber === null) {
      res.status(400).json({ error: "Mã vị trí hiển thị không hợp lệ" });
      return;
    }

    const [existingSlot] = await db
      .select()
      .from(placementSlots)
      .where(eq(placementSlots.placementSlotId, idNumber))
      .limit(1);

    if (!existingSlot) {
      res.status(404).json({ error: "Không tìm thấy vị trí hiển thị" });
      return;
    }

    const mergedPayload: Partial<NewPlacementSlot> = {
      placementSlotCode:
        req.body.placementSlotCode ?? existingSlot.placementSlotCode,
      placementSlotTitle:
        req.body.placementSlotTitle ?? existingSlot.placementSlotTitle,
      placementSlotCapacity:
        req.body.placementSlotCapacity ?? existingSlot.placementSlotCapacity,
      placementSlotPublished:
        req.body.placementSlotPublished ?? existingSlot.placementSlotPublished,
      placementSlotRules:
        req.body.placementSlotRules ?? existingSlot.placementSlotRules,
    };

    const validationError = await validatePlacementSlotPayload(
      mergedPayload,
      idNumber,
    );

    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const payload = buildPlacementSlotPayload(mergedPayload);

    const [updatedSlot] = await db
      .update(placementSlots)
      .set(payload)
      .where(eq(placementSlots.placementSlotId, idNumber))
      .returning();

    await logPlacementSlotEvent({
      slotId: updatedSlot.placementSlotId,
      action:
        existingSlot.placementSlotPublished !== updatedSlot.placementSlotPublished
          ? updatedSlot.placementSlotPublished
            ? "Bật vị trí hiển thị"
            : "Tắt vị trí hiển thị"
          : "Cập nhật vị trí hiển thị",
      detail: `Đã cập nhật vị trí "${updatedSlot.placementSlotTitle}" với sức chứa ${updatedSlot.placementSlotCapacity}.`,
      performedBy: req.user?.email ?? null,
    });

    res.json(updatedSlot);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const deletePlacementSlot = async (
  req: Request<PlacementSlotParams>,
  res: Response,
): Promise<void> => {
  try {
    const idNumber = parseId(req.params.id);

    if (idNumber === null) {
      res.status(400).json({ error: "Mã vị trí hiển thị không hợp lệ" });
      return;
    }

    const linkedPackages = await db
      .select()
      .from(promotionPackages)
      .where(eq(promotionPackages.promotionPackageSlotId, idNumber))
      .limit(1);

    if (linkedPackages.length > 0) {
      res.status(400).json({
        error: "Không thể xóa vị trí đang được gắn với gói quảng bá",
      });
      return;
    }

    const [slot] = await db
      .delete(placementSlots)
      .where(eq(placementSlots.placementSlotId, idNumber))
      .returning();

    if (!slot) {
      res.status(404).json({ error: "Không tìm thấy vị trí hiển thị" });
      return;
    }

    res.json({
      message: "Xóa vị trí hiển thị thành công",
      slot,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};
