import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { placementSlotService } from "../services/placementSlotService";
import type {
  PlacementSlot,
  PlacementSlotFormState,
  PlacementSlotStatus,
} from "../types/placementSlot";
import "./PlacementSlotsPage.css";

type ConfirmAction = "disable" | "enable";

type ConfirmState = {
  isOpen: boolean;
  slotId: number | null;
  action: ConfirmAction | null;
};

const PAGE_SIZE = 5;

const statusFilterOptions: Array<PlacementSlotStatus | "All"> = [
  "All",
  "Active",
  "Disabled",
];

const statusLabels: Record<PlacementSlotStatus | "All", string> = {
  All: "Tất cả",
  Active: "Đang bật",
  Disabled: "Đã tắt",
};

function getStatusLabel(status: PlacementSlotStatus) {
  return statusLabels[status];
}

function PlacementSlotsPage() {
  const [slots, setSlots] = useState<PlacementSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    PlacementSlotStatus | "All"
  >("All");
  const [page, setPage] = useState(1);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedSlot, setSelectedSlot] = useState<PlacementSlot | null>(null);
  const [formData, setFormData] = useState<PlacementSlotFormState>(
    placementSlotService.getEmptyForm(),
  );
  const [formError, setFormError] = useState("");

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    slotId: null,
    action: null,
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const summaryCards = placementSlotService.getSummaryCards(slots);

  useEffect(() => {
    const loadPlacementSlots = async () => {
      try {
        setIsLoading(true);
        setPageError("");
        const nextSlots = await placementSlotService.getPlacementSlots();
        setSlots(nextSlots);
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách vị trí hiển thị.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadPlacementSlots();
  }, []);

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

  const filteredSlots = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return slots.filter((slot) => {
      const matchesKeyword =
        !keyword ||
        slot.name.toLowerCase().includes(keyword) ||
        slot.positionCode.toLowerCase().includes(keyword);

      const matchesStatus =
        selectedStatusFilter === "All" || slot.status === selectedStatusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [slots, searchKeyword, selectedStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSlots.length / PAGE_SIZE));

  const paginatedSlots = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredSlots.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredSlots, page]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedStatusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const openViewModal = (slot: PlacementSlot) => {
    setSelectedSlot(slot);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedSlot(null);
    setIsViewModalOpen(false);
  };

  const openAddModal = () => {
    setModalMode("add");
    setSelectedSlot(null);
    setFormData(placementSlotService.getEmptyForm());
    setFormError("");
    setIsFormModalOpen(true);
  };

  const openEditModal = (slot: PlacementSlot) => {
    setModalMode("edit");
    setSelectedSlot(slot);
    setFormData({
      name: slot.name,
      scope: "Homepage",
      positionCode: slot.positionCode,
      capacity: slot.capacity,
      displayRule: slot.displayRule,
      priority: slot.priority,
      notes: slot.notes,
    });
    setFormError("");
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setSelectedSlot(null);
    setFormError("");
    setIsFormModalOpen(false);
  };

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "capacity" || name === "priority" ? Number(value) : value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);

      if (modalMode === "add") {
        const nextSlots = await placementSlotService.createPlacementSlot(
          slots,
          formData,
        );
        setSlots(nextSlots);
        showToast("Đã thêm vị trí hiển thị thành công.");
      }

      if (modalMode === "edit" && selectedSlot) {
        const nextSlots = await placementSlotService.updatePlacementSlot(
          slots,
          selectedSlot.id,
          formData,
        );
        setSlots(nextSlots);
        showToast("Đã cập nhật vị trí hiển thị thành công.");
      }

      closeFormModal();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Không thể lưu vị trí hiển thị.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openConfirmDialog = (slotId: number, action: ConfirmAction) => {
    setConfirmState({
      isOpen: true,
      slotId,
      action,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmState({
      isOpen: false,
      slotId: null,
      action: null,
    });
  };

  const confirmSlot =
    confirmState.slotId !== null
      ? (slots.find((slot) => slot.id === confirmState.slotId) ?? null)
      : null;

  const handleConfirmAction = async () => {
    if (confirmState.slotId === null || confirmState.action === null) return;

    const slotId = confirmState.slotId;
    const targetSlot = slots.find((slot) => slot.id === slotId);

    if (!targetSlot) {
      closeConfirmDialog();
      return;
    }

    const nextStatus: PlacementSlotStatus =
      confirmState.action === "disable" ? "Disabled" : "Active";

    try {
      setIsStatusUpdating(slotId);
      const nextSlots = await placementSlotService.updatePlacementSlotStatus(
        slots,
        slotId,
        nextStatus,
      );
      setSlots(nextSlots);

      if (selectedSlot?.id === slotId) {
        setSelectedSlot(
          nextSlots.find((item) => item.id === slotId) ?? selectedSlot,
        );
      }

      showToast(
        confirmState.action === "disable"
          ? `Đã tắt vị trí ${targetSlot.name}.`
          : `Đã bật lại vị trí ${targetSlot.name}.`,
        confirmState.action === "disable" ? "info" : "success",
      );

      closeConfirmDialog();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái vị trí hiển thị.",
        "error",
      );
    } finally {
      setIsStatusUpdating(null);
    }
  };

  const confirmTitle =
    confirmState.action === "disable"
      ? "Tắt vị trí hiển thị"
      : "Bật vị trí hiển thị";

  const confirmMessage =
    confirmState.action === "disable"
      ? `Bạn có chắc muốn tắt ${
          confirmSlot?.name ?? "vị trí hiển thị này"
        }? Vị trí này sẽ không còn được dùng để gắn gói đẩy bài nữa.`
      : `Bạn có chắc muốn bật lại ${
          confirmSlot?.name ?? "vị trí hiển thị này"
        }? Vị trí này sẽ được dùng lại cho các gói đẩy bài.`;

  return (
    <div className="placement-slots-page">
      <PageHeader
        title="Vị trí hiển thị"
        description="Quản lý các vị trí bài đẩy trên trang chủ để cấu hình gói quảng bá và sắp thứ tự hiển thị."
        actionLabel="+ Thêm vị trí"
        onActionClick={openAddModal}
      />

      <div className="placement-slots-summary-grid">
        {summaryCards.map((card) => (
          <div key={card.title} className="placement-slots-summary-card">
            <span className="placement-slots-summary-card__label">
              {card.title}
            </span>
            <strong className="placement-slots-summary-card__value">
              {card.value}
            </strong>
            <p className="placement-slots-summary-card__subtitle">
              {card.subtitle}
            </p>
          </div>
        ))}
      </div>

      <SectionCard
        title="Bộ lọc vị trí"
        description="Tìm nhanh vị trí trang chủ theo tên, mã và trạng thái hiện tại."
      >
        <div className="placement-slots-filters">
          <div className="placement-slots-filters__field placement-slots-filters__field--search">
            <label htmlFor="placement-slot-search">Tìm kiếm</label>
            <input
              id="placement-slot-search"
              type="text"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Tìm theo tên vị trí hoặc mã vị trí"
            />
          </div>

          <div className="placement-slots-filters__field">
            <label htmlFor="slot-status-filter">Trạng thái</label>
            <select
              id="slot-status-filter"
              value={selectedStatusFilter}
              onChange={(event) =>
                setSelectedStatusFilter(
                  event.target.value as PlacementSlotStatus | "All",
                )
              }
            >
              {statusFilterOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Danh sách vị trí hiển thị"
        description="Theo dõi sức chứa, thứ tự hiển thị và trạng thái của các vị trí bài đẩy trên trang chủ."
      >
        {isLoading ? (
          <EmptyState
            title="Đang tải vị trí hiển thị"
            description="Hệ thống đang lấy dữ liệu vị trí hiển thị từ API quản trị."
          />
        ) : pageError ? (
          <EmptyState
            title="Không thể tải vị trí hiển thị"
            description={pageError}
          />
        ) : filteredSlots.length === 0 ? (
          <EmptyState
            title="Chưa có vị trí hiển thị"
            description="Hiện chưa có vị trí nào cho bài đẩy trên trang chủ hoặc chưa có vị trí khớp bộ lọc đang chọn."
          />
        ) : (
          <>
            <div className="placement-slots-table-wrapper">
              <table className="placement-slots-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên vị trí</th>
                    <th>Mã vị trí</th>
                    <th>Sức chứa</th>
                    <th>Thứ tự hiển thị</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedSlots.map((slot) => (
                    <tr key={slot.id}>
                      <td>#{slot.id}</td>
                      <td>{slot.name}</td>
                      <td>{slot.positionCode}</td>
                      <td>{slot.capacity}</td>
                      <td>{slot.priority}</td>
                      <td>
                        <StatusBadge
                          label={getStatusLabel(slot.status)}
                          variant={
                            slot.status === "Active" ? "active" : "disabled"
                          }
                        />
                      </td>
                      <td>
                        <div className="placement-slots-actions">
                          <button
                            type="button"
                            className="placement-slots-actions__view"
                            onClick={() => openViewModal(slot)}
                          >
                            Xem
                          </button>

                          <button
                            type="button"
                            className="placement-slots-actions__edit"
                            onClick={() => openEditModal(slot)}
                          >
                            Sửa
                          </button>

                          {slot.status === "Active" ? (
                            <button
                              type="button"
                              className="placement-slots-actions__disable"
                              onClick={() =>
                                openConfirmDialog(slot.id, "disable")
                              }
                              disabled={isStatusUpdating === slot.id}
                            >
                              Tắt
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="placement-slots-actions__enable"
                              onClick={() => openConfirmDialog(slot.id, "enable")}
                              disabled={isStatusUpdating === slot.id}
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

            <div className="placement-slots-pagination">
              <span className="placement-slots-pagination__info">
                Trang {page} / {totalPages}
              </span>

              <div className="placement-slots-pagination__actions">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Trước
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
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
        title="Chi tiết vị trí hiển thị"
        description="Xem nhanh sức chứa, thứ tự hiển thị và ghi chú vận hành của vị trí."
        onClose={closeViewModal}
        maxWidth="720px"
      >
        {selectedSlot ? (
          <div className="placement-slots-modal__content">
            <div className="placement-slots-modal__grid">
              <div className="placement-slots-modal__field">
                <label>Tên vị trí</label>
                <input type="text" value={selectedSlot.name} disabled />
              </div>

              <div className="placement-slots-modal__field">
                <label>Mã vị trí</label>
                <input type="text" value={selectedSlot.positionCode} disabled />
              </div>

              <div className="placement-slots-modal__field">
                <label>Sức chứa</label>
                <input type="text" value={String(selectedSlot.capacity)} disabled />
              </div>

              <div className="placement-slots-modal__field">
                <label>Thứ tự hiển thị</label>
                <input type="text" value={String(selectedSlot.priority)} disabled />
              </div>

              <div className="placement-slots-modal__field">
                <label>Trạng thái</label>
                <input type="text" value={getStatusLabel(selectedSlot.status)} disabled />
              </div>
            </div>

            <div className="placement-slots-modal__field">
              <label>Ghi chú</label>
              <textarea value={selectedSlot.notes} rows={4} disabled />
            </div>

            <div className="placement-slots-modal__actions">
              <button
                type="button"
                className="placement-slots-modal__close"
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
          modalMode === "add" ? "Thêm vị trí hiển thị" : "Chỉnh sửa vị trí hiển thị"
        }
        description={
          modalMode === "add"
            ? "Tạo vị trí mới trên trang chủ với sức chứa và thứ tự hiển thị phù hợp."
            : "Cập nhật cấu hình và thứ tự hiển thị của vị trí trên trang chủ."
        }
        onClose={closeFormModal}
        maxWidth="720px"
      >
        <form className="placement-slots-form" onSubmit={handleSubmit}>
          <div className="placement-slots-modal__grid">
            <div className="placement-slots-modal__field">
              <label htmlFor="name">Tên vị trí</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Ví dụ: Vị trí 1 trang chủ"
              />
            </div>

            <div className="placement-slots-modal__field">
              <label htmlFor="positionCode">Mã vị trí</label>
              <input
                id="positionCode"
                name="positionCode"
                type="text"
                value={formData.positionCode}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Ví dụ: BOOST_POST_2"
              />
            </div>

            <div className="placement-slots-modal__field">
              <label htmlFor="capacity">Sức chứa</label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                value={formData.capacity}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="placement-slots-modal__field">
              <label htmlFor="priority">Thứ tự hiển thị</label>
              <input
                id="priority"
                name="priority"
                type="number"
                min={1}
                value={formData.priority}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="1 là vị trí hiển thị đầu tiên"
              />
            </div>
          </div>

          <div className="placement-slots-modal__field">
            <label htmlFor="notes">Ghi chú</label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Nhập ghi chú vận hành cho vị trí này"
            />
          </div>

          {formError ? (
            <p className="placement-slots-form__error">{formError}</p>
          ) : null}

          <div className="placement-slots-modal__actions">
            <button
              type="button"
              className="placement-slots-modal__close"
              onClick={closeFormModal}
              disabled={isSubmitting}
            >
              Hủy
            </button>

            <button
              type="submit"
              className="placement-slots-modal__submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Đang lưu..."
                : modalMode === "add"
                  ? "Thêm vị trí"
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
          confirmState.action === "disable" ? "Tắt vị trí" : "Bật vị trí"
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

export default PlacementSlotsPage;
