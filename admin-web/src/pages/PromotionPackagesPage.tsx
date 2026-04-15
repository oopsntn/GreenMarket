import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { placementSlotService } from "../services/placementSlotService";
import { promotionPackageService } from "../services/promotionPackageService";
import type { PlacementSlot } from "../types/placementSlot";
import type {
  PromotionPackage,
  PromotionPackageFormState,
  PromotionPackageSlot,
  PromotionPackageStatus,
} from "../types/promotionPackage";
import "./PromotionPackagesPage.css";

type ConfirmAction = "disable" | "enable";

type ConfirmState = {
  isOpen: boolean;
  packageId: number | null;
  action: ConfirmAction | null;
};

type SlotOption = {
  id: number;
  code: string;
  label: PromotionPackageSlot;
};

const PAGE_SIZE = 5;

const slotFilterOptions: Array<PromotionPackageSlot | "All"> = [
  "All",
  "Home Top",
  "Category Top",
  "Search Boost",
];

const statusFilterOptions: Array<PromotionPackageStatus | "All"> = [
  "All",
  "Active",
  "Disabled",
];

const slotLabelMap: Record<PromotionPackageSlot | "All", string> = {
  All: "Tất cả",
  "Home Top": "Trang chủ nổi bật",
  "Category Top": "Danh mục nổi bật",
  "Search Boost": "Tăng tìm kiếm",
};

const statusLabelMap: Record<PromotionPackageStatus | "All", string> = {
  All: "Tất cả",
  Active: "Đang bật",
  Disabled: "Đã tắt",
};

const currencyToNumber = (value: string) => {
  const normalized = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(normalized) ? normalized : 0;
};

const mapPlacementSlotToPackageSlot = (
  slot: Pick<PlacementSlot, "name" | "positionCode">,
): PromotionPackageSlot => {
  const normalized = `${slot.positionCode} ${slot.name}`.toLowerCase();

  if (normalized.includes("search")) return "Search Boost";
  if (normalized.includes("category")) return "Category Top";
  return "Home Top";
};

