import { Request, Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import {
  adminTemplates,
  type AdminTemplate,
} from "../../models/schema/admin-templates.ts";
import { eventLogs, users } from "../../models/schema/index.ts";
import { adminConfigStoreService } from "../../services/adminConfigStore.service.ts";
import { parseId } from "../../utils/parseId.ts";

const TEMPLATE_METADATA_KEY = "admin_template_metadata_map";

const templateTypes = [
  "Rejection Reason",
  "Report Reason",
  "Notification",
] as const;

const templateStatuses = ["Active", "Disabled"] as const;

type TemplateType = (typeof templateTypes)[number];
type TemplateStatus = (typeof templateStatuses)[number];

type TemplatePayload = {
  templateName?: string;
  templateType?: string;
  templateContent?: string;
  status?: string;
  templateStatus?: string;
  description?: string;
  usageNote?: string;
};

type TemplateMetadata = {
  description: string;
  usageNote: string;
};

type TemplateMetadataMap = Record<string, TemplateMetadata>;

const seedTemplates: Array<{
  templateName: string;
  templateType: TemplateType;
  templateContent: string;
  templateStatus: TemplateStatus;
  description: string;
  usageNote: string;
}> = [
  {
    templateName: "Từ chối bài đăng thiếu thông tin",
    templateType: "Rejection Reason",
    templateContent:
      "Bài đăng của bạn đang thiếu một số thông tin bắt buộc như tiêu đề rõ ràng, mô tả chi tiết hoặc hình ảnh phù hợp. Vui lòng bổ sung và gửi duyệt lại.",
    templateStatus: "Active",
    description:
      "Mẫu từ chối dùng cho bài đăng còn thiếu nội dung cơ bản trước khi được duyệt.",
    usageNote:
      "Dùng khi bài đăng thiếu thông tin bắt buộc nhưng vẫn có thể chỉnh sửa và gửi lại.",
  },
  {
    templateName: "Báo cáo có dấu hiệu spam",
    templateType: "Report Reason",
    templateContent:
      "Nội dung bị báo cáo có dấu hiệu spam, gây hiểu nhầm hoặc lặp lại quá nhiều. Đội ngũ quản trị cần rà soát thêm trước khi quyết định bước xử lý tiếp theo.",
    templateStatus: "Active",
    description:
      "Mẫu giải thích ngắn cho nhóm xử lý báo cáo khi nội dung có dấu hiệu spam.",
    usageNote:
      "Dùng để ghi nhận hoặc phản hồi các trường hợp báo cáo liên quan tới spam và nội dung gây nhiễu.",
  },
  {
    templateName: "Thông báo cập nhật trạng thái xử lý",
    templateType: "Notification",
    templateContent:
      "GreenMarket đã cập nhật trạng thái xử lý cho nội dung liên quan của bạn. Vui lòng mở trung tâm thông báo để xem chi tiết và hướng dẫn tiếp theo.",
    templateStatus: "Active",
    description:
      "Mẫu thông báo chung để báo cho người dùng khi hệ thống vừa cập nhật trạng thái.",
    usageNote:
      "Dùng cho thông báo nội bộ trong hệ thống khi không cần diễn giải quá dài.",
  },
];

const normalizeString = (value: unknown, fallback = "") => {
  return typeof value === "string" ? value.trim() || fallback : fallback;
};

const normalizeTemplateType = (value: unknown): TemplateType => {
  return templateTypes.includes(value as TemplateType)
    ? (value as TemplateType)
    : "Notification";
};

const normalizeTemplateStatus = (value: unknown): TemplateStatus => {
  return templateStatuses.includes(value as TemplateStatus)
    ? (value as TemplateStatus)
    : "Active";
};

const getDefaultMetadata = (
  templateType: TemplateType,
  templateName: string,
): TemplateMetadata => {
  switch (templateType) {
    case "Rejection Reason":
      return {
        description:
          templateName || "Mẫu từ chối dùng cho các trường hợp bài đăng không đạt yêu cầu kiểm duyệt.",
        usageNote:
          "Dùng khi admin cần trả về lý do từ chối rõ ràng để người dùng sửa và gửi lại.",
      };
    case "Report Reason":
      return {
        description:
          templateName || "Mẫu dùng trong quy trình xử lý báo cáo và giải thích hướng xử lý.",
        usageNote:
          "Dùng khi admin hoặc điều phối viên cần ghi chú lý do xử lý một báo cáo cụ thể.",
      };
    default:
      return {
        description:
          templateName || "Mẫu thông báo dùng để gửi cập nhật ngắn tới người dùng hoặc nội bộ.",
        usageNote:
          "Dùng cho các thông báo hệ thống, nhắc việc hoặc cập nhật trạng thái chung.",
      };
  }
};

const normalizeMetadata = (
  templateId: number,
  templateType: TemplateType,
  templateName: string,
  metadataMap: TemplateMetadataMap,
  payload?: Pick<TemplatePayload, "description" | "usageNote">,
): TemplateMetadata => {
  const current = metadataMap[String(templateId)];
  const fallback = getDefaultMetadata(templateType, templateName);

  return {
    description: normalizeString(
      payload?.description,
      current?.description || fallback.description,
    ),
    usageNote: normalizeString(
      payload?.usageNote,
      current?.usageNote || fallback.usageNote,
    ),
  };
};

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return `${date.toISOString().slice(0, 10)} ${String(date.getHours()).padStart(
    2,
    "0",
  )}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const buildTemplateResponse = (
  template: AdminTemplate,
  metadataMap: TemplateMetadataMap,
) => {
  const templateType = normalizeTemplateType(template.templateType);
  const templateName = normalizeString(template.templateName, "Mẫu chưa đặt tên");
  const metadata = normalizeMetadata(
    template.templateId,
    templateType,
    templateName,
    metadataMap,
  );

  return {
    id: template.templateId,
    templateName,
    templateType,
    templateContent: normalizeString(template.templateContent),
    status: normalizeTemplateStatus(template.templateStatus),
    description: metadata.description,
    usageNote: metadata.usageNote,
    updatedAt: template.templateUpdatedAt,
    updatedLabel: formatDate(template.templateUpdatedAt),
  };
};

const validateTemplatePayload = (
  payload: TemplatePayload,
  options: { allowPartial?: boolean } = {},
) => {
  const allowPartial = options.allowPartial ?? false;
  const templateName = normalizeString(payload.templateName);
  const templateContent = normalizeString(payload.templateContent);
  const templateType = normalizeTemplateType(payload.templateType);
  const nextStatus = normalizeTemplateStatus(payload.status ?? payload.templateStatus);
  const description = normalizeString(payload.description);
  const usageNote = normalizeString(payload.usageNote);

  if (!allowPartial || payload.templateName !== undefined) {
    if (!templateName) {
      throw new Error("Tên mẫu là bắt buộc.");
    }
  }

  if (!allowPartial || payload.templateContent !== undefined) {
    if (!templateContent) {
      throw new Error("Nội dung mẫu là bắt buộc.");
    }
  }

  return {
    templateName,
    templateType,
    templateContent,
    nextStatus,
    description,
    usageNote,
  };
};

const getMetadataMap = async () => {
  return adminConfigStoreService.getJson<TemplateMetadataMap>(
    TEMPLATE_METADATA_KEY,
    {},
  );
};

const saveMetadataMap = async (
  metadataMap: TemplateMetadataMap,
  userId?: number | null,
) => {
  await adminConfigStoreService.setJson(TEMPLATE_METADATA_KEY, metadataMap, userId);
};

const ensureSeedTemplates = async () => {
  const existingTemplates = await db.select().from(adminTemplates).limit(1);
  if (existingTemplates.length > 0) {
    return;
  }

  const inserted = await db
    .insert(adminTemplates)
    .values(
      seedTemplates.map((template) => ({
        templateName: template.templateName,
        templateType: template.templateType,
        templateContent: template.templateContent,
        templateStatus: template.templateStatus,
        templateUpdatedAt: new Date(),
      })),
    )
    .returning();

  const metadataMap = await getMetadataMap();

  inserted.forEach((template, index) => {
    metadataMap[String(template.templateId)] = {
      description: seedTemplates[index].description,
      usageNote: seedTemplates[index].usageNote,
    };
  });

  await saveMetadataMap(metadataMap);
};

const getPerformedBy = async (userId?: number | null) => {
  if (!userId) {
    return "Quản trị viên hệ thống";
  }

  const [user] = await db
    .select({
      displayName: users.userDisplayName,
      email: users.userEmail,
    })
    .from(users)
    .where(eq(users.userId, userId))
    .limit(1);

  return user?.displayName || user?.email || `Người dùng #${userId}`;
};

