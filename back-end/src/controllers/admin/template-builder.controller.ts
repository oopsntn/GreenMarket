import { Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../config/db";
import { AuthRequest } from "../../dtos/auth";
import { eventLogs, users } from "../../models/schema/index";
import { adminConfigStoreService } from "../../services/adminConfigStore.service";

const TEMPLATE_BUILDER_PRESET_KEY = "admin_template_builder_config";

type TemplateBuilderFieldType = "text" | "number" | "select";

type TemplateBuilderField = {
  id: string;
  type: TemplateBuilderFieldType;
  label: string;
  placeholder: string;
  helperText: string;
  required: boolean;
  options: string[];
};

type TemplateBuilderPreset = {
  templateName: string;
  categoryName: string;
  usageNote: string;
  previewTitlePlaceholder: string;
  submitLabel: string;
  fields: TemplateBuilderField[];
};

const defaultPreset: TemplateBuilderPreset = {
  templateName: "Mẫu đăng tin cây cảnh",
  categoryName: "Cây cảnh & Bonsai",
  usageNote:
    "Dùng để xem trước bố cục form đăng tin cho ngành cây cảnh trước khi đưa vào vận hành.",
  previewTitlePlaceholder: "Ví dụ: Sanh mini 8 năm tuổi, dáng trực",
  submitLabel: "Đăng tin cây cảnh (Xem trước)",
  fields: [
    {
      id: "bonsai-style",
      type: "select",
      label: "Dáng cây (Thế cây)",
      placeholder: "Chọn dáng cây",
      helperText:
        "Giúp người đăng mô tả bố cục bonsai theo đúng cách gọi phổ biến.",
      required: true,
      options: ["Trực", "Xiêu", "Huyền", "Hoành", "Văn nhân"],
    },
    {
      id: "pot-type",
      type: "select",
      label: "Loại chậu đi kèm",
      placeholder: "Chọn loại chậu",
      helperText:
        "Thể hiện tình trạng đi kèm chậu để người mua định giá rõ hơn.",
      required: true,
      options: ["Chậu gốm", "Chậu đá", "Bầu đất / túi ươm"],
    },
    {
      id: "tree-age",
      type: "number",
      label: "Tuổi cây (ước lượng)",
      placeholder: "Ví dụ: 8",
      helperText:
        "Dùng để ước lượng độ trưởng thành của cây, hỗ trợ so sánh giá trị.",
      required: false,
      options: [],
    },
  ],
};

const normalizeString = (value: unknown, fallback: string) => {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

const normalizeFieldType = (value: unknown): TemplateBuilderFieldType => {
  if (value === "text" || value === "number" || value === "select") {
    return value;
  }

  return "text";
};

const normalizeField = (
  field: Partial<TemplateBuilderField>,
  index: number,
): TemplateBuilderField => {
  const type = normalizeFieldType(field.type);
  const options = Array.isArray(field.options)
    ? field.options
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return {
    id: normalizeString(field.id, `field-${index + 1}`),
    type,
    label: normalizeString(field.label, `Trường ${index + 1}`),
    placeholder: normalizeString(field.placeholder, "Nhập thông tin"),
    helperText: normalizeString(field.helperText, "Hiển thị cho người dùng cuối."),
    required: typeof field.required === "boolean" ? field.required : false,
    options: type === "select" ? options : [],
  };
};

const normalizePreset = (
  payload: Partial<TemplateBuilderPreset> | undefined,
): TemplateBuilderPreset => ({
  templateName: normalizeString(
    payload?.templateName,
    defaultPreset.templateName,
  ),
  categoryName: normalizeString(
    payload?.categoryName,
    defaultPreset.categoryName,
  ),
  usageNote: normalizeString(payload?.usageNote, defaultPreset.usageNote),
  previewTitlePlaceholder: normalizeString(
    payload?.previewTitlePlaceholder,
    defaultPreset.previewTitlePlaceholder,
  ),
  submitLabel: normalizeString(payload?.submitLabel, defaultPreset.submitLabel),
  fields:
    Array.isArray(payload?.fields) && payload.fields.length > 0
      ? payload.fields.map((field, index) => normalizeField(field, index))
      : defaultPreset.fields,
});

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

const logBuilderEvent = async (
  userId: number | null | undefined,
  eventType: "admin_template_builder_updated" | "admin_template_builder_reset",
  detail: string,
) => {
  await db.insert(eventLogs).values({
    eventLogUserId: userId ?? null,
    eventLogTargetType: "template_builder",
    eventLogTargetId: null,
    eventLogEventType: eventType,
    eventLogEventTime: new Date(),
    eventLogMeta: {
      action:
        eventType === "admin_template_builder_reset"
          ? "Khôi phục trình dựng mẫu"
          : "Cập nhật trình dựng mẫu",
      detail,
      performedBy: await getPerformedBy(userId),
    },
  });
};

export const getTemplateBuilderPreset = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const preset = await adminConfigStoreService.getJson<TemplateBuilderPreset>(
      TEMPLATE_BUILDER_PRESET_KEY,
      defaultPreset,
    );

    res.json(normalizePreset(preset));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const saveTemplateBuilderPreset = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const preset = normalizePreset(req.body as Partial<TemplateBuilderPreset>);
    const savedPreset = await adminConfigStoreService.setJson(
      TEMPLATE_BUILDER_PRESET_KEY,
      preset,
      req.user?.id,
    );

    await logBuilderEvent(
      req.user?.id,
      "admin_template_builder_updated",
      `Đã cập nhật trình dựng mẫu "${preset.templateName}" với ${preset.fields.length} trường hiển thị.`,
    );

    res.json(savedPreset);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Lỗi máy chủ nội bộ",
    });
  }
};

export const resetTemplateBuilderPreset = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const savedPreset = await adminConfigStoreService.setJson(
      TEMPLATE_BUILDER_PRESET_KEY,
      defaultPreset,
      req.user?.id,
    );

    await logBuilderEvent(
      req.user?.id,
      "admin_template_builder_reset",
      "Đã khôi phục trình dựng mẫu về cấu hình xem trước bonsai mặc định.",
    );

    res.json(savedPreset);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Lỗi máy chủ nội bộ",
    });
  }
};