function PromotionPackagesPage() {
  const [packages, setPackages] = useState<PromotionPackage[]>([]);
  const [slotOptions, setSlotOptions] = useState<SlotOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState<number | null>(null);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<
    PromotionPackageSlot | "All"
  >("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    PromotionPackageStatus | "All"
  >("All");
  const [page, setPage] = useState(1);

  const [selectedPackage, setSelectedPackage] = useState<PromotionPackage | null>(
    null,
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingPackageId, setEditingPackageId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PromotionPackageFormState>(
    promotionPackageService.getEmptyForm(),
  );
  const [formError, setFormError] = useState("");

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    packageId: null,
    action: null,
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const summaryCards = promotionPackageService.getSummaryCards(packages);

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setPageError("");

        const [nextPackages, nextSlots] = await Promise.all([
          promotionPackageService.getPromotionPackages(),
          placementSlotService.getPlacementSlots(),
        ]);

        setPackages(nextPackages);
        setSlotOptions(
          nextSlots.map((slot) => ({
            id: slot.id,
            code: slot.positionCode,
            label: mapPlacementSlotToPackageSlot(slot),
          })),
        );
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu gói quảng bá.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  const filteredPackages = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return packages.filter((item) => {
      const matchesKeyword =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.slot.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword);

      const matchesSlot =
        selectedSlotFilter === "All" || item.slot === selectedSlotFilter;

      const matchesStatus =
        selectedStatusFilter === "All" || item.status === selectedStatusFilter;

      return matchesKeyword && matchesSlot && matchesStatus;
    });
  }, [packages, searchKeyword, selectedSlotFilter, selectedStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPackages.length / PAGE_SIZE));

  const paginatedPackages = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredPackages.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredPackages, page]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedSlotFilter, selectedStatusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const openViewModal = (item: PromotionPackage) => {
    setSelectedPackage(item);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedPackage(null);
    setIsViewModalOpen(false);
  };

  const openAddModal = () => {
    setModalMode("add");
    setEditingPackageId(null);
    setFormData(promotionPackageService.getEmptyForm());
    setFormError("");
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: PromotionPackage) => {
    setModalMode("edit");
    setEditingPackageId(item.id);
    setFormData({
      name: item.name,
      slot: item.slot,
      durationDays: item.durationDays,
      price: String(currencyToNumber(item.price)),
      maxPosts: item.maxPosts,
      displayQuota: item.displayQuota,
      description: item.description,
    });
    setFormError("");
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    if (isSubmitting) return;

    setEditingPackageId(null);
    setFormData(promotionPackageService.getEmptyForm());
    setFormError("");
    setIsFormModalOpen(false);
  };

  const handleFormChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "durationDays" ||
        name === "maxPosts" ||
        name === "displayQuota"
          ? Number(value)
          : value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);

      const nextPackages =
        modalMode === "add"
          ? await promotionPackageService.createPromotionPackage(
              packages,
              slotOptions,
              formData,
            )
          : await promotionPackageService.updatePromotionPackage(
              packages,
              slotOptions,
              editingPackageId as number,
              formData,
            );

      setPackages(nextPackages);

      showToast(
        modalMode === "add"
          ? "Đã thêm gói quảng bá thành công."
          : "Đã cập nhật gói quảng bá thành công.",
      );

      closeFormModal();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Không thể lưu gói quảng bá.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openConfirmDialog = (packageId: number, action: ConfirmAction) => {
    setConfirmState({
      isOpen: true,
      packageId,
      action,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmState({
      isOpen: false,
      packageId: null,
      action: null,
    });
  };

  const confirmPackage =
    confirmState.packageId !== null
      ? (packages.find((item) => item.id === confirmState.packageId) ?? null)
      : null;

  const handleConfirmAction = async () => {
    if (confirmState.packageId === null || confirmState.action === null) return;

    const targetPackage = packages.find(
      (item) => item.id === confirmState.packageId,
    );

    if (!targetPackage) {
      closeConfirmDialog();
      return;
    }

    const nextStatus: PromotionPackageStatus =
      confirmState.action === "disable" ? "Disabled" : "Active";

    try {
      setIsStatusUpdating(confirmState.packageId);

      const nextPackages =
        await promotionPackageService.updatePromotionPackageStatus(
          packages,
          slotOptions,
          confirmState.packageId,
          nextStatus,
        );

      setPackages(nextPackages);

      if (selectedPackage?.id === confirmState.packageId) {
        setSelectedPackage(
          nextPackages.find((item) => item.id === confirmState.packageId) ?? null,
        );
      }

      showToast(
        nextStatus === "Active"
          ? `Đã bật lại gói ${targetPackage.name}.`
          : `Đã tạm ngưng gói ${targetPackage.name}.`,
        nextStatus === "Active" ? "success" : "info",
      );

      closeConfirmDialog();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái gói quảng bá.",
        "error",
      );
    } finally {
      setIsStatusUpdating(null);
    }
  };

  const confirmTitle =
    confirmState.action === "disable"
      ? "Tạm ngưng gói quảng bá"
      : "Bật lại gói quảng bá";

  const confirmMessage =
    confirmState.action === "disable"
      ? `Bạn có chắc muốn tạm ngưng ${
          confirmPackage?.name ?? "gói quảng bá này"
        }? Gói này sẽ không còn hiển thị để bán.`
      : `Bạn có chắc muốn bật lại ${
          confirmPackage?.name ?? "gói quảng bá này"
        }? Gói này sẽ hoạt động trở lại trong hệ thống.`;

  return (
    <div className="promotion-packages-page">
      <PageHeader
        title="Gói quảng bá"
        description="Quản lý các gói quảng bá theo vị trí hiển thị, thời lượng, hạn mức và trạng thái kinh doanh."
        actionLabel="+ Thêm gói"
        onActionClick={openAddModal}
      />

      <div className="promotion-packages-summary-grid">
        {summaryCards.map((card) => (
          <div key={card.title} className="promotion-packages-summary-card">
            <span className="promotion-packages-summary-card__label">
              {card.title}
            </span>
            <strong className="promotion-packages-summary-card__value">
              {card.value}
            </strong>
            <p className="promotion-packages-summary-card__subtitle">
              {card.subtitle}
            </p>
          </div>
        ))}
      </div>

      <SectionCard
        title="Bộ lọc gói quảng bá"
        description="Tìm kiếm và thu hẹp danh sách gói theo vị trí hiển thị và trạng thái."
      >
        <div className="promotion-packages-filters">
          <div className="promotion-packages-filters__field promotion-packages-filters__field--search">
            <label htmlFor="promotion-package-search">Tìm kiếm</label>
            <input
              id="promotion-package-search"
              type="text"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Tìm theo tên gói, vị trí hoặc mô tả"
            />
          </div>

          <div className="promotion-packages-filters__field">
            <label htmlFor="promotion-package-slot-filter">Vị trí</label>
            <select
              id="promotion-package-slot-filter"
              value={selectedSlotFilter}
              onChange={(event) =>
                setSelectedSlotFilter(
                  event.target.value as PromotionPackageSlot | "All",
                )
              }
            >
              {slotFilterOptions.map((slot) => (
                <option key={slot} value={slot}>
                  {slotLabelMap[slot]}
                </option>
              ))}
            </select>
          </div>

          <div className="promotion-packages-filters__field">
            <label htmlFor="promotion-package-status-filter">Trạng thái</label>
            <select
              id="promotion-package-status-filter"
              value={selectedStatusFilter}
              onChange={(event) =>
                setSelectedStatusFilter(
                  event.target.value as PromotionPackageStatus | "All",
                )
              }
            >
              {statusFilterOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabelMap[status]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Danh sách gói quảng bá"
        description="Theo dõi giá bán, quota hiển thị, số bài tối đa và trạng thái kinh doanh của từng gói."
      >
        {isLoading ? (
          <EmptyState
            title="Đang tải gói quảng bá"
            description="Vui lòng chờ trong khi hệ thống lấy dữ liệu gói quảng bá mới nhất."
          />
        ) : pageError ? (
          <EmptyState
            title="Không thể tải gói quảng bá"
            description={pageError}
          />
        ) : filteredPackages.length === 0 ? (
          <EmptyState
            title="Không tìm thấy gói quảng bá"
            description="Không có gói nào khớp với điều kiện tìm kiếm hiện tại."
          />
        ) : (
          <>
            <div className="promotion-packages-table-wrapper">
              <table className="promotion-packages-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên gói</th>
                    <th>Vị trí</th>
                    <th>Thời lượng</th>
                    <th>Giá bán</th>
                    <th>Số bài tối đa</th>
                    <th>Quota</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedPackages.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>{item.name}</td>
                      <td>{slotLabelMap[item.slot]}</td>
                      <td>{item.durationDays} ngày</td>
                      <td>{item.price}</td>
                      <td>{item.maxPosts}</td>
                      <td>{item.displayQuota.toLocaleString("en-US")}</td>
                      <td>
                        <StatusBadge
                          label={statusLabelMap[item.status]}
                          variant={item.status === "Active" ? "active" : "disabled"}
                        />
                      </td>
                      <td>
                        <div className="promotion-packages-actions">
                          <button
                            type="button"
                            className="promotion-packages-actions__view"
                            onClick={() => openViewModal(item)}
                          >
                            Xem
                          </button>
                          <button
                            type="button"
                            className="promotion-packages-actions__edit"
                            onClick={() => openEditModal(item)}
                          >
                            Sửa
                          </button>
                          {item.status === "Active" ? (
                            <button
                              type="button"
                              className="promotion-packages-actions__disable"
                              onClick={() => openConfirmDialog(item.id, "disable")}
                              disabled={isStatusUpdating === item.id}
                            >
                              Tắt
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="promotion-packages-actions__enable"
                              onClick={() => openConfirmDialog(item.id, "enable")}
                              disabled={isStatusUpdating === item.id}
                            >
                              Bật
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="promotion-packages-pagination">
              <span className="promotion-packages-pagination__info">
                Trang {page} / {totalPages}
              </span>
              <div className="promotion-packages-pagination__actions">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Trước
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={page === totalPages}
                >
                  Tiếp
                </button>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      <BaseModal
        isOpen={isViewModalOpen}
        title="Chi tiết gói quảng bá"
        description="Xem cấu hình chi tiết, giá bán và trạng thái hiện tại của gói."
        onClose={closeViewModal}
        maxWidth="720px"
      >
        {selectedPackage ? (
          <div className="promotion-packages-modal__content">
            <div>
              <span>Tên gói</span>
              <strong>{selectedPackage.name}</strong>
            </div>
            <div>
              <span>Vị trí</span>
              <strong>{slotLabelMap[selectedPackage.slot]}</strong>
            </div>
            <div>
              <span>Thời lượng</span>
              <strong>{selectedPackage.durationDays} ngày</strong>
            </div>
            <div>
              <span>Giá bán</span>
              <strong>{selectedPackage.price}</strong>
            </div>
            <div>
              <span>Số bài tối đa</span>
              <strong>{selectedPackage.maxPosts}</strong>
            </div>
            <div>
              <span>Quota hiển thị</span>
              <strong>{selectedPackage.displayQuota.toLocaleString("en-US")}</strong>
            </div>
            <div>
              <span>Trạng thái</span>
              <strong>{statusLabelMap[selectedPackage.status]}</strong>
            </div>
            <div className="promotion-packages-modal__field">
              <span>Mô tả</span>
              <p>{selectedPackage.description}</p>
            </div>

            <div className="promotion-packages-modal__actions">
              <button
                type="button"
                className="promotion-packages-modal__close"
                onClick={closeViewModal}
              >
                Đóng
              </button>
            </div>
          </div>
        ) : null}
      </BaseModal>

      <BaseModal
        isOpen={isFormModalOpen}
        title={
          modalMode === "add" ? "Thêm gói quảng bá" : "Chỉnh sửa gói quảng bá"
        }
        description={
          modalMode === "add"
            ? "Tạo gói quảng bá mới với vị trí hiển thị, giá bán và quota phù hợp."
            : "Cập nhật thông tin kinh doanh và hạn mức của gói quảng bá."
        }
        onClose={closeFormModal}
        maxWidth="760px"
      >
        <form className="promotion-package-form" onSubmit={handleSubmit}>
          <label>
            <span>Tên gói</span>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleFormChange}
              disabled={isSubmitting}
              placeholder="Nhập tên gói quảng bá"
            />
          </label>

          <label>
            <span>Vị trí</span>
            <select
              name="slot"
              value={formData.slot}
              onChange={handleFormChange}
              disabled={isSubmitting}
            >
              {(slotOptions.length > 0
                ? Array.from(new Set(slotOptions.map((item) => item.label)))
                : ["Home Top", "Category Top", "Search Boost"]
              ).map((slot) => (
                <option key={slot} value={slot}>
                  {slotLabelMap[slot as PromotionPackageSlot]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Thời lượng (ngày)</span>
            <input
              name="durationDays"
              type="number"
              min={1}
              value={formData.durationDays}
              onChange={handleFormChange}
              disabled={isSubmitting}
            />
          </label>

          <label>
            <span>Giá bán</span>
            <input
              name="price"
              type="text"
              value={formData.price}
              onChange={handleFormChange}
              disabled={isSubmitting}
              placeholder="Nhập giá bán"
            />
          </label>

          <label>
            <span>Số bài tối đa</span>
            <input
              name="maxPosts"
              type="number"
              min={1}
              value={formData.maxPosts}
              onChange={handleFormChange}
              disabled={isSubmitting}
            />
          </label>

          <label>
            <span>Quota hiển thị</span>
            <input
              name="displayQuota"
              type="number"
              min={1}
              value={formData.displayQuota}
              onChange={handleFormChange}
              disabled={isSubmitting}
            />
          </label>

          <label className="promotion-package-form-description">
            <span>Mô tả</span>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleFormChange}
              disabled={isSubmitting}
              placeholder="Nhập mô tả quyền lợi và phạm vi áp dụng"
            />
          </label>

          {formError ? (
            <p className="promotion-packages-form-error">{formError}</p>
          ) : null}

          <div className="promotion-packages-form-actions">
            <button
              type="button"
              className="promotion-packages-form-actions__cancel"
              onClick={closeFormModal}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="promotion-packages-form-actions__submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Đang lưu..."
                : modalMode === "add"
                  ? "Thêm gói"
                  : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </BaseModal>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={
          confirmState.action === "disable" ? "Tạm ngưng gói" : "Bật lại gói"
        }
        cancelText="Hủy"
        tone={confirmState.action === "disable" ? "danger" : "success"}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmDialog}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default PromotionPackagesPage;
