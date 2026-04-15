import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { categoryService, type Category } from "../services/categoryService";
import { attributeService, type Attribute } from "../services/attributeService";
import {
  categoryMappingService,
  type CategoryAttributeMapping,
  type CategoryMappingPreview,
  type MappingAttributeType,
  type MappingStatus,
} from "../services/categoryMappingService";
import "./CategoryAttributeMappingPage.css";

type ModalMode = "create" | "edit";

type MappingFormState = {
  categoryId: string;
  attributeId: string;
  isRequired: boolean;
  displayOrder: string;
};

const PAGE_SIZE = 5;

const ATTRIBUTE_TYPE_LABELS: Record<MappingAttributeType, string> = {
  Text: "Văn bản",
  Number: "Số",
  Select: "Danh sách lựa chọn",
  Boolean: "Đúng / Sai",
};

const STATUS_LABELS: Record<MappingStatus, string> = {
  Active: "Đang hoạt động",
  Disabled: "Đã tắt",
};

const EMPTY_FORM: MappingFormState = {
  categoryId: "",
  attributeId: "",
  isRequired: false,
  displayOrder: "1",
};

function CategoryAttributeMappingPage() {
  const [mappings, setMappings] = useState<CategoryAttributeMapping[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [preview, setPreview] = useState<CategoryMappingPreview | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [activeMapping, setActiveMapping] =
    useState<CategoryAttributeMapping | null>(null);
  const [formState, setFormState] = useState<MappingFormState>(EMPTY_FORM);

  const [confirmMapping, setConfirmMapping] =
    useState<CategoryAttributeMapping | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "disable" | "enable" | "delete"
  >("disable");
  const [previewCategoryId, setPreviewCategoryId] = useState<number | null>(
    null,
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, tone: ToastItem["tone"] = "success") => {
      const toastId = Date.now() + Math.random();

      setToasts((current) => [...current, { id: toastId, message, tone }]);

      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== toastId));
      }, 2600);
    },
    [],
  );

  const removeToast = (id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const loadMeta = useCallback(async () => {
    setMetaLoading(true);

    try {
      const [categoryResponse, attributeResponse] = await Promise.all([
        categoryService.getCategories(),
        attributeService.getAttributes(),
      ]);

      setCategories(categoryResponse);
      setAttributes(attributeResponse);

      if (categoryResponse.length > 0) {
        setPreviewCategoryId((current) => current ?? categoryResponse[0].id);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu nền.",
      );
    } finally {
      setMetaLoading(false);
    }
  }, []);

  const loadMappings = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await categoryMappingService.getMappings({
        search: debouncedSearchTerm,
        page: currentPage,
        pageSize: PAGE_SIZE,
      });

      setMappings(response.data);
      setTotalItems(response.total);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách ánh xạ.",
      );
      setMappings([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm]);

  const loadPreview = useCallback(
    async (categoryId: number) => {
      setPreviewLoading(true);

      try {
        const response = await categoryMappingService.previewCategory(categoryId);
        setPreview(response);
      } catch (error) {
        setPreview(null);
        showToast(
          error instanceof Error
            ? error.message
            : "Không thể tải bản xem trước.",
          "error",
        );
      } finally {
        setPreviewLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setCurrentPage(1);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    void loadMappings();
  }, [loadMappings]);

  useEffect(() => {
    if (previewCategoryId) {
      void loadPreview(previewCategoryId);
    } else {
      setPreview(null);
    }
  }, [loadPreview, previewCategoryId]);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const filterSummaryItems = useMemo(() => {
    return [debouncedSearchTerm ? "Đang lọc theo từ khóa" : "Tất cả ánh xạ"];
  }, [debouncedSearchTerm]);

  const openCreateModal = () => {
    setModalMode("create");
    setActiveMapping(null);
    setFormState(EMPTY_FORM);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (mapping: CategoryAttributeMapping) => {
    setModalMode("edit");
    setActiveMapping(mapping);
    setFormState({
      categoryId: String(mapping.categoryId),
      attributeId: String(mapping.attributeId),
      isRequired: mapping.isRequired,
      displayOrder: String(mapping.displayOrder),
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) {
      return;
    }

    setIsModalOpen(false);
    setActiveMapping(null);
    setFormError(null);
    setFormState(EMPTY_FORM);
  };

  const askConfirm = (
    mapping: CategoryAttributeMapping,
    action: "disable" | "enable" | "delete",
  ) => {
    setConfirmMapping(mapping);
    setConfirmAction(action);
  };

  const closeConfirm = () => {
    if (isConfirming) {
      return;
    }

    setConfirmMapping(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        categoryId: Number(formState.categoryId),
        attributeId: Number(formState.attributeId),
        isRequired: formState.isRequired,
        displayOrder: Number(formState.displayOrder),
      };

      if (modalMode === "create") {
        await categoryMappingService.createMapping(payload);
        showToast("Đã tạo ánh xạ mới.");
      } else if (activeMapping) {
        await categoryMappingService.updateMapping(
          {
            categoryId: activeMapping.categoryId,
            attributeId: activeMapping.attributeId,
          },
          payload,
        );
        showToast("Đã cập nhật ánh xạ.");
      }

      setIsModalOpen(false);
      setFormState(EMPTY_FORM);
      await loadMappings();

      if (payload.categoryId) {
        setPreviewCategoryId(payload.categoryId);
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Không thể lưu ánh xạ.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmMapping) {
      return;
    }

    setIsConfirming(true);

    try {
      const target = {
        categoryId: confirmMapping.categoryId,
        attributeId: confirmMapping.attributeId,
      };

      if (confirmAction === "delete") {
        await categoryMappingService.deleteMapping(target);
        showToast("Đã xóa ánh xạ.", "info");
      } else {
        const nextStatus: MappingStatus =
          confirmAction === "enable" ? "Active" : "Disabled";

        await categoryMappingService.updateMappingStatus(target, nextStatus);
        showToast(
          nextStatus === "Active" ? "Đã bật lại ánh xạ." : "Đã tắt ánh xạ.",
          nextStatus === "Active" ? "success" : "info",
        );
      }

      setConfirmMapping(null);
      await loadMappings();

      if (previewCategoryId) {
        await loadPreview(previewCategoryId);
      }
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật ánh xạ.",
        "error",
      );
    } finally {
      setIsConfirming(false);
    }
  };

  const confirmTitle =
    confirmAction === "delete"
      ? "Xóa ánh xạ"
      : confirmAction === "enable"
        ? "Bật lại ánh xạ"
        : "Tắt ánh xạ";

  const confirmMessage = confirmMapping
    ? confirmAction === "delete"
      ? `Bạn có chắc muốn xóa ánh xạ "${confirmMapping.categoryName} - ${confirmMapping.attributeName}"?`
      : confirmAction === "enable"
        ? `Bạn có chắc muốn bật lại ánh xạ "${confirmMapping.categoryName} - ${confirmMapping.attributeName}"?`
        : `Bạn có chắc muốn tắt ánh xạ "${confirmMapping.categoryName} - ${confirmMapping.attributeName}"?`
    : "Vui lòng xác nhận thao tác.";

  return (
    <div className="mapping-page">
      <PageHeader
        title="Ánh xạ danh mục - thuộc tính"
        description="Cấu hình mỗi danh mục sẽ dùng những thuộc tính nào và xem trước cấu trúc form đăng bài."
        actions={
          <button type="button" className="primary-button" onClick={openCreateModal}>
            + Thêm ánh xạ
          </button>
        }
      />

      <SearchToolbar
        placeholder="Tìm theo danh mục, thuộc tính hoặc mã thuộc tính"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onFilterClick={() => setShowFilters((value) => !value)}
        filterLabel="Hiện bộ lọc"
        filterSummaryItems={filterSummaryItems}
      />

      {showFilters ? (
        <SectionCard
          title="Xem trước theo danh mục"
          description="Chọn danh mục để kiểm tra nhanh bộ thuộc tính sẽ hiển thị trên form đăng bài."
        >
          <div className="mapping-preview__toolbar">
            <div className="mapping-preview__field">
              <label htmlFor="mapping-preview-category">Danh mục xem trước</label>
              <select
                id="mapping-preview-category"
                value={previewCategoryId ?? ""}
                onChange={(event) =>
                  setPreviewCategoryId(
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                disabled={metaLoading}
              >
                <option value="">Chọn danh mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Danh sách ánh xạ"
        description="Theo dõi danh mục, thuộc tính, thứ tự hiển thị và trạng thái sử dụng."
      >
        {loading ? (
          <EmptyState
            title="Đang tải danh sách ánh xạ"
            description="Hệ thống đang đồng bộ dữ liệu ánh xạ từ máy chủ."
          />
        ) : errorMessage ? (
          <EmptyState
            title="Không thể tải danh sách ánh xạ"
            description={errorMessage}
            actionLabel="Tải lại"
            onAction={() => {
              void loadMappings();
            }}
          />
        ) : mappings.length === 0 ? (
          <EmptyState
            title="Không có dữ liệu"
            description="Không tìm thấy ánh xạ nào phù hợp với bộ lọc hiện tại."
          />
        ) : (
          <>
            <div className="mapping-table-wrapper">
              <table className="mapping-table">
                <thead>
                  <tr>
                    <th>Danh mục</th>
                    <th>Thuộc tính</th>
                    <th>Mã thuộc tính</th>
                    <th>Kiểu dữ liệu</th>
                    <th>Bắt buộc</th>
                    <th>Thứ tự</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((mapping) => (
                    <tr key={mapping.id}>
                      <td>{mapping.categoryName}</td>
                      <td>{mapping.attributeName}</td>
                      <td>{mapping.attributeCode}</td>
                      <td>{ATTRIBUTE_TYPE_LABELS[mapping.attributeType]}</td>
                      <td>{mapping.isRequired ? "Có" : "Không"}</td>
                      <td>{mapping.displayOrder}</td>
                      <td>
                        <span
                          className={`mapping-status mapping-status--${mapping.status === "Active" ? "active" : "inactive"}`}
                        >
                          {STATUS_LABELS[mapping.status]}
                        </span>
                      </td>
                      <td>
                        <div className="mapping-actions">
                          <button
                            type="button"
                            className="mapping-actions__edit"
                            onClick={() => openEditModal(mapping)}
                          >
                            Sửa
                          </button>
                          {mapping.status === "Active" ? (
                            <button
                              type="button"
                              className="mapping-actions__disable"
                              onClick={() => askConfirm(mapping, "disable")}
                            >
                              Tắt
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="mapping-actions__enable"
                              onClick={() => askConfirm(mapping, "enable")}
                            >
                              Bật lại
                            </button>
                          )}
                          <button
                            type="button"
                            className="mapping-actions__remove"
                            onClick={() => askConfirm(mapping, "delete")}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mapping-pagination">
              <span className="mapping-pagination__info">
                Trang {currentPage} / {totalPages}
              </span>
              <div className="mapping-pagination__actions">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                >
                  Trước
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                >
                  Tiếp
                </button>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard
        title="Xem trước form theo danh mục"
        description="Mô phỏng cách thuộc tính hiển thị trên form đăng bài của người dùng cuối."
      >
        <div className="mapping-preview">
          <div className="mapping-preview__toolbar">
            <div className="mapping-preview__field">
              <label htmlFor="mapping-preview-category-inline">Danh mục</label>
              <select
                id="mapping-preview-category-inline"
                value={previewCategoryId ?? ""}
                onChange={(event) =>
                  setPreviewCategoryId(
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                disabled={metaLoading}
              >
                <option value="">Chọn danh mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {previewLoading ? (
            <EmptyState
              title="Đang tải bản xem trước"
              description="Hệ thống đang dựng cấu trúc form theo danh mục đã chọn."
            />
          ) : !preview ? (
            <EmptyState
              title="Chưa có bản xem trước"
              description="Hãy chọn một danh mục để xem cấu trúc form."
            />
          ) : preview.fields.length === 0 ? (
            <EmptyState
              title="Danh mục chưa có thuộc tính"
              description="Danh mục này chưa được gắn thuộc tính nào."
            />
          ) : (
            <div className="mapping-preview__form-card">
              <div className="mapping-preview__header">
                <h3>{preview.categoryName}</h3>
                <p>Đây là cách thuộc tính sẽ hiển thị trên form đăng bài.</p>
              </div>

              <div className="mapping-preview__grid">
                {preview.fields.map((field) => (
                  <article
                    key={field.attributeId}
                    className="mapping-preview__item"
                  >
                    <div className="mapping-preview__label-row">
                      <label>{field.attributeName}</label>
                      <div className="mapping-preview__meta">
                        {field.isRequired ? (
                          <span className="mapping-preview__required">
                            Bắt buộc
                          </span>
                        ) : null}
                        <span className="mapping-preview__order">
                          Thứ tự: {field.displayOrder}
                        </span>
                      </div>
                    </div>

                    {field.attributeType === "Select" ? (
                      <select disabled>
                        <option>{field.placeholder}</option>
                      </select>
                    ) : field.attributeType === "Boolean" ? (
                      <div className="mapping-preview__checkbox">
                        <input type="checkbox" disabled />
                        <span>{field.placeholder}</span>
                      </div>
                    ) : (
                      <input type="text" value={field.placeholder} disabled readOnly />
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <BaseModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalMode === "create" ? "Thêm ánh xạ" : "Chỉnh sửa ánh xạ"}
        description={
          modalMode === "create"
            ? "Chọn danh mục, thuộc tính và thứ tự hiển thị để tạo ánh xạ mới."
            : "Cập nhật thông tin ánh xạ đang có."
        }
        maxWidth="560px"
      >
        <form className="mapping-modal__form" onSubmit={handleSubmit}>
          <div className="mapping-modal__field">
            <label htmlFor="mapping-form-category">Danh mục</label>
            <select
              id="mapping-form-category"
              value={formState.categoryId}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  categoryId: event.target.value,
                }))
              }
              disabled={isSubmitting}
            >
              <option value="">Chọn danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mapping-modal__field">
            <label htmlFor="mapping-form-attribute">Thuộc tính</label>
            <select
              id="mapping-form-attribute"
              value={formState.attributeId}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  attributeId: event.target.value,
                }))
              }
              disabled={isSubmitting}
            >
              <option value="">Chọn thuộc tính</option>
              {attributes.map((attribute) => (
                <option key={attribute.id} value={attribute.id}>
                  {attribute.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mapping-modal__field">
            <label htmlFor="mapping-form-order">Thứ tự hiển thị</label>
            <input
              id="mapping-form-order"
              type="number"
              min="1"
              value={formState.displayOrder}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  displayOrder: event.target.value,
                }))
              }
              disabled={isSubmitting}
            />
          </div>

          <label className="mapping-modal__checkbox">
            <input
              type="checkbox"
              checked={formState.isRequired}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  isRequired: event.target.checked,
                }))
              }
              disabled={isSubmitting}
            />
            Bắt buộc khi đăng bài
          </label>

          {formError ? (
            <div className="mapping-modal__error">{formError}</div>
          ) : null}

          <div className="mapping-modal__actions">
            <button
              type="button"
              className="mapping-modal__cancel"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="mapping-modal__submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Đang lưu..."
                : modalMode === "create"
                  ? "Tạo ánh xạ"
                  : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </BaseModal>

      <ConfirmDialog
        isOpen={Boolean(confirmMapping)}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Xác nhận"
        cancelText="Hủy"
        tone={confirmAction === "delete" ? "danger" : "neutral"}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default CategoryAttributeMappingPage;