const logTemplateEvent = async (
  userId: number | null | undefined,
  eventType:
    | "admin_template_created"
    | "admin_template_updated"
    | "admin_template_cloned"
    | "admin_template_status_updated",
  detail: string,
) => {
  await db.insert(eventLogs).values({
    eventLogUserId: userId ?? null,
    eventLogEventType: eventType,
    eventLogEventTime: new Date(),
    eventLogMeta: {
      action:
        eventType === "admin_template_created"
          ? "Tạo mẫu nội dung"
          : eventType === "admin_template_updated"
            ? "Cập nhật mẫu nội dung"
            : eventType === "admin_template_cloned"
              ? "Nhân bản mẫu nội dung"
              : "Cập nhật trạng thái mẫu nội dung",
      detail,
      performedBy: await getPerformedBy(userId),
    },
  });
};

export const getTemplates = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await ensureSeedTemplates();

    const search = normalizeString(req.query.search);
    const typeFilter =
      req.query.type && req.query.type !== "All"
        ? normalizeTemplateType(req.query.type)
        : null;
    const statusFilter =
      req.query.status && req.query.status !== "All"
        ? normalizeTemplateStatus(req.query.status)
        : null;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

    const [templates, metadataMap] = await Promise.all([
      db.select().from(adminTemplates).orderBy(desc(adminTemplates.templateUpdatedAt)),
      getMetadataMap(),
    ]);

    const normalized = templates.map((template) =>
      buildTemplateResponse(template, metadataMap),
    );

    const filtered = normalized.filter((template) => {
      const matchesSearch =
        !search ||
        template.templateName.toLowerCase().includes(search.toLowerCase()) ||
        template.templateType.toLowerCase().includes(search.toLowerCase()) ||
        template.templateContent.toLowerCase().includes(search.toLowerCase()) ||
        template.description.toLowerCase().includes(search.toLowerCase()) ||
        template.usageNote.toLowerCase().includes(search.toLowerCase());

      const matchesType = !typeFilter || template.templateType === typeFilter;
      const matchesStatus = !statusFilter || template.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });

    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    res.json({
      data: paginated,
      pagination: {
        total: filtered.length,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const createTemplate = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const validated = validateTemplatePayload(req.body as TemplatePayload);

    const [newTemplate] = await db
      .insert(adminTemplates)
      .values({
        templateName: validated.templateName,
        templateType: validated.templateType,
        templateContent: validated.templateContent,
        templateStatus: validated.nextStatus,
        templateUpdatedAt: new Date(),
      })
      .returning();

    const metadataMap = await getMetadataMap();
    metadataMap[String(newTemplate.templateId)] = normalizeMetadata(
      newTemplate.templateId,
      validated.templateType,
      validated.templateName,
      metadataMap,
      {
        description: validated.description,
        usageNote: validated.usageNote,
      },
    );
    await saveMetadataMap(metadataMap, req.user?.id);

    await logTemplateEvent(
      req.user?.id,
      "admin_template_created",
      `Đã tạo mẫu "${validated.templateName}" thuộc loại ${validated.templateType}.`,
    );

    res.status(201).json({
      data: buildTemplateResponse(newTemplate, metadataMap),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Lỗi máy chủ nội bộ",
    });
  }
};

export const updateTemplate = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const idNumber = parseId(rawId);

    if (idNumber === null) {
      res.status(400).json({ error: "ID mẫu không hợp lệ" });
      return;
    }

    const validated = validateTemplatePayload(req.body as TemplatePayload);

    const [updatedTemplate] = await db
      .update(adminTemplates)
      .set({
        templateName: validated.templateName,
        templateType: validated.templateType,
        templateContent: validated.templateContent,
        templateStatus: validated.nextStatus,
        templateUpdatedAt: new Date(),
      })
      .where(eq(adminTemplates.templateId, idNumber))
      .returning();

    if (!updatedTemplate) {
      res.status(404).json({ error: "Không tìm thấy mẫu" });
      return;
    }

    const metadataMap = await getMetadataMap();
    metadataMap[String(updatedTemplate.templateId)] = normalizeMetadata(
      updatedTemplate.templateId,
      validated.templateType,
      validated.templateName,
      metadataMap,
      {
        description: validated.description,
        usageNote: validated.usageNote,
      },
    );
    await saveMetadataMap(metadataMap, req.user?.id);

    await logTemplateEvent(
      req.user?.id,
      "admin_template_updated",
      `Đã cập nhật mẫu "${validated.templateName}".`,
    );

    res.json({
      data: buildTemplateResponse(updatedTemplate, metadataMap),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Lỗi máy chủ nội bộ",
    });
  }
};

