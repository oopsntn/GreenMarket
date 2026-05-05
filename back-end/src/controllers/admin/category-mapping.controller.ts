import { Request, Response } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../../config/db";
import {
  attributes,
  categories,
  categoryAttributes,
  type NewCategoryAttribute,
} from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId";

type CategoryMappingPayload = {
  categoryId?: number;
  attributeId?: number;
  required?: boolean;
  displayOrder?: number;
};

type CategoryMappingStatusPayload = {
  status?: string;
};

const MAX_INTEGER_FIELD = 2_147_483_647;

const normalizeMappingStatus = (value: unknown): "Active" | "Disabled" => {
  return value === "Disabled" ? "Disabled" : "Active";
};

const parseBooleanFlag = (value: unknown): boolean | null => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return null;
};

const parseCompositeIds = (
  categoryIdParam: string,
  attributeIdParam: string,
) => {
  const categoryId = parseId(categoryIdParam);
  const attributeId = parseId(attributeIdParam);

  if (categoryId === null || attributeId === null) {
    return null;
  }

  return { categoryId, attributeId };
};

const parseCreateOrUpdatePayload = (body: CategoryMappingPayload) => {
  const categoryIdValue = body.categoryId;
  const attributeIdValue = body.attributeId;
  const displayOrderValue = body.displayOrder;
  const parsedRequired = parseBooleanFlag(body.required);

  if (
    typeof categoryIdValue !== "number" ||
    !Number.isInteger(categoryIdValue) ||
    typeof attributeIdValue !== "number" ||
    !Number.isInteger(attributeIdValue)
  ) {
    return {
      error: "Bắt buộc phải có mã danh mục và mã thuộc tính, đồng thời cả hai phải là số nguyên",
      
    } as const;
  }

  if (
    typeof displayOrderValue !== "number" ||
    !Number.isInteger(displayOrderValue) ||
    displayOrderValue < 1 ||
    displayOrderValue > MAX_INTEGER_FIELD
  ) {
    return {
      error:
        "Thứ tự hiển thị phải là số nguyên lớn hơn hoặc bằng 1 và không vượt quá 2.147.483.647",
    } as const;
  }

  if (parsedRequired === null && typeof body.required !== "undefined") {
    return {
      error: "Trạng thái bắt buộc không hợp lệ",
    } as const;
  }

  return {
    value: {
      categoryId: categoryIdValue,
      attributeId: attributeIdValue,
      displayOrder: displayOrderValue,
      required: parsedRequired ?? false,
    },
  } as const;
};

const hasDuplicateDisplayOrder = async (params: {
  categoryId: number;
  displayOrder: number;
  excludeAttributeId?: number;
}) => {
  const rows = await db
    .select({
      attributeId: categoryAttributes.attributeId,
    })
    .from(categoryAttributes)
    .where(
      and(
        eq(categoryAttributes.categoryId, params.categoryId),
        eq(categoryAttributes.displayOrder, params.displayOrder),
      ),
    )
    .limit(5);

  return rows.some(
    (row) =>
      params.excludeAttributeId === undefined ||
      row.attributeId !== params.excludeAttributeId,
  );
};

