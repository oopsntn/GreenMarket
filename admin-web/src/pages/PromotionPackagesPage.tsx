import { useEffect, useMemo, useState } from "react";
import { BaseModal } from "../components/BaseModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";
import { ToastContainer, type ToastMessage } from "../components/Toast";
import { placementSlotService } from "../services/placementSlotService";
import { promotionPackageService } from "../services/promotionPackageService";
import type {
  PromotionPackage,
  PromotionPackageFormState,
  PromotionPackageSlot,
  PromotionPackageStatus,
} from "../types";
import "./PromotionPackagesPage.css";

const slotLabelMap: Record<PromotionPackageSlot, string> = {
  "Home Top": "Trang chủ nổi bật",
  "Category Top": "Danh mục nổi bật",
  "Search Boost": "Tăng tìm kiếm",
};

const statusLabelMap: Record<PromotionPackageStatus, string> = {
  Active: "Đang bật",
  Disabled: "Đã tắt",
};

const slotFilterOptions: Array<{
  value: PromotionPackageSlot | "All";
  label: string;
}> = [
  { value: "All", label: "Tất cả" },
  { value: "Home Top", label: "Trang chủ nổi bật" },
  { value: "Category Top", label: "Danh mục nổi bật" },
  { value: "Search Boost", label: "Tăng tìm kiếm" },
];

const statusFilterOptions: Array<{
  value: PromotionPackageStatus | "All";
  label: string;
}> = [
  { value: "All", label: "Tất cả" },
  { value: "Active", label: "Đang bật" },
  { value: "Disabled", label: "Đã tắt" },
];

const PAGE_SIZE = 5;

function emptyFormState(): PromotionPackageFormState {
  return {
    name: "",
    slot: "Home Top",
    durationDays: 7,
    price: 0,
    maxPosts: 1,
    quota: 10000,
    description: "",
  };
}

