import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { templateBuilderService } from "../services/templateBuilderService";
import type {
  TemplateBuilderField,
  TemplateBuilderFieldType,
  TemplateBuilderPreset,
} from "../types/template";
import "./TemplateBuilderPage.css";

const fieldTypeLabels: Record<TemplateBuilderFieldType, string> = {
  text: "Văn bản",
  number: "Số",
  select: "Chọn từ danh sách",
};

const createField = (type: TemplateBuilderFieldType): TemplateBuilderField => ({
  id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
  type,
  label:
    type === "text"
      ? "Trường văn bản mới"
      : type === "number"
        ? "Trường số mới"
        : "Trường chọn mới",
  placeholder:
    type === "number" ? "Nhập giá trị số" : "Nhập nội dung hiển thị",
  helperText: "Giải thích ngắn cho người dùng cuối biết trường này dùng để làm gì.",
  required: false,
  options: type === "select" ? ["Lựa chọn 1", "Lựa chọn 2"] : [],
});

const normalizeOptions = (value: string) => {
  return Array.from(
    new Set(
      value
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
};

function TemplateBuilderPage() {
  const [preset, setPreset] = useState<TemplateBuilderPreset>(
    templateBuilderService.getDefaultPreset(),
  );
  const [savedPreset, setSavedPreset] = useState<TemplateBuilderPreset>(
    templateBuilderService.getDefaultPreset(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const isDirty = useMemo(
    () => JSON.stringify(preset) !== JSON.stringify(savedPreset),
    [preset, savedPreset],
  );

  useEffect(() => {
    void loadPreset();
  }, []);

  const showToast = (message: string, tone: ToastItem["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2600);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const loadPreset = async () => {
    try {
      setIsLoading(true);
      setPageError("");
      const nextPreset = await templateBuilderService.getPreset();
      setPreset(nextPreset);
      setSavedPreset(nextPreset);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Không thể tải cấu hình trình dựng mẫu.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (
    fieldId: string,
    updater: (field: TemplateBuilderField) => TemplateBuilderField,
  ) => {
    setPreset((prev) => ({
      ...prev,
      fields: prev.fields.map((field) =>
        field.id === fieldId ? updater(field) : field,
      ),
    }));
  };

  const addField = (type: TemplateBuilderFieldType) => {
    setPreset((prev) => ({
      ...prev,
      fields: [...prev.fields, createField(type)],
    }));
  };

  const removeField = (fieldId: string) => {
    setPreset((prev) => ({
      ...prev,
      fields: prev.fields.filter((field) => field.id !== fieldId),
    }));
  };

  const moveField = (fieldId: string, direction: -1 | 1) => {
    setPreset((prev) => {
      const currentIndex = prev.fields.findIndex((field) => field.id === fieldId);
      if (currentIndex < 0) return prev;

      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= prev.fields.length) {
        return prev;
      }

      const nextFields = [...prev.fields];
      const [field] = nextFields.splice(currentIndex, 1);
      nextFields.splice(nextIndex, 0, field);

      return {
        ...prev,
        fields: nextFields,
      };
    });
  };

  const validatePreset = (value: TemplateBuilderPreset) => {
    if (!value.templateName.trim()) {
      throw new Error("Tên mẫu biểu mẫu là bắt buộc.");
    }

    if (!value.categoryName.trim()) {
      throw new Error("Danh mục xem trước là bắt buộc.");
    }

    if (!value.submitLabel.trim()) {
      throw new Error("Nhãn nút xem trước là bắt buộc.");
    }

    if (value.fields.length === 0) {
      throw new Error("Trình dựng mẫu phải có ít nhất một trường hiển thị.");
    }

    value.fields.forEach((field, index) => {
      if (!field.label.trim()) {
        throw new Error(`Trường số ${index + 1} chưa có nhãn hiển thị.`);
      }

      if (field.type === "select" && field.options.length === 0) {
        throw new Error(
          `Trường chọn "${field.label}" cần có ít nhất một lựa chọn.`,
        );
      }
    });
  };

  const handleSave = async () => {
    try {
      validatePreset(preset);
      setIsSaving(true);
      const nextPreset = await templateBuilderService.savePreset(preset);
      setPreset(nextPreset);
      setSavedPreset(nextPreset);
      showToast("Đã lưu cấu hình trình dựng mẫu.");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Không thể lưu cấu hình trình dựng mẫu.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsSaving(true);
      const nextPreset = await templateBuilderService.resetPreset();
      setPreset(nextPreset);
      setSavedPreset(nextPreset);
      showToast("Đã khôi phục trình dựng mẫu về mặc định.", "info");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Không thể khôi phục trình dựng mẫu.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="template-builder-page">
      <PageHeader
        title="Trình dựng mẫu"
        description="Cấu hình form xem trước theo cách dễ hiểu: nhập thông tin mẫu, thêm trường hiển thị và xem kết quả ngay như người dùng cuối."
        actionLabel={isSaving ? "Đang lưu..." : "Lưu cấu hình"}
        onActionClick={() => void handleSave()}
      />

      <SectionCard
        title="Cách dùng nhanh"
        description="Màn này được chia rõ thành 3 phần để người mới nhìn vào biết phải thao tác gì trước."
      >
        <div className="template-builder-steps">
          <div className="template-builder-step-card">
            <strong>1. Thông tin mẫu</strong>
            <span>Đặt tên, danh mục và ghi chú ngắn cho mẫu biểu mẫu cần xem trước.</span>
          </div>
          <div className="template-builder-step-card">
            <strong>2. Cấu hình nội dung</strong>
            <span>Thêm trường, chọn kiểu dữ liệu, nhập nhãn, placeholder và đánh dấu bắt buộc.</span>
          </div>
          <div className="template-builder-step-card">
            <strong>3. Xem trước</strong>
            <span>Kiểm tra label, placeholder, trạng thái bắt buộc và bố cục hiển thị cuối cùng.</span>
          </div>
        </div>
      </SectionCard>

      {pageError ? (
        <SectionCard title="Không thể tải dữ liệu" description={pageError}>
          <button
            type="button"
            className="template-builder-action template-builder-action--secondary"
            onClick={() => void loadPreset()}
          >
            Tải lại
          </button>
        </SectionCard>
      ) : null}

      {isLoading ? (
        <SectionCard
          title="Đang tải trình dựng mẫu"
          description="Hệ thống đang lấy cấu hình builder hiện tại từ máy chủ."
        >
          <EmptyState
            title="Đang đồng bộ cấu hình"
            description="Vui lòng chờ trong giây lát để hiển thị dữ liệu builder."
          />
        </SectionCard>
      ) : (
        <>
          <div className="template-builder-toolbar">
            <div className="template-builder-toolbar__status">
              {isDirty
                ? "Bạn đang có thay đổi chưa lưu."
                : "Cấu hình trình dựng mẫu đã đồng bộ với máy chủ."}
            </div>

            <div className="template-builder-toolbar__actions">
              <button
                type="button"
                className="template-builder-action template-builder-action--secondary"
                onClick={() => void handleReset()}
                disabled={isSaving}
              >
                Khôi phục mặc định
              </button>
            </div>
          </div>

          <div className="template-builder-grid">
            <SectionCard
              title="Thông tin mẫu"
              description="Định nghĩa tên mẫu và ngữ cảnh để phần preview nhìn là hiểu ngay."
            >
              <div className="template-builder-form">
                <div className="template-builder-field">
                  <label htmlFor="builder-template-name">Tên mẫu biểu mẫu</label>
                  <input
                    id="builder-template-name"
                    value={preset.templateName}
                    onChange={(event) =>
                      setPreset((prev) => ({
                        ...prev,
                        templateName: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="template-builder-field">
                  <label htmlFor="builder-category-name">Danh mục xem trước</label>
                  <input
                    id="builder-category-name"
                    value={preset.categoryName}
                    onChange={(event) =>
                      setPreset((prev) => ({
                        ...prev,
                        categoryName: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="template-builder-field">
                  <label htmlFor="builder-usage-note">Ghi chú sử dụng</label>
                  <textarea
                    id="builder-usage-note"
                    value={preset.usageNote}
                    onChange={(event) =>
                      setPreset((prev) => ({
                        ...prev,
                        usageNote: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="template-builder-field">
                  <label htmlFor="builder-title-placeholder">
                    Placeholder tiêu đề tin
                  </label>
                  <input
                    id="builder-title-placeholder"
                    value={preset.previewTitlePlaceholder}
                    onChange={(event) =>
                      setPreset((prev) => ({
                        ...prev,
                        previewTitlePlaceholder: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="template-builder-field">
                  <label htmlFor="builder-submit-label">Nhãn nút xem trước</label>
                  <input
                    id="builder-submit-label"
                    value={preset.submitLabel}
                    onChange={(event) =>
                      setPreset((prev) => ({
                        ...prev,
                        submitLabel: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Cấu hình nội dung"
              description="Thêm trường theo đúng kiểu dữ liệu và chỉnh sửa chúng ngay tại đây."
            >
              <div className="template-builder-field-actions">
                <button type="button" onClick={() => addField("text")}>
                  + Thêm trường văn bản
                </button>
                <button type="button" onClick={() => addField("number")}>
                  + Thêm trường số
                </button>
                <button type="button" onClick={() => addField("select")}>
                  + Thêm trường chọn
                </button>
              </div>

              {preset.fields.length === 0 ? (
                <EmptyState
                  title="Chưa có trường nào"
                  description="Hãy thêm ít nhất một trường để phần xem trước có dữ liệu hiển thị."
                />
              ) : (
                <div className="template-builder-field-list">
                  {preset.fields.map((field, index) => (
                    <div key={field.id} className="template-builder-field-card">
                      <div className="template-builder-field-card__header">
                        <div>
                          <strong>
                            Trường {index + 1} • {fieldTypeLabels[field.type]}
                          </strong>
                          <span>{field.label}</span>
                        </div>
                        <div className="template-builder-field-card__actions">
                          <button
                            type="button"
                            onClick={() => moveField(field.id, -1)}
                            disabled={index === 0}
                          >
                            Lên
                          </button>
                          <button
                            type="button"
                            onClick={() => moveField(field.id, 1)}
                            disabled={index === preset.fields.length - 1}
                          >
                            Xuống
                          </button>
                          <button
                            type="button"
                            onClick={() => removeField(field.id)}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>

                      <div className="template-builder-field-grid">
                        <div className="template-builder-field">
                          <label>Nhãn hiển thị</label>
                          <input
                            value={field.label}
                            onChange={(event) =>
                              updateField(field.id, (current) => ({
                                ...current,
                                label: event.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="template-builder-field">
                          <label>Placeholder</label>
                          <input
                            value={field.placeholder}
                            onChange={(event) =>
                              updateField(field.id, (current) => ({
                                ...current,
                                placeholder: event.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="template-builder-field template-builder-field--full">
                          <label>Helper text</label>
                          <textarea
                            value={field.helperText}
                            onChange={(event) =>
                              updateField(field.id, (current) => ({
                                ...current,
                                helperText: event.target.value,
                              }))
                            }
                          />
                        </div>

                        {field.type === "select" ? (
                          <div className="template-builder-field template-builder-field--full">
                            <label>Danh sách lựa chọn</label>
                            <textarea
                              value={field.options.join("\n")}
                              onChange={(event) =>
                                updateField(field.id, (current) => ({
                                  ...current,
                                  options: normalizeOptions(event.target.value),
                                }))
                              }
                            />
                          </div>
                        ) : null}

                        <label className="template-builder-checkbox">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(event) =>
                              updateField(field.id, (current) => ({
                                ...current,
                                required: event.target.checked,
                              }))
                            }
                          />
                          <span>Đánh dấu là trường bắt buộc</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Xem trước form"
              description="Hiển thị gần với trải nghiệm người dùng cuối để rà label, placeholder và bố cục trước khi dùng thật."
            >
              <div className="template-builder-preview-banner">
                Đây là chế độ xem trước. Admin chỉ kiểm tra bố cục hiển thị, không thể gửi form thật từ màn này.
              </div>

              <div className="template-builder-preview-card">
                <div className="template-builder-preview-card__header">
                  <div>
                    <strong>{preset.templateName}</strong>
                    <span>{preset.usageNote}</span>
                  </div>
                  <div className="template-builder-preview-pill">
                    Danh mục: {preset.categoryName}
                  </div>
                </div>

                <div className="template-builder-preview-field">
                  <label>Tiêu đề tin <span>*</span></label>
                  <input
                    type="text"
                    value=""
                    placeholder={preset.previewTitlePlaceholder}
                    disabled
                  />
                  <small>
                    Người dùng sẽ nhập tiêu đề bài đăng thật tại đây.
                  </small>
                </div>

                <div className="template-builder-preview-field">
                  <label>Danh mục</label>
                  <select disabled value={preset.categoryName}>
                    <option>{preset.categoryName}</option>
                  </select>
                  <small>Đây là danh mục được khóa để mô phỏng theo đúng ngữ cảnh.</small>
                </div>

                <div className="template-builder-preview-section">
                  <strong>Thuộc tính đặc thù ngành cây cảnh</strong>
                  <span>Kiểm tra kỹ nhãn, placeholder và trạng thái bắt buộc của từng trường.</span>
                </div>

                {preset.fields.map((field) => (
                  <div key={field.id} className="template-builder-preview-field">
                    <label>
                      {field.label}
                      {field.required ? <span>*</span> : null}
                    </label>

                    {field.type === "select" ? (
                      <select disabled value="">
                        <option value="">{field.placeholder}</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === "number" ? "number" : "text"}
                        value=""
                        placeholder={field.placeholder}
                        disabled
                      />
                    )}

                    <small>{field.helperText}</small>
                  </div>
                ))}

                <button
                  type="button"
                  className="template-builder-preview-submit"
                  disabled
                >
                  {preset.submitLabel}
                </button>
              </div>
            </SectionCard>
          </div>
        </>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default TemplateBuilderPage;