export const getCategoryMappings = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const rows = await db
      .select({
        categoryId: categoryAttributes.categoryId,
        attributeId: categoryAttributes.attributeId,
        required: categoryAttributes.required,
        displayOrder: categoryAttributes.displayOrder,
        status: categoryAttributes.status,
        categoryName: categories.categoryTitle,
        categorySlug: categories.categorySlug,
        attributeName: attributes.attributeTitle,
        attributeCode: attributes.attributeCode,
        attributeType: attributes.attributeDataType,
        attributeOptions: attributes.attributeOptions,
      })
      .from(categoryAttributes)
      .innerJoin(
        categories,
        eq(categoryAttributes.categoryId, categories.categoryId),
      )
      .innerJoin(
        attributes,
        eq(categoryAttributes.attributeId, attributes.attributeId),
      )
      .orderBy(
        asc(categoryAttributes.categoryId),
        asc(categoryAttributes.displayOrder),
        asc(categoryAttributes.attributeId),
      );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const createCategoryMapping = async (
  req: Request<{}, {}, CategoryMappingPayload>,
  res: Response,
): Promise<void> => {
  try {
    const parsed = parseCreateOrUpdatePayload(req.body);

    if ("error" in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const { categoryId, attributeId, displayOrder, required } = parsed.value;

    const [existingCategory] = await db
      .select({ categoryId: categories.categoryId })
      .from(categories)
      .where(eq(categories.categoryId, categoryId))
      .limit(1);

    if (!existingCategory) {
      res.status(404).json({ error: "Không tìm thấy danh mục" });
      return;
    }

    const [existingAttribute] = await db
      .select({ attributeId: attributes.attributeId })
      .from(attributes)
      .where(eq(attributes.attributeId, attributeId))
      .limit(1);

    if (!existingAttribute) {
      res.status(404).json({ error: "Không tìm thấy thuộc tính" });
      return;
    }

    const [duplicateMapping] = await db
      .select()
      .from(categoryAttributes)
      .where(
        and(
          eq(categoryAttributes.categoryId, categoryId),
          eq(categoryAttributes.attributeId, attributeId),
        ),
      )
      .limit(1);

    if (duplicateMapping) {
      res.status(409).json({
        error: "Danh mục này đã có thuộc tính được chọn",
      });
      return;
    }

    if (
      await hasDuplicateDisplayOrder({
        categoryId,
        displayOrder,
      })
    ) {
      res.status(409).json({
        error:
          "Thứ tự hiển thị này đã được dùng trong danh mục đã chọn. Vui lòng chọn thứ tự khác.",
      });
      return;
    }

    const newMapping: NewCategoryAttribute = {
      categoryId,
      attributeId,
      required,
      displayOrder,
      status: "Active",
    };

    const [createdMapping] = await db
      .insert(categoryAttributes)
      .values([newMapping])
      .returning();

    res.status(201).json(createdMapping);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const updateCategoryMapping = async (
  req: Request<
    { categoryId: string; attributeId: string },
    {},
    CategoryMappingPayload
  >,
  res: Response,
): Promise<void> => {
  try {
    const currentIds = parseCompositeIds(
      req.params.categoryId,
      req.params.attributeId,
    );

    if (!currentIds) {
      res.status(400).json({ error: "Mã danh mục hoặc mã thuộc tính không hợp lệ" });
      return;
    }

    const parsed = parseCreateOrUpdatePayload(req.body);

    if ("error" in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const { categoryId, attributeId, displayOrder, required } = parsed.value;

    const [currentMapping] = await db
      .select()
      .from(categoryAttributes)
      .where(
        and(
          eq(categoryAttributes.categoryId, currentIds.categoryId),
          eq(categoryAttributes.attributeId, currentIds.attributeId),
        ),
      )
      .limit(1);

    if (!currentMapping) {
      res.status(404).json({ error: "Không tìm thấy ánh xạ danh mục - thuộc tính" });
      return;
    }

    const [existingCategory] = await db
      .select({ categoryId: categories.categoryId })
      .from(categories)
      .where(eq(categories.categoryId, categoryId))
      .limit(1);

    if (!existingCategory) {
      res.status(404).json({ error: "Không tìm thấy danh mục" });
      return;
    }

    const [existingAttribute] = await db
      .select({ attributeId: attributes.attributeId })
      .from(attributes)
      .where(eq(attributes.attributeId, attributeId))
      .limit(1);

    if (!existingAttribute) {
      res.status(404).json({ error: "Không tìm thấy thuộc tính" });
      return;
    }

    const isChangingCompositeKey =
      currentIds.categoryId !== categoryId ||
      currentIds.attributeId !== attributeId;

    if (isChangingCompositeKey) {
      const [duplicateMapping] = await db
        .select()
        .from(categoryAttributes)
        .where(
          and(
            eq(categoryAttributes.categoryId, categoryId),
            eq(categoryAttributes.attributeId, attributeId),
          ),
        )
        .limit(1);

      if (duplicateMapping) {
        res.status(409).json({
          error: "Danh mục này đã có thuộc tính được chọn",
        });
        return;
      }

      if (
        await hasDuplicateDisplayOrder({
          categoryId,
          displayOrder,
          excludeAttributeId: currentIds.attributeId,
        })
      ) {
        res.status(409).json({
          error:
            "Thứ tự hiển thị này đã được dùng trong danh mục đã chọn. Vui lòng chọn thứ tự khác.",
        });
        return;
      }

      await db
        .delete(categoryAttributes)
        .where(
          and(
            eq(categoryAttributes.categoryId, currentIds.categoryId),
            eq(categoryAttributes.attributeId, currentIds.attributeId),
          ),
        );

      const recreatedMapping: NewCategoryAttribute = {
        categoryId,
        attributeId,
        required,
        displayOrder,
        status: currentMapping.status ?? "Active",
      };

      const [newMapping] = await db
        .insert(categoryAttributes)
        .values([recreatedMapping])
        .returning();

      res.json(newMapping);
      return;
    }

    if (
      await hasDuplicateDisplayOrder({
        categoryId,
        displayOrder,
        excludeAttributeId: currentIds.attributeId,
      })
    ) {
      res.status(409).json({
        error:
          "Thứ tự hiển thị này đã được dùng trong danh mục đã chọn. Vui lòng chọn thứ tự khác.",
      });
      return;
    }

    const [updatedMapping] = await db
      .update(categoryAttributes)
      .set({
        required,
        displayOrder,
      })
      .where(
        and(
          eq(categoryAttributes.categoryId, currentIds.categoryId),
          eq(categoryAttributes.attributeId, currentIds.attributeId),
        ),
      )
      .returning();

    if (!updatedMapping) {
      res.status(404).json({ error: "Không tìm thấy ánh xạ danh mục - thuộc tính" });
      return;
    }

    res.json(updatedMapping);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const updateCategoryMappingStatus = async (
  req: Request<
    { categoryId: string; attributeId: string },
    {},
    CategoryMappingStatusPayload
  >,
  res: Response,
): Promise<void> => {
  try {
    const ids = parseCompositeIds(
      req.params.categoryId,
      req.params.attributeId,
    );

    if (!ids) {
      res.status(400).json({ error: "Mã danh mục hoặc mã thuộc tính không hợp lệ" });
      return;
    }

    const nextStatus = normalizeMappingStatus(req.body.status);

    const [updatedMapping] = await db
      .update(categoryAttributes)
      .set({
        status: nextStatus,
      })
      .where(
        and(
          eq(categoryAttributes.categoryId, ids.categoryId),
          eq(categoryAttributes.attributeId, ids.attributeId),
        ),
      )
      .returning();

    if (!updatedMapping) {
      res.status(404).json({ error: "Không tìm thấy ánh xạ danh mục - thuộc tính" });
      return;
    }

    res.json(updatedMapping);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const deleteCategoryMapping = async (
  req: Request<{ categoryId: string; attributeId: string }>,
  res: Response,
): Promise<void> => {
  try {
    const ids = parseCompositeIds(
      req.params.categoryId,
      req.params.attributeId,
    );

    if (!ids) {
      res.status(400).json({ error: "Mã danh mục hoặc mã thuộc tính không hợp lệ" });
      return;
    }

    const [deletedMapping] = await db
      .delete(categoryAttributes)
      .where(
        and(
          eq(categoryAttributes.categoryId, ids.categoryId),
          eq(categoryAttributes.attributeId, ids.attributeId),
        ),
      )
      .returning();

    if (!deletedMapping) {
      res.status(404).json({ error: "Không tìm thấy ánh xạ danh mục - thuộc tính" });
      return;
    }

    res.json({
      message: "Xóa ánh xạ danh mục - thuộc tính thành công",
      deletedMapping,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};