function PromotionPackagesPage() {
  const [packages, setPackages] = useState<PromotionPackage[]>([]);
  const [availableSlots, setAvailableSlots] = useState<PromotionPackageSlot[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [slotFilter, setSlotFilter] = useState<PromotionPackageSlot | "All">(
    "All",
  );
  const [statusFilter, setStatusFilter] = useState<
    PromotionPackageStatus | "All"
  >("All");
  const [page, setPage] = useState(1);
  const [selectedPackage, setSelectedPackage] =
    useState<PromotionPackage | null>(null);
  const [editingPackage, setEditingPackage] =
    useState<PromotionPackage | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<PromotionPackage | null>(
    null,
  );
  const [formState, setFormState] = useState<PromotionPackageFormState>(
    emptyFormState(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);

  const pushToast = (
    message: string,
    tone: ToastMessage["tone"] = "success",
  ) => {
    setToastMessages((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        message,
        tone,
      },
    ]);
  };

  const dismissToast = (id: string) => {
    setToastMessages((current) =>
      current.filter((toast) => toast.id !== id),
    );
  };

  const loadPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const [packageRows, slotRows] = await Promise.all([
        promotionPackageService.listAll(),
        placementSlotService.listAll(),
      ]);
      setPackages(packageRows);
      const slotNames = Array.from(
        new Set(slotRows.map((slot) => slot.name as PromotionPackageSlot)),
      );
      setAvailableSlots(slotNames);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải dữ liệu gói quảng bá.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPackages();
  }, []);

  const filteredPackages = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return packages.filter((pkg) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        pkg.name.toLowerCase().includes(normalizedSearch) ||
        pkg.slot.toLowerCase().includes(normalizedSearch) ||
        pkg.description.toLowerCase().includes(normalizedSearch);

      const matchesSlot = slotFilter === "All" || pkg.slot === slotFilter;
      const matchesStatus =
        statusFilter === "All" || pkg.status === statusFilter;

      return matchesSearch && matchesSlot && matchesStatus;
    });
  }, [packages, searchTerm, slotFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPackages.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [searchTerm, slotFilter, statusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const currentItems = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredPackages.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredPackages, page]);

  const summary = useMemo(() => {
    const activePackages = packages.filter((pkg) => pkg.status === "Active");
    const disabledPackages = packages.filter(
      (pkg) => pkg.status === "Disabled",
    );
    const peakPrice = packages.reduce((max, pkg) => Math.max(max, pkg.price), 0);
    const totalQuota = packages.reduce((sum, pkg) => sum + pkg.quota, 0);

    return [
      {
        label: "Tổng gói",
        value: packages.length.toString(),
        meta: "Tất cả gói quảng bá đã cấu hình",
      },
      {
        label: "Gói đang bật",
        value: activePackages.length.toString(),
        meta: "Đang mở bán cho khách hàng",
      },
      {
        label: "Gói đã tắt",
        value: disabledPackages.length.toString(),
        meta: "Tạm ẩn khỏi danh sách bán",
      },
      {
        label: "Giá cao nhất",
        value: `${peakPrice.toLocaleString("vi-VN")} VND`,
        meta: "Mức giá lớn nhất trong các gói hiện có",
      },
      {
        label: "Tổng hạn mức",
        value: totalQuota.toLocaleString("vi-VN"),
        meta: "Tổng lượt hiển thị của toàn bộ gói đã cấu hình",
      },
    ];
  }, [packages]);

  const openCreateModal = () => {
    setEditingPackage(null);
    setFormState(emptyFormState());
  };

  const openEditModal = (pkg: PromotionPackage) => {
    setEditingPackage(pkg);
    setFormState({
      name: pkg.name,
      slot: pkg.slot,
      durationDays: pkg.durationDays,
      price: pkg.price,
      maxPosts: pkg.maxPosts,
      quota: pkg.quota,
      description: pkg.description,
    });
  };

  const closeFormModal = () => {
    if (isSaving) {
      return;
    }
    setEditingPackage(null);
    setFormState(emptyFormState());
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (editingPackage) {
        const updated = await promotionPackageService.update(
          editingPackage.id,
          formState,
        );
        setPackages((current) =>
          current.map((pkg) => (pkg.id === updated.id ? updated : pkg)),
        );
        pushToast(`Đã cập nhật gói "${updated.name}".`);
      } else {
        const created = await promotionPackageService.create(formState);
        setPackages((current) => [created, ...current]);
        pushToast(`Đã tạo gói "${created.name}".`);
      }
      closeFormModal();
    } catch (saveError) {
      pushToast(
        saveError instanceof Error
          ? saveError.message
          : "Không thể lưu gói quảng bá.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!confirmTarget) {
      return;
    }

    try {
      const nextStatus: PromotionPackageStatus =
        confirmTarget.status === "Active" ? "Disabled" : "Active";
      const updated = await promotionPackageService.setStatus(
        confirmTarget.id,
        nextStatus,
      );
      setPackages((current) =>
        current.map((pkg) => (pkg.id === updated.id ? updated : pkg)),
      );
      pushToast(
        nextStatus === "Active"
          ? `Đã bật lại gói "${updated.name}".`
          : `Đã tắt gói "${updated.name}".`,
      );
    } catch (statusError) {
      pushToast(
        statusError instanceof Error
          ? statusError.message
          : "Không thể cập nhật trạng thái gói.",
        "error",
      );
    } finally {
      setConfirmTarget(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Gói quảng bá"
        description="Quản lý các gói quảng bá đang bán cho vị trí trang chủ, danh mục và khu vực tìm kiếm."
        actionLabel="+ Thêm gói"
        onAction={openCreateModal}
      />

      <section className="promotion-packages-summary-grid">
        {summary.map((card) => (
          <article key={card.label} className="summary-card">
            <p className="summary-card-label">{card.label}</p>
            <strong className="summary-card-value">{card.value}</strong>
            <span className="summary-card-meta">{card.meta}</span>
          </article>
        ))}
      </section>

      <SectionCard
        title="Bộ lọc gói quảng bá"
        description="Tìm kiếm và lọc gói quảng bá theo vị trí hiển thị và trạng thái kinh doanh."
      >
        <div className="promotion-packages-filter-grid">
          <label className="promotion-packages-filter-field">
            <span>Tìm kiếm</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm theo tên gói, vị trí hoặc mô tả"
            />
          </label>

          <label className="promotion-packages-filter-field">
            <span>Vị trí</span>
            <select
              value={slotFilter}
              onChange={(event) =>
                setSlotFilter(event.target.value as PromotionPackageSlot | "All")
              }
            >
              {slotFilterOptions
                .filter(
                  (option) =>
                    option.value === "All" || availableSlots.includes(option.value),
                )
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
          </label>

          <label className="promotion-packages-filter-field">
            <span>Trạng thái</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as PromotionPackageStatus | "All",
                )
              }
            >
              {statusFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Danh sách gói quảng bá"
        description="Theo dõi giá bán, thời lượng, vị trí hiển thị, hạn mức và trạng thái kinh doanh của từng gói."
      >
        {loading ? (
          <EmptyState
            title="Đang tải gói quảng bá"
            description="Vui lòng chờ trong khi hệ thống lấy dữ liệu gói mới nhất."
          />
        ) : error ? (
          <EmptyState title="Không thể tải gói quảng bá" description={error} />
        ) : filteredPackages.length === 0 ? (
          <EmptyState
            title="Không tìm thấy gói quảng bá"
            description="Không có gói nào khớp với bộ lọc hiện tại."
          />
        ) : (
          <>
            <div className="promotion-packages-table-wrap">
              <table className="promotion-packages-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên gói</th>
                    <th>Vị trí</th>
                    <th>Thời lượng</th>
                    <th>Giá bán</th>
                    <th>Số bài tối đa</th>
                    <th>Hạn mức</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((pkg) => (
                    <tr key={pkg.id}>
                      <td>#{pkg.id}</td>
                      <td>{pkg.name}</td>
                      <td>{slotLabelMap[pkg.slot]}</td>
                      <td>{pkg.durationDays} ngày</td>
                      <td>{pkg.price.toLocaleString("vi-VN")} VND</td>
                      <td>{pkg.maxPosts}</td>
                      <td>{pkg.quota.toLocaleString("vi-VN")}</td>
                      <td>
                        <StatusBadge status={pkg.status} />
                      </td>
                      <td>
                        <div className="promotion-packages-actions">
                          <button
                            type="button"
                            onClick={() => setSelectedPackage(pkg)}
                          >
                            Xem
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => openEditModal(pkg)}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => setConfirmTarget(pkg)}
                          >
                            {pkg.status === "Active" ? "Tắt" : "Bật"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="promotion-packages-pagination">
              <span>
                Trang {page} / {totalPages}
              </span>
              <div className="promotion-packages-pagination-actions">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Trước
                </button>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Tiếp
                </button>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      <BaseModal
        isOpen={selectedPackage !== null}
        title="Chi tiết gói quảng bá"
        description="Xem vị trí, hạn mức, trạng thái kinh doanh và mô tả chi tiết của gói."
        onClose={() => setSelectedPackage(null)}
        footer={
          <button
            type="button"
            className="modal-secondary-button"
            onClick={() => setSelectedPackage(null)}
          >
            Đóng
          </button>
        }
      >
        {selectedPackage ? (
          <div className="promotion-packages-detail-grid">
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
              <strong>{selectedPackage.price.toLocaleString("vi-VN")} VND</strong>
            </div>
            <div>
              <span>Số bài tối đa</span>
              <strong>{selectedPackage.maxPosts}</strong>
            </div>
            <div>
              <span>Hạn mức hiển thị</span>
              <strong>{selectedPackage.quota.toLocaleString("vi-VN")}</strong>
            </div>
            <div>
              <span>Trạng thái</span>
              <strong>{statusLabelMap[selectedPackage.status]}</strong>
            </div>
            <div className="promotion-packages-detail-description">
              <span>Mô tả</span>
              <p>{selectedPackage.description}</p>
            </div>
          </div>
        ) : null}
      </BaseModal>

      <BaseModal
        isOpen={editingPackage !== null || formState.name !== ""}
        title={
          editingPackage ? "Chỉnh sửa gói quảng bá" : "Thêm gói quảng bá"
        }
        description={
          editingPackage
            ? "Cập nhật giá bán, hạn mức, thời lượng và thông tin kinh doanh của gói."
            : "Tạo gói mới cho một vị trí hiển thị đang được hỗ trợ."
        }
        onClose={closeFormModal}
      >
        <form className="promotion-package-form" onSubmit={submitForm}>
          <label>
            <span>Tên gói</span>
            <input
              value={formState.name}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Nhập tên gói"
              required
            />
          </label>

          <label>
            <span>Vị trí</span>
            <select
              value={formState.slot}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  slot: event.target.value as PromotionPackageSlot,
                }))
              }
            >
              {availableSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slotLabelMap[slot]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Thời lượng (ngày)</span>
            <input
              type="number"
              min={1}
              value={formState.durationDays}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  durationDays: Number(event.target.value),
                }))
              }
              required
            />
          </label>

          <label>
            <span>Giá bán</span>
            <input
              type="number"
              min={0}
              value={formState.price}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  price: Number(event.target.value),
                }))
              }
              placeholder="Nhập giá bán của gói"
              required
            />
          </label>

          <label>
            <span>Số bài tối đa</span>
            <input
              type="number"
              min={1}
              value={formState.maxPosts}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  maxPosts: Number(event.target.value),
                }))
              }
              required
            />
          </label>

          <label>
            <span>Hạn mức hiển thị</span>
            <input
              type="number"
              min={1}
              value={formState.quota}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  quota: Number(event.target.value),
                }))
              }
              required
            />
          </label>

          <label className="promotion-package-form-description">
            <span>Mô tả</span>
            <textarea
              rows={4}
              value={formState.description}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Nhập mô tả và quyền lợi của gói"
              required
            />
          </label>

          <div className="promotion-package-form-actions">
            <button
              type="button"
              className="modal-secondary-button"
              onClick={closeFormModal}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="modal-primary-button"
              disabled={isSaving}
            >
              {isSaving
                ? "Đang lưu..."
                : editingPackage
                  ? "Lưu thay đổi"
                  : "Thêm gói"}
            </button>
          </div>
        </form>
      </BaseModal>

      <ConfirmDialog
        isOpen={confirmTarget !== null}
        title={
          confirmTarget?.status === "Active"
            ? "Tắt gói quảng bá"
            : "Bật gói quảng bá"
        }
        description={
          confirmTarget?.status === "Active"
            ? `Bạn có chắc muốn tắt "${confirmTarget?.name}"? Gói này sẽ không còn được phép bán ra.`
            : `Bạn có chắc muốn bật lại "${confirmTarget?.name}"? Gói này sẽ được bán lại cho khách hàng.`
        }
        confirmLabel={
          confirmTarget?.status === "Active" ? "Tắt gói" : "Bật gói"
        }
        cancelLabel="Hủy"
        confirmTone={confirmTarget?.status === "Active" ? "danger" : "primary"}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={toggleStatus}
      />

      <ToastContainer messages={toastMessages} onDismiss={dismissToast} />
    </>
  );
}

export default PromotionPackagesPage;
