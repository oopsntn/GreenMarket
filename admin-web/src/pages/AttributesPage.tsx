import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { attributeService } from "../services/attributeService";
import { categoryMappingService } from "../services/categoryMappingService";
import type {
  Attribute,
  AttributeFormState,
  AttributeStatus,
  AttributeType,
} from "../types/attribute";
import "./AttributesPage.css";

type ConfirmAction = "disable" | "enable";

type ConfirmState = {
  isOpen: boolean;
  attributeId: number | null;
  action: ConfirmAction | null;
};

const PAGE_SIZE = 5;

const statusFilterOptions: Array<AttributeStatus | "All"> = [
  "All",
  "Active",
  "Disabled",
];

const typeFilterOptions: Array<AttributeType | "All"> = [
  "All",
  "Text",
  "Number",
  "Select",
  "Boolean",
];

const statusLabels: Record<AttributeStatus | "All", string> = {
  All: "Tất cả trạng thái",
  Active: "Đang bật",
  Disabled: "Đang tắt",
};

const typeLabels: Record<AttributeType | "All", string> = {
  All: "Tất cả kiểu dữ liệu",
  Text: "Văn bản",
  Number: "Số",
  Select: "Danh sách lựa chọn",
  Boolean: "Đúng / Sai",
};

const buildUsedInLabels = (
  attributes: Attribute[],
  mappings: Awaited<ReturnType<typeof categoryMappingService.getMappings>>["data"],
): Attribute[] =>
  attributes.map((attribute) => {
    const usedIn = Array.from(
      new Set(
        mappings
          .filter(
            (mapping) =>
              mapping.status === "Active" &&
              mapping.attributeId === attribute.id &&
              mapping.categoryName.trim().length > 0,
          )
          .map((mapping) => mapping.categoryName),
      ),
    );

    return {
      ...attribute,
      usedIn,
    };
  });

function AttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedAttributeId, setSelectedAttributeId] = useState<number | null>(
    null,
  );
  const [formData, setFormData] = useState<AttributeFormState>(
    attributeService.getEmptyForm(),
  );
  const [formError, setFormError] = useState("");

  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    AttributeStatus | "All"
  >("All");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<
    AttributeType | "All"
  >("All");
  const [page, setPage] = useState(1);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    attributeId: null,
    action: null,
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, tone: ToastItem["tone"] = "success") => {
    const toastId = Date.now() + Math.random();

    setToasts((prev) => [...prev, { id: toastId, message, tone }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    }, 2600);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const loadAttributes = async (showLoader = false) => {
    try {
      if (showLoader) {
        setIsInitialLoading(true);
      }

      setPageError("");

      const [attributeData, mappingData] = await Promise.all([
        attributeService.getAttributes(),
        categoryMappingService.getMappings({ page: 1, pageSize: 1000 }),
      ]);

      setAttributes(buildUsedInLabels(attributeData, mappingData.data));
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách thuộc tính.",
      );
    } finally {
      if (showLoader) {
        setIsInitialLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadAttributes(true);
  }, []);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedAttributeId(null);
    setFormData(attributeService.getEmptyForm());
    setFormError("");
    setIsModalOpen(true);
  };

  const openViewModal = (attribute: Attribute) => {
    setModalMode("view");
    setSelectedAttributeId(attribute.id);
    setFormData({
      name: attribute.name,
      code: attribute.code,
      type: attribute.type,
      optionsText: attribute.options.join(", "),
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (attribute: Attribute) => {
    setModalMode("edit");
    setSelectedAttributeId(attribute.id);
    setFormData({
      name: attribute.name,
      code: attribute.code,
      type: attribute.type,
      optionsText: attribute.options.join(", "),
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedAttributeId(null);
    setFormError("");
    setIsModalOpen(false);
  };

  const openConfirmDialog = (attributeId: number, action: ConfirmAction) => {
    setConfirmState({
      isOpen: true,
      attributeId,
      action,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmState({
      isOpen: false,
      attributeId: null,
      action: null,
    });
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "name" && !prev.code.trim()
        ? { code: attributeService.buildCode(value, "") }
        : {}),
    }));

    if (formError) {
      setFormError("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setFormError("");

      attributeService.validateAttributeForm(
        attributes,
        formData,
        selectedAttributeId,
      );

      if (modalMode === "add") {
        await attributeService.createAttribute(formData);
        await loadAttributes();
        showToast("Đã thêm thuộc tính thành công.");
      }

      if (modalMode === "edit" && selectedAttributeId !== null) {
        const currentAttribute = attributes.find(
          (attribute) => attribute.id === selectedAttributeId,
        );

        if (!currentAttribute) {
          setFormError("Thuộc tính đã chọn không còn tồn tại.");
          return;
        }

        await attributeService.updateAttribute(
          selectedAttributeId,
          formData,
          currentAttribute.status,
        );

        await loadAttributes();
        showToast("Đã cập nhật thuộc tính thành công.");
      }

      closeModal();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Không thể lưu thuộc tính.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAction = async () => {
    if (confirmState.attributeId === null || confirmState.action === null) {
      return;
    }

    const targetAttribute = attributes.find(
      (attribute) => attribute.id === confirmState.attributeId,
    );

    if (!targetAttribute) {
      closeConfirmDialog();
      return;
    }

    try {
      setIsStatusUpdating(confirmState.attributeId);

      const nextStatus: AttributeStatus =
        confirmState.action === "disable" ? "Disabled" : "Active";

      await attributeService.updateAttribute(
        targetAttribute.id,
        {
          name: targetAttribute.name,
          code: targetAttribute.code,
          type: targetAttribute.type,
          optionsText: targetAttribute.options.join(", "),
        },
        nextStatus,
      );

      await loadAttributes();
      showToast(
        confirmState.action === "disable"
          ? "Đã tắt thuộc tính."
          : "Đã bật lại thuộc tính.",
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái thuộc tính.",
        "error",
      );
    } finally {
      setIsStatusUpdating(null);
      closeConfirmDialog();
    }
  };

  const filteredAttributes = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return attributes.filter((attribute) => {
      const matchesKeyword =
        keyword.length === 0 ||
        attribute.name.toLowerCase().includes(keyword) ||
        attribute.code.toLowerCase().includes(keyword);

      const matchesStatus =
        selectedStatusFilter === "All" ||
        attribute.status === selectedStatusFilter;

      const matchesType =
        selectedTypeFilter === "All" || attribute.type === selectedTypeFilter;

      return matchesKeyword && matchesStatus && matchesType;
    });
  }, [attributes, searchKeyword, selectedStatusFilter, selectedTypeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAttributes.length / PAGE_SIZE));

  const paginatedAttributes = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredAttributes.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredAttributes, page]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedStatusFilter, selectedTypeFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const selectedAttribute =
    selectedAttributeId !== null
      ? attributes.find((attribute) => attribute.id === selectedAttributeId) ??
        null
      : null;

  const confirmDialogTitle =
    confirmState.action === "disable"
      ? "Tắt thuộc tính"
      : "Bật lại thuộc tính";

  const confirmDialogMessage =
    confirmState.action === "disable"
      ? "Thuộc tính sẽ ngừng xuất hiện trong các luồng cấu hình cho đến khi được bật lại."
      : "Thuộc tính sẽ hoạt động trở lại và có thể tiếp tục được dùng trong taxonomy.";

  return (
    <div className="attributes-page">
      <PageHeader
        title="Quản lý thuộc tính"
        description="Quản lý các thuộc tính dùng cho bài đăng, danh mục và cấu hình phân loại trên GreenMarket."
        actions={
          <button className="primary-button" onClick={openAddModal}>
            + Thêm thuộc tính
          </button>
        }
      />

      <SearchToolbar
        placeholder="Tìm theo tên thuộc tính hoặc mã thuộc tính"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Lọc thuộc tính"
        filterSummaryItems={[
          statusLabels[selectedStatusFilter],
          typeLabels[selectedTypeFilter],
        ]}
      />

      {showFilters ? (
        <SectionCard
          title="Bộ lọc thuộc tính"
          description="Thu hẹp danh sách theo trạng thái hoạt động và kiểu dữ liệu của thuộc tính."
          bodyClassName="attributes-filters"
        >
          <div className="attributes-filters__field">
            <label htmlFor="attributes-status-filter">Trạng thái</label>
            <select
              id="attributes-status-filter"
              value={selectedStatusFilter}
              onChange={(event) =>
                setSelectedStatusFilter(
                  event.target.value as AttributeStatus | "All",
                )
              }
            >
              {statusFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {statusLabels[option]}
                </option>
              ))}
            </select>
          </div>

          <div className="attributes-filters__field">
            <label htmlFor="attributes-type-filter">Kiểu dữ liệu</label>
            <select
              id="attributes-type-filter"
              value={selectedTypeFilter}
              onChange={(event) =>
                setSelectedTypeFilter(
                  event.target.value as AttributeType | "All",
                )
              }
            >
              {typeFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {typeLabels[option]}
                </option>
              ))}
            </select>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Danh sách thuộc tính"
        description="Theo dõi mã thuộc tính, kiểu dữ liệu, phạm vi sử dụng và trạng thái bật/tắt."
      >
        {pageError ? (
          <EmptyState
            title="Không thể tải danh sách thuộc tính"
            description={pageError}
            actionLabel="Thử tải lại"
            onAction={() => {
              void loadAttributes(true);
            }}
          />
        ) : isInitialLoading ? (
          <EmptyState
            title="Đang tải danh sách thuộc tính"
            description="Hệ thống đang đồng bộ dữ liệu thuộc tính từ máy chủ."
          />
        ) : filteredAttributes.length === 0 ? (
          <EmptyState
            title="Không tìm thấy thuộc tính"
            description="Hãy đổi từ khóa tìm kiếm hoặc điều kiện lọc để xem dữ liệu."
          />
        ) : (
          <>
            <div className="attributes-table-wrapper">
              <table className="attributes-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên thuộc tính</th>
                    <th>Mã thuộc tính</th>
                    <th>Kiểu dữ liệu</th>
                    <th>Đang dùng trong</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAttributes.map((attribute) => (
                    <tr key={attribute.id}>
                      <td>#{attribute.id}</td>
                      <td>{attribute.name}</td>
                      <td>{attribute.code}</td>
                      <td>{typeLabels[attribute.type]}</td>
                      <td>
                        {attribute.usedIn.length > 0
                          ? attribute.usedIn.join(", ")
                          : "Chưa gắn danh mục"}
                      </td>
                      <td>{statusLabels[attribute.status]}</td>
                      <td>
                        <div className="attributes-actions">
                          <button
                            className="attributes-actions__view"
                            onClick={() => openViewModal(attribute)}
                          >
                            Xem
                          </button>
                          <button
                            className="attributes-actions__edit"
                            onClick={() => openEditModal(attribute)}
                          >
                            Sửa
                          </button>
                          <button
                            className={
                              attribute.status === "Active"
                                ? "attributes-actions__disable"
                                : "attributes-actions__enable"
                            }
                            disabled={isStatusUpdating === attribute.id}
                            onClick={() =>
                              openConfirmDialog(
                                attribute.id,
                                attribute.status === "Active"
                                  ? "disable"
                                  : "enable",
                              )
                            }
                          >
                            {isStatusUpdating === attribute.id
                              ? "Đang xử lý..."
                              : attribute.status === "Active"
                                ? "Tắt"
                                : "Bật lại"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="attributes-pagination">
              <span className="attributes-pagination__info">
                Trang {page} / {totalPages}
              </span>
              <div className="attributes-pagination__actions">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Trước
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Tiếp
                </button>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      <BaseModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === "add"
            ? "Thêm thuộc tính"
            : modalMode === "edit"
              ? "Chỉnh sửa thuộc tính"
              : "Chi tiết thuộc tính"
        }
        description={
          modalMode === "add"
            ? "Tạo một thuộc tính mới để dùng trong taxonomy và biểu mẫu dữ liệu."
            : modalMode === "edit"
              ? "Cập nhật thông tin và kiểu dữ liệu của thuộc tính đã có."
              : "Xem thông tin chi tiết của thuộc tính đang được cấu hình trong hệ thống."
        }
      >
        <form className="attributes-modal__form" onSubmit={handleSubmit}>
          <div className="attributes-modal__field">
            <label htmlFor="attribute-name">Tên thuộc tính</label>
            <input
              id="attribute-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ví dụ: Chiều cao cây"
              disabled={modalMode === "view"}
            />
          </div>

          <div className="attributes-modal__field">
            <label htmlFor="attribute-code">Mã thuộc tính</label>
            <input
              id="attribute-code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Ví dụ: plant_height"
              disabled={modalMode === "view"}
            />
          </div>

          <div className="attributes-modal__field">
            <label htmlFor="attribute-type">Kiểu dữ liệu</label>
            <select
              id="attribute-type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              disabled={modalMode === "view"}
            >
              {(["Text", "Number", "Select", "Boolean"] as AttributeType[]).map(
                (type) => (
                  <option key={type} value={type}>
                    {typeLabels[type]}
                  </option>
                ),
              )}
            </select>
          </div>

          {formData.type === "Select" ? (
            <div className="attributes-modal__field">
              <label htmlFor="attribute-options">Danh sách lựa chọn</label>
              <input
                id="attribute-options"
                name="optionsText"
                value={formData.optionsText}
                onChange={handleChange}
                placeholder="Ví dụ: Nhỏ, Trung bình, Lớn"
                disabled={modalMode === "view"}
              />
              <p className="attributes-modal__hint">
                Nhập các giá trị cách nhau bằng dấu phẩy.
              </p>
            </div>
          ) : null}

          {selectedAttribute && modalMode === "view" ? (
            <div className="attributes-modal__field">
              <label>Danh mục đang dùng</label>
              <div className="attributes-modal__preview">
                {selectedAttribute.usedIn.length > 0 ? (
                  selectedAttribute.usedIn.map((item) => (
                    <span key={item} className="attributes-modal__preview-chip">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="attributes-modal__hint">
                    Chưa gắn với danh mục nào.
                  </span>
                )}
              </div>
            </div>
          ) : null}

          {formError ? <p className="attributes-modal__error">{formError}</p> : null}

          <div className="attributes-modal__actions">
            <button
              type="button"
              className="attributes-modal__cancel"
              onClick={closeModal}
            >
              {modalMode === "view" ? "Đóng" : "Hủy"}
            </button>

            {modalMode !== "view" ? (
              <button
                type="submit"
                className="attributes-modal__submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang lưu..." : "Lưu thuộc tính"}
              </button>
            ) : null}
          </div>
        </form>
      </BaseModal>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmDialogTitle}
        message={confirmDialogMessage}
        onCancel={closeConfirmDialog}
        onConfirm={() => {
          void handleConfirmAction();
        }}
        confirmText={confirmState.action === "disable" ? "Tắt" : "Bật lại"}
        tone={confirmState.action === "disable" ? "danger" : "success"}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default AttributesPage;
