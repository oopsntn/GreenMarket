import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./CategoryAttributeMappingPage.css";
import { categoryService, type Category } from "../services/categoryService";
import { attributeService, type Attribute } from "../services/attributeService";
import {
  categoryMappingService,
  type CategoryAttributeMapping,
  type CategoryMappingPreview,
  type MappingAttributeType,
  type MappingStatus,
} from "../services/categoryMappingService";

type ModalMode = "create" | "edit";

type MappingFormState = {
  categoryId: string;
  attributeId: string;
  isRequired: boolean;
  displayOrder: string;
};

const PAGE_SIZE = 5;

const ATTRIBUTE_TYPE_LABELS: Record<MappingAttributeType, string> = {
  Text: "Van ban",
  Number: "So",
  Select: "Danh sach chon",
  Boolean: "Dung / Sai",
};

const STATUS_LABELS: Record<MappingStatus, string> = {
  Active: "Dang hoat dong",
  Disabled: "Da tat",
};

const EMPTY_FORM: MappingFormState = {
  categoryId: "",
  attributeId: "",
  isRequired: false,
  displayOrder: "1",
};

function badgeStatusClass(status: MappingStatus) {
  return status === "Active" ? "active" : "inactive";
}

export default function CategoryAttributeMappingPage() {
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [activeMapping, setActiveMapping] = useState<CategoryAttributeMapping | null>(null);
  const [formState, setFormState] = useState<MappingFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmMapping, setConfirmMapping] = useState<CategoryAttributeMapping | null>(null);
  const [confirmAction, setConfirmAction] = useState<"disable" | "enable" | "delete">("disable");
  const [isConfirming, setIsConfirming] = useState(false);

  const [previewCategoryId, setPreviewCategoryId] = useState<number | null>(null);

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
      setErrorMessage(error instanceof Error ? error.message : "Khong the tai du lieu nen.");
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
      setErrorMessage(error instanceof Error ? error.message : "Khong the tai danh sach anh xa.");
      setMappings([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm]);

  const loadPreview = useCallback(async (categoryId: number) => {
    setPreviewLoading(true);

    try {
      const response = await categoryMappingService.previewCategory(categoryId);
      setPreview(response);
    } catch (error) {
      setPreview(null);
      setToastMessage(error instanceof Error ? error.message : "Khong the tai ban xem truoc.");
    } finally {
      setPreviewLoading(false);
    }
  }, []);

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

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setToastMessage(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const pageLabel = useMemo(() => {
    if (!totalItems) {
      return "Khong co du lieu";
    }

    return `Trang ${currentPage} / ${totalPages}`;
  }, [currentPage, totalItems, totalPages]);

  function openCreateModal() {
    setModalMode("create");
    setActiveMapping(null);
    setFormState(EMPTY_FORM);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(mapping: CategoryAttributeMapping) {
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
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }

    setIsModalOpen(false);
    setActiveMapping(null);
    setFormError(null);
    setFormState(EMPTY_FORM);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
        setToastMessage("Da tao anh xa moi.");
      } else if (activeMapping) {
        await categoryMappingService.updateMapping(activeMapping.id, payload);
        setToastMessage("Da cap nhat anh xa.");
      }

      setIsModalOpen(false);
      setFormState(EMPTY_FORM);
      await loadMappings();

      if (payload.categoryId) {
        setPreviewCategoryId(payload.categoryId);
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Khong the luu anh xa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function askConfirm(mapping: CategoryAttributeMapping, action: "disable" | "enable" | "delete") {
    setConfirmMapping(mapping);
    setConfirmAction(action);
  }

  async function handleConfirm() {
    if (!confirmMapping) {
      return;
    }

    setIsConfirming(true);

    try {
      if (confirmAction === "delete") {
        await categoryMappingService.deleteMapping(confirmMapping.id);
        setToastMessage("Da xoa anh xa.");
      } else {
        const nextStatus: MappingStatus = confirmAction === "enable" ? "Active" : "Disabled";
        await categoryMappingService.updateMappingStatus(confirmMapping.id, nextStatus);
        setToastMessage(nextStatus === "Active" ? "Da bat lai anh xa." : "Da tat anh xa.");
      }

      setConfirmMapping(null);
      await loadMappings();

      if (previewCategoryId) {
        await loadPreview(previewCategoryId);
      }
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Khong the cap nhat anh xa.");
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="management-page">
      <section className="management-page__header">
        <div>
          <h1>Anh xa danh muc - thuoc tinh</h1>
          <p>Cau hinh moi danh muc se su dung nhung thuoc tinh nao va xem truoc cau truc form dang bai.</p>
        </div>
        <button type="button" className="primary-button" onClick={openCreateModal}>
          + Them anh xa
        </button>
      </section>

      <section className="management-page__card">
        <div className="management-page__toolbar">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tim theo danh muc, thuoc tinh hoac ma thuoc tinh"
          />
        </div>
      </section>

      <section className="management-page__card">
        <div className="management-page__table-header">
          <div>
            <h2>Danh sach anh xa</h2>
            <p>Theo doi danh muc, thuoc tinh, thu tu hien thi va trang thai su dung.</p>
          </div>
        </div>

        {loading ? (
          <div className="management-page__state">Dang tai danh sach anh xa...</div>
        ) : errorMessage ? (
          <div className="management-page__state management-page__state--error">
            <p>{errorMessage}</p>
            <button type="button" className="secondary-button" onClick={loadMappings}>
              Tai lai
            </button>
          </div>
        ) : mappings.length === 0 ? (
          <div className="management-page__state">
            <p>Khong tim thay anh xa nao phu hop voi bo loc hien tai.</p>
          </div>
        ) : (
          <div className="data-table__wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Danh muc</th>
                  <th>Thuoc tinh</th>
                  <th>Ma thuoc tinh</th>
                  <th>Kieu du lieu</th>
                  <th>Bat buoc</th>
                  <th>Thu tu</th>
                  <th>Trang thai</th>
                  <th>Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((mapping) => (
                  <tr key={mapping.id}>
                    <td>{mapping.categoryName}</td>
                    <td>{mapping.attributeName}</td>
                    <td>{mapping.attributeCode}</td>
                    <td>{ATTRIBUTE_TYPE_LABELS[mapping.attributeType]}</td>
                    <td>{mapping.isRequired ? "Co" : "Khong"}</td>
                    <td>{mapping.displayOrder}</td>
                    <td>
                      <span className={`table-badge table-badge--${badgeStatusClass(mapping.status)}`}>
                        {STATUS_LABELS[mapping.status]}
                      </span>
                    </td>
                    <td>
                      <div className="data-table__actions">
                        <button type="button" className="table-button table-button--secondary" onClick={() => openEditModal(mapping)}>
                          Sua
                        </button>
                        {mapping.status === "Active" ? (
                          <button
                            type="button"
                            className="table-button table-button--danger"
                            onClick={() => askConfirm(mapping, "disable")}
                          >
                            Tat
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="table-button table-button--success"
                            onClick={() => askConfirm(mapping, "enable")}
                          >
                            Bat lai
                          </button>
                        )}
                        <button type="button" className="table-button" onClick={() => askConfirm(mapping, "delete")}>
                          Xoa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="management-page__pagination">
          <span>{pageLabel}</span>
          <div className="management-page__pagination-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Truoc
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              Sau
            </button>
          </div>
        </div>
      </section>

      <section className="management-page__card">
        <div className="management-page__table-header">
          <div>
            <h2>Xem truoc form theo danh muc</h2>
            <p>Chon danh muc de kiem tra nhanh bo thuoc tinh se hien thi tren form dang bai.</p>
          </div>
          <select
            value={previewCategoryId ?? ""}
            onChange={(event) => setPreviewCategoryId(event.target.value ? Number(event.target.value) : null)}
            disabled={metaLoading}
          >
            <option value="">Chon danh muc</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {previewLoading ? (
          <div className="management-page__state">Dang tai ban xem truoc...</div>
        ) : !preview ? (
          <div className="management-page__state">
            <p>Chua co ban xem truoc cho danh muc dang chon.</p>
          </div>
        ) : preview.fields.length === 0 ? (
          <div className="management-page__state">
            <p>Danh muc nay chua duoc gan thuoc tinh nao.</p>
          </div>
        ) : (
          <div className="management-page__preview-list">
            <h3>{preview.categoryName}</h3>
            <div className="management-page__preview-grid">
              {preview.fields.map((field) => (
                <article key={field.attributeId} className="management-page__preview-item">
                  <div className="management-page__preview-head">
                    <strong>{field.attributeName}</strong>
                    <span>{ATTRIBUTE_TYPE_LABELS[field.attributeType]}</span>
                  </div>
                  <p>Ma: {field.attributeCode}</p>
                  <p>Thu tu: {field.displayOrder}</p>
                  <p>Bat buoc: {field.isRequired ? "Co" : "Khong"}</p>
                  <p>Placeholder: {field.placeholder}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="management-page__modal-backdrop">
          <div className="management-page__modal">
            <div className="management-page__modal-header">
              <div>
                <h3>{modalMode === "create" ? "Them anh xa moi" : "Chinh sua anh xa"}</h3>
                <p>
                  {modalMode === "create"
                    ? "Chon danh muc, thuoc tinh va thu tu hien thi de tao anh xa moi."
                    : "Cap nhat thong tin anh xa dang co."}
                </p>
              </div>
              <button type="button" className="secondary-button" onClick={closeModal}>
                Dong
              </button>
            </div>

            <form className="management-page__form" onSubmit={handleSubmit}>
              <label>
                Danh muc
                <select
                  value={formState.categoryId}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, categoryId: event.target.value }))
                  }
                  disabled={isSubmitting}
                >
                  <option value="">Chon danh muc</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Thuoc tinh
                <select
                  value={formState.attributeId}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, attributeId: event.target.value }))
                  }
                  disabled={isSubmitting}
                >
                  <option value="">Chon thuoc tinh</option>
                  {attributes.map((attribute) => (
                    <option key={attribute.id} value={attribute.id}>
                      {attribute.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Thu tu hien thi
                <input
                  type="number"
                  min="1"
                  value={formState.displayOrder}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, displayOrder: event.target.value }))
                  }
                  disabled={isSubmitting}
                />
              </label>

              <label className="management-page__checkbox">
                <input
                  type="checkbox"
                  checked={formState.isRequired}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, isRequired: event.target.checked }))
                  }
                  disabled={isSubmitting}
                />
                Bat buoc khi dang bai
              </label>

              {formError && <div className="management-page__form-error">{formError}</div>}

              <div className="management-page__form-actions">
                <button type="button" className="secondary-button" onClick={closeModal} disabled={isSubmitting}>
                  Huy
                </button>
                <button type="submit" className="primary-button" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Dang luu..."
                    : modalMode === "create"
                      ? "Tao anh xa"
                      : "Luu thay doi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmMapping && (
        <div className="management-page__modal-backdrop">
          <div className="management-page__modal management-page__modal--compact">
            <div className="management-page__modal-header">
              <div>
                <h3>
                  {confirmAction === "delete"
                    ? "Xoa anh xa"
                    : confirmAction === "enable"
                      ? "Bat lai anh xa"
                      : "Tat anh xa"}
                </h3>
                <p>
                  {confirmAction === "delete"
                    ? `Ban co chac muon xoa anh xa "${confirmMapping.categoryName} - ${confirmMapping.attributeName}"?`
                    : confirmAction === "enable"
                      ? `Ban co chac muon bat lai anh xa "${confirmMapping.categoryName} - ${confirmMapping.attributeName}"?`
                      : `Ban co chac muon tat anh xa "${confirmMapping.categoryName} - ${confirmMapping.attributeName}"?`}
                </p>
              </div>
            </div>
            <div className="management-page__form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setConfirmMapping(null)}
                disabled={isConfirming}
              >
                Huy
              </button>
              <button type="button" className="primary-button" onClick={handleConfirm} disabled={isConfirming}>
                {isConfirming ? "Dang xu ly..." : "Xac nhan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && <div className="management-page__toast">{toastMessage}</div>}
    </div>
  );
}
