import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { categoryMappingService } from "../services/categoryMappingService";
import { categoryService } from "../services/categoryService";
import type {
  Category,
  CategoryFormState,
  CategoryStatus,
} from "../types/category";
import "./CategoriesPage.css";

type ConfirmAction = "disable" | "enable";

type ConfirmState = {
  isOpen: boolean;
  categoryId: number | null;
  action: ConfirmAction | null;
};

const statusFilterOptions: Array<CategoryStatus | "All"> = [
  "All",
  "Active",
  "Disabled",
];

const statusLabels: Record<CategoryStatus | "All", string> = {
  All: "Tất cả trạng thái",
  Active: "Đang hoạt động",
  Disabled: "Đã tắt",
};

const PAGE_SIZE = 5;

function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [formData, setFormData] = useState<CategoryFormState>(
    categoryService.getEmptyForm(),
  );
  const [formError, setFormError] = useState("");

  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    CategoryStatus | "All"
  >("All");
  const [page, setPage] = useState(1);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    categoryId: null,
    action: null,
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const loadCategories = async (showLoader = false) => {
    try {
      if (showLoader) {
        setIsInitialLoading(true);
      }

      setPageError("");

      const [categoryData, mappingData] = await Promise.all([
        categoryService.getCategories(),
        categoryMappingService.getMappings({ page: 1, pageSize: 500 }),
      ]);

      const activeUniqueAttributeIdsByCategory = new Map<number, Set<number>>();

      mappingData.data.forEach((mapping) => {
        if (mapping.status !== "Active") return;

        const existingSet =
          activeUniqueAttributeIdsByCategory.get(mapping.categoryId) ??
          new Set<number>();

        existingSet.add(mapping.attributeId);
        activeUniqueAttributeIdsByCategory.set(mapping.categoryId, existingSet);
      });

      const hydratedCategories = categoryData.map((category) => ({
        ...category,
        attributesCount:
          activeUniqueAttributeIdsByCategory.get(category.id)?.size ?? 0,
      }));

      setCategories(hydratedCategories);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Không thể tải danh mục.",
      );
    } finally {
      if (showLoader) {
        setIsInitialLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadCategories(true);
  }, []);

  const showToast = (message: string, tone: ToastItem["tone"] = "success") => {
    const toastId = Date.now() + Math.random();

    setToasts((prev) => [
      ...prev,
      {
        id: toastId,
        message,
        tone,
      },
    ]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    }, 2600);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const openAddModal = () => {
    setModalMode("add");
    setSelectedCategoryId(null);
    setFormData(categoryService.getEmptyForm());
    setFormError("");
    setIsModalOpen(true);
  };

  const openViewModal = (category: Category) => {
    setModalMode("view");
    setSelectedCategoryId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setModalMode("edit");
    setSelectedCategoryId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedCategoryId(null);
    setFormError("");
    setIsModalOpen(false);
  };

  const openConfirmDialog = (categoryId: number, action: ConfirmAction) => {
    setConfirmState({
      isOpen: true,
      categoryId,
      action,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmState({
      isOpen: false,
      categoryId: null,
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
      ...(name === "name" && !prev.slug.trim()
        ? { slug: categoryService.buildSlug(value, "") }
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

      categoryService.validateCategoryForm(
        categories,
        formData,
        selectedCategoryId,
      );

      if (modalMode === "add") {
        await categoryService.createCategory(formData);
        await loadCategories();
        showToast("Đã thêm danh mục thành công.");
      }

      if (modalMode === "edit" && selectedCategoryId !== null) {
        const currentCategory = categories.find(
          (category) => category.id === selectedCategoryId,
        );

        if (!currentCategory) {
          setFormError("Danh mục đã chọn không còn tồn tại.");
          return;
        }

        await categoryService.updateCategory(
          selectedCategoryId,
          formData,
          currentCategory.status,
        );

        await loadCategories();
        showToast("Đã cập nhật danh mục thành công.");
      }

      closeModal();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Không thể lưu danh mục.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAction = async () => {
    if (confirmState.categoryId === null || confirmState.action === null) {
      return;
    }

    const targetCategory = categories.find(
      (category) => category.id === confirmState.categoryId,
    );

    if (!targetCategory) {
      closeConfirmDialog();
      return;
    }

    try {
      setIsStatusUpdating(confirmState.categoryId);

      const nextStatus: CategoryStatus =
        confirmState.action === "disable" ? "Disabled" : "Active";

      await categoryService.updateCategory(
        targetCategory.id,
        {
          name: targetCategory.name,
          slug: targetCategory.slug,
        },
        nextStatus,
      );

      await loadCategories();
      showToast(
        confirmState.action === "disable"
          ? "Đã tắt danh mục."
          : "Đã bật lại danh mục.",
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái danh mục.",
        "error",
      );
    } finally {
      setIsStatusUpdating(null);
      closeConfirmDialog();
    }
  };

  const filteredCategories = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesKeyword =
        keyword.length === 0 ||
        category.name.toLowerCase().includes(keyword) ||
        category.slug.toLowerCase().includes(keyword);

      const matchesStatus =
        selectedStatusFilter === "All" ||
        category.status === selectedStatusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [categories, searchKeyword, selectedStatusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / PAGE_SIZE),
  );

  const paginatedCategories = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredCategories.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredCategories, page]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedStatusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const confirmDialogTitle =
    confirmState.action === "disable" ? "Tắt danh mục" : "Bật lại danh mục";

  const confirmDialogMessage =
    confirmState.action === "disable"
      ? "Danh mục sẽ không còn dùng được trong luồng cấu hình và gán thuộc tính cho tới khi được bật lại."
      : "Danh mục sẽ hoạt động trở lại và có thể tiếp tục được dùng trong các luồng cấu hình.";

  return (
    <div className="categories-page">
      <PageHeader
        title="Quản lý danh mục"
        description="Quản lý danh mục cây cảnh và thông tin cơ bản dùng trong hệ thống."
        actions={
          <button className="primary-button" onClick={openAddModal}>
            + Thêm danh mục
          </button>
        }
      />

      <SearchToolbar
        placeholder="Tìm theo tên danh mục hoặc slug"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Lọc theo trạng thái"
        filterSummaryItems={[statusLabels[selectedStatusFilter]]}
      />

      {showFilters ? (
        <SectionCard
          title="Bộ lọc danh mục"
          description="Thu hẹp danh sách theo trạng thái hoạt động của danh mục."
        >
          <div className="categories-page__filters">
            <div className="categories-page__filter-field">
              <label htmlFor="categories-status-filter">Trạng thái</label>
              <select
                id="categories-status-filter"
                value={selectedStatusFilter}
                onChange={(event) =>
                  setSelectedStatusFilter(
                    event.target.value as CategoryStatus | "All",
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
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Danh sách danh mục"
        description="Theo dõi slug, số thuộc tính đang gắn và trạng thái sử dụng của từng danh mục."
      >
        {pageError ? (
          <EmptyState
            title="Không thể tải danh mục"
            description={pageError}
            actionLabel="Thử tải lại"
            onAction={() => {
              void loadCategories(true);
            }}
          />
        ) : isInitialLoading ? (
          <EmptyState
            title="Đang tải danh mục..."
            description="Hệ thống đang đồng bộ dữ liệu danh mục từ máy chủ."
          />
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            title="Không tìm thấy danh mục phù hợp"
            description="Hãy đổi từ khóa tìm kiếm hoặc trạng thái lọc để xem dữ liệu."
          />
        ) : (
          <>
            <div className="categories-page__table-wrap">
              <table className="categories-page__table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên danh mục</th>
                    <th>Slug</th>
                    <th>Thuộc tính đang gắn</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCategories.map((category) => (
                    <tr key={category.id}>
                      <td>#{category.id}</td>
                      <td>{category.name}</td>
                      <td>{category.slug}</td>
                      <td>{category.attributesCount ?? 0}</td>
                      <td>
                        <StatusBadge
                          tone={category.status === "Active" ? "green" : "gray"}
                        >
                          {category.status === "Active"
                            ? "Đang hoạt động"
                            : "Đã tắt"}
                        </StatusBadge>
                      </td>
                      <td>
                        <div className="categories-page__actions">
                          <button
                            className="soft-button"
                            onClick={() => openViewModal(category)}
                          >
                            Xem
                          </button>
                          <button
                            className="secondary-button"
                            onClick={() => openEditModal(category)}
                          >
                            Sửa
                          </button>
                          <button
                            className={
                              category.status === "Active"
                                ? "danger-button"
                                : "success-button"
                            }
                            disabled={isStatusUpdating === category.id}
                            onClick={() =>
                              openConfirmDialog(
                                category.id,
                                category.status === "Active"
                                  ? "disable"
                                  : "enable",
                              )
                            }
                          >
                            {isStatusUpdating === category.id
                              ? "Đang xử lý..."
                              : category.status === "Active"
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

            <div className="categories-page__pagination">
              <span>
                Trang {page} / {totalPages}
              </span>
              <div className="categories-page__pagination-actions">
                <button
                  className="soft-button"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Trước
                </button>
                <button
                  className="soft-button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
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
            ? "Thêm danh mục"
            : modalMode === "edit"
              ? "Chỉnh sửa danh mục"
              : "Chi tiết danh mục"
        }
        description={
          modalMode === "add"
            ? "Tạo một danh mục mới để dùng trong taxonomy và cấu hình thuộc tính."
            : modalMode === "edit"
              ? "Cập nhật thông tin cơ bản của danh mục đã có."
              : "Xem thông tin chi tiết của danh mục đang được cấu hình trong hệ thống."
        }
      >
        <form className="categories-page__form" onSubmit={handleSubmit}>
          <label>
            Tên danh mục
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ví dụ: Cây nội thất"
              disabled={modalMode === "view"}
            />
          </label>

          <label>
            Slug
            <input
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="Ví dụ: cay-noi-that"
              disabled={modalMode === "view"}
            />
          </label>

          {formError ? (
            <p className="categories-page__form-error">{formError}</p>
          ) : null}

          <div className="categories-page__form-actions">
            <button type="button" className="soft-button" onClick={closeModal}>
              {modalMode === "view" ? "Đóng" : "Hủy"}
            </button>

            {modalMode !== "view" ? (
              <button
                type="submit"
                className="primary-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang lưu..." : "Lưu danh mục"}
              </button>
            ) : null}
          </div>
        </form>
      </BaseModal>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmDialogTitle}
        message={confirmDialogMessage}
        onClose={closeConfirmDialog}
        onConfirm={() => {
          void handleConfirmAction();
        }}
        confirmLabel={confirmState.action === "disable" ? "Tắt" : "Bật lại"}
        tone={confirmState.action === "disable" ? "danger" : "success"}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default CategoriesPage;