export const cloneTemplate = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const idNumber = parseId(rawId);

    if (idNumber === null) {
      res.status(400).json({ error: "ID mẫu không hợp lệ" });
      return;
    }

    const [sourceTemplate] = await db
      .select()
      .from(adminTemplates)
      .where(eq(adminTemplates.templateId, idNumber))
      .limit(1);

    if (!sourceTemplate) {
      res.status(404).json({ error: "Không tìm thấy mẫu để nhân bản" });
      return;
    }

    const clonedName = `${sourceTemplate.templateName} (Bản sao)`;

    const [clonedTemplate] = await db
      .insert(adminTemplates)
      .values({
        templateName: clonedName,
        templateType: normalizeTemplateType(sourceTemplate.templateType),
        templateContent: sourceTemplate.templateContent,
        templateStatus: "Disabled",
        templateUpdatedAt: new Date(),
      })
      .returning();

    const metadataMap = await getMetadataMap();
    const sourceMetadata = normalizeMetadata(
      sourceTemplate.templateId,
      normalizeTemplateType(sourceTemplate.templateType),
      sourceTemplate.templateName,
      metadataMap,
    );

    metadataMap[String(clonedTemplate.templateId)] = {
      description: sourceMetadata.description,
      usageNote: sourceMetadata.usageNote,
    };
    await saveMetadataMap(metadataMap, req.user?.id);

    await logTemplateEvent(
      req.user?.id,
      "admin_template_cloned",
      `Đã nhân bản mẫu "${sourceTemplate.templateName}" thành "${clonedName}".`,
    );

    res.status(201).json({
      data: buildTemplateResponse(clonedTemplate, metadataMap),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Lỗi máy chủ nội bộ",
    });
  }
};

export const updateTemplateStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const idNumber = parseId(rawId);

    if (idNumber === null) {
      res.status(400).json({ error: "ID mẫu không hợp lệ" });
      return;
    }

    const nextStatus = normalizeTemplateStatus(
      req.body.status ?? req.body.templateStatus,
    );

    const [updatedTemplate] = await db
      .update(adminTemplates)
      .set({
        templateStatus: nextStatus,
        templateUpdatedAt: new Date(),
      })
      .where(eq(adminTemplates.templateId, idNumber))
      .returning();

    if (!updatedTemplate) {
      res.status(404).json({ error: "Không tìm thấy mẫu" });
      return;
    }

    const metadataMap = await getMetadataMap();

    await logTemplateEvent(
      req.user?.id,
      "admin_template_status_updated",
      `Đã ${nextStatus === "Active" ? "bật" : "tắt"} mẫu "${updatedTemplate.templateName}".`,
    );

    res.json({
      data: buildTemplateResponse(updatedTemplate, metadataMap),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Lỗi máy chủ nội bộ",
    });
  }
};
