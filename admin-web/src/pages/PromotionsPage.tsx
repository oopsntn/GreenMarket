import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { promotionPackageService } from "../services/promotionPackageService";
import { promotionService } from "../services/promotionService";
import type {
  Promotion,
  PromotionPackageActionPayload,
  PromotionPaymentStatus,
  PromotionSlot,
  PromotionStatus,
  PromotionSummaryCard,
} from "../types/promotion";
import { coerceDateRange, getTodayDateValue } from "../utils/dateRange";
import "./PromotionsPage.css";

type ConfirmAction = "pause" | "resume";
type ActionModalMode = "change" | "reopen";

type ConfirmState = {
  isOpen: boolean;
  promotionId: number | null;
  action: ConfirmAction | null;
};

type PackageActionFormState = {
  slot: PromotionSlot;
  packageId: string;
  startDate: string;
  endDate: string;
  paymentStatus: PromotionPaymentStatus;
  adminNote: string;
};

const statusFilterOptions: Array<PromotionStatus | "All"> = [
  "All",
  "Scheduled",
  "Active",
  "Paused",
  "Completed",
  "Expired",
];

const paymentFilterOptions: Array<PromotionPaymentStatus | "All"> = [
  "All",
  "Paid",
  "Pending Verification",
];

const getSlotLabel = (slot: PromotionSlot | "All") => {
  if (slot === "All") return "Tất cả";
  if (slot === "Home Top") return "Vị trí 1 trang chủ";
  if (slot === "Category Top") return "Vị trí 2 trang chủ";
  if (slot === "Search Boost") return "Vị trí 3 trang chủ";
  return slot;
};

const statusLabelMap: Record<PromotionStatus | "All", string> = {
  All: "Tất cả",
  Scheduled: "Đã lên lịch",
  Active: "Đang chạy",
  Paused: "Tạm dừng",
  Completed: "Hoàn tất",
  Expired: "Hết hạn",
};

const paymentLabelMap: Record<PromotionPaymentStatus | "All", string> = {
  All: "Tất cả",
  Paid: "Đã thanh toán",
  "Pending Verification": "Chờ xác nhận",
};

const PAGE_SIZE = 5;

const formatDateInput = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calculateEndDate = (startDate: string, durationDays: number) => {
  if (!startDate) return "";

  const date = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return startDate;

  date.setDate(date.getDate() + Math.max(durationDays - 1, 0));
  return formatDateInput(date);
};

const calculateDurationDays = (startDate: string, endDate: string) => {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

function PromotionsPage() {
  const todayDateInput = getTodayDateValue();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [activePackages, setActivePackages] = useState(
    [] as ReturnType<typeof promotionPackageService.getActivePromotionPackages>,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isStatusUpdating, setIsStatusUpdating] = useState<number | null>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionModalMode, setActionModalMode] = useState<ActionModalMode | null>(
    null,
  );
  const [actionPromotionId, setActionPromotionId] = useState<number | null>(
    null,
  );
  const [actionFormData, setActionFormData] = useState<PackageActionFormState>({
    slot: "",
    packageId: "",
    startDate: "",
    endDate: "",
    paymentStatus: "Paid",
    adminNote: "",
  });
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<
    PromotionSlot | "All"
  >("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    PromotionStatus | "All"
  >("All");
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<
    PromotionPaymentStatus | "All"
  >("All");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    promotionId: null,
    action: null,
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const summaryCards: PromotionSummaryCard[] =
    promotionService.getSummaryCards(promotions);
  const actionTargetPromotion =
    actionPromotionId !== null
      ? (promotions.find((item) => item.id === actionPromotionId) ?? null)
      : null;
  const availablePackages = useMemo(() => {
    if (actionModalMode === "reopen") {
      return activePackages;
    }

    return activePackages.filter((item) => item.slot === actionFormData.slot);
  }, [actionFormData.slot, actionModalMode, activePackages]);
  const selectedActionPackage =
    availablePackages.find(
      (item) => item.id === Number(actionFormData.packageId),
    ) ?? null;
  const slotFilterOptions = useMemo<Array<PromotionSlot | "All">>(() => {
    const dynamicSlots = Array.from(
      new Set([
        ...promotions.map((item) => item.slot),
        ...activePackages.map((item) => item.slot),
      ]),
    ).filter(Boolean);

    return ["All", ...dynamicSlots];
  }, [activePackages, promotions]);
  useEffect(() => {
    const loadPromotionData = async () => {
      try {
        setIsLoading(true);
        setPageError("");

        const [nextPromotions, allPackages] = await Promise.all([
          promotionService.getPromotions(),
          promotionPackageService.getPromotionPackages(),
        ]);

        setPromotions(nextPromotions);
        setActivePackages(
          promotionPackageService.getActivePromotionPackages(allPackages),
        );
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách đơn quảng bá.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadPromotionData();
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

  const openViewModal = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedPromotion(null);
    setIsModalOpen(false);
  };

  const getPreferredPackage = (promotion: Promotion) => {
    return (
      activePackages.find((item) => item.id === promotion.packageId) ??
      activePackages.find((item) => item.slot === promotion.slot) ??
      activePackages[0] ??
      null
    );
  };

  const openChangePackageModal = (promotion: Promotion) => {
    if (!promotionService.canChangePromotionPackage(promotion)) {
      showToast(
        promotionService.getChangePackageBlockedReason(promotion),
        "error",
      );
      return;
    }

    const preferredPackage = getPreferredPackage(promotion);
    if (!preferredPackage) {
      showToast("Hiện chưa có gói quảng bá nào đang hoạt động.", "error");
      return;
    }

    setActionPromotionId(promotion.id);
    setActionModalMode("change");
    const nextStartDate =
      promotion.startDate && promotion.startDate >= todayDateInput
        ? promotion.startDate
        : todayDateInput;
    setActionFormData({
      slot: preferredPackage.slot,
      packageId: String(preferredPackage.id),
      startDate: nextStartDate,
      endDate: calculateEndDate(nextStartDate, preferredPackage.durationDays),
      paymentStatus: promotion.paymentStatus,
      adminNote: promotion.note,
    });
    setIsActionModalOpen(true);
  };

  const openReopenModal = (promotion: Promotion) => {
    if (!promotionService.canReopenPromotion(promotion)) {
      showToast(
        promotionService.getActionBlockedReason(promotion, "reopen"),
        "error",
      );
      return;
    }

    const preferredPackage = getPreferredPackage(promotion);
    if (!preferredPackage) {
      showToast("Hiện chưa có gói quảng bá nào đang hoạt động.", "error");
      return;
    }

    setActionPromotionId(promotion.id);
    setActionModalMode("reopen");
    setActionFormData({
      slot: preferredPackage.slot,
      packageId: String(preferredPackage.id),
      startDate: "",
      endDate: "",
      paymentStatus: "Paid",
      adminNote: `Admin mở lại gói sau khi xác nhận thanh toán từ ${promotion.owner}.`,
    });
    setIsActionModalOpen(true);
  };

  const closeActionModal = () => {
    setActionPromotionId(null);
    setActionModalMode(null);
    setIsActionModalOpen(false);
  };

  const openConfirmDialog = (promotionId: number, action: ConfirmAction) => {
    setConfirmState({
      isOpen: true,
      promotionId,
      action,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmState({
      isOpen: false,
      promotionId: null,
      action: null,
    });
  };

  const filteredPromotions = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return promotions.filter((promotion) => {
      const matchesKeyword =
        !keyword ||
        promotion.postTitle.toLowerCase().includes(keyword) ||
        promotion.owner.toLowerCase().includes(keyword) ||
        promotion.packageName.toLowerCase().includes(keyword);

      const matchesSlot =
        selectedSlotFilter === "All" || promotion.slot === selectedSlotFilter;

      const matchesStatus =
        selectedStatusFilter === "All" ||
        promotion.status === selectedStatusFilter;

      const matchesPayment =
        selectedPaymentFilter === "All" ||
        promotion.paymentStatus === selectedPaymentFilter;

      const matchesFromDate =
        !fromDateFilter || promotion.endDate >= fromDateFilter;

      const matchesToDate = !toDateFilter || promotion.startDate <= toDateFilter;

      return (
        matchesKeyword &&
        matchesSlot &&
        matchesStatus &&
        matchesPayment &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [
    promotions,
    searchKeyword,
    selectedSlotFilter,
    selectedStatusFilter,
    selectedPaymentFilter,
    fromDateFilter,
    toDateFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPromotions.length / PAGE_SIZE),
  );

  const paginatedPromotions = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredPromotions.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredPromotions, page]);

  useEffect(() => {
    setPage(1);
  }, [
    searchKeyword,
    selectedSlotFilter,
    selectedStatusFilter,
    selectedPaymentFilter,
    fromDateFilter,
    toDateFilter,
  ]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleFromDateFilterChange = (value: string) => {
    const { nextValue, counterpartValue } = coerceDateRange(
      value,
      toDateFilter,
      "from",
      todayDateInput,
    );
    setFromDateFilter(nextValue);
    setToDateFilter(counterpartValue);
  };

  const handleToDateFilterChange = (value: string) => {
    const { nextValue, counterpartValue } = coerceDateRange(
      value,
      fromDateFilter,
      "to",
      todayDateInput,
    );
    setToDateFilter(nextValue);
    setFromDateFilter(counterpartValue);
  };

  const confirmPromotion =
    confirmState.promotionId !== null
      ? (promotions.find((item) => item.id === confirmState.promotionId) ??
        null)
      : null;

  const promotionLabel = confirmPromotion?.postTitle ?? "đơn quảng bá này";

  const confirmTitleMap: Record<ConfirmAction, string> = {
    pause: "Tạm dừng đơn quảng bá",
    resume: "Tiếp tục đơn quảng bá",
  };

  const confirmMessageMap: Record<ConfirmAction, string> = {
    pause: `Bạn chắc chắn muốn tạm dừng ${promotionLabel}? Đơn quảng bá sẽ dừng hiển thị cho đến khi được mở lại.`,
    resume: `Bạn chắc chắn muốn tiếp tục ${promotionLabel}? Đơn quảng bá sẽ chạy lại theo lịch hiện tại.`,
  };

  const confirmButtonMap: Record<ConfirmAction, string> = {
    pause: "Tạm dừng",
    resume: "Tiếp tục",
  };

  const confirmToneMap: Record<
    ConfirmAction,
    "danger" | "success" | "neutral"
  > = {
    pause: "danger",
    resume: "success",
  };

  const handleActionClick = (promotion: Promotion, action: ConfirmAction) => {
    if (action === "pause") {
      if (!promotionService.canPausePromotion(promotion)) {
        showToast(
          promotionService.getActionBlockedReason(promotion, "pause"),
          "error",
        );
        return;
      }
    }

    if (action === "resume") {
      if (!promotionService.canResumePromotion(promotion)) {
        showToast(
          promotionService.getActionBlockedReason(promotion, "resume"),
          "error",
        );
        return;
      }
    }

    openConfirmDialog(promotion.id, action);
  };

  const renderChangePackageButton = (promotion: Promotion) => {
    const canChangePackage = promotionService.canChangePromotionPackage(promotion);

    return (
      <button
        type="button"
        className={
          canChangePackage
            ? "promotions-actions__change"
            : "promotions-actions__disabled"
        }
        onClick={() => openChangePackageModal(promotion)}
        disabled={!canChangePackage}
        title={
          canChangePackage
            ? "Đổi gói hoặc cập nhật lịch chạy cho đơn chưa thanh toán"
            : promotionService.getChangePackageBlockedReason(promotion)
        }
      >
        Đổi gói
      </button>
    );
  };

  const handleConfirmAction = async () => {
    if (confirmState.promotionId === null || confirmState.action === null)
      return;

    const targetPromotion = promotions.find(
      (item) => item.id === confirmState.promotionId,
    );
    if (!targetPromotion) {
      closeConfirmDialog();
      return;
    }

    try {
      if (confirmState.action === "pause") {
        if (!promotionService.canPausePromotion(targetPromotion)) {
          showToast(
            promotionService.getActionBlockedReason(targetPromotion, "pause"),
            "error",
          );
          closeConfirmDialog();
          return;
        }

        setIsStatusUpdating(targetPromotion.id);

        const nextPromotions = await promotionService.updatePromotionStatus(
          promotions,
          targetPromotion.id,
          "Paused",
        );

        setPromotions(nextPromotions);

        showToast(`${targetPromotion.postTitle} đã được tạm dừng.`, "info");

        if (selectedPromotion?.id === targetPromotion.id) {
          setSelectedPromotion(
            nextPromotions.find((item) => item.id === targetPromotion.id) ?? null,
          );
        }
      }

      if (confirmState.action === "resume") {
        if (!promotionService.canResumePromotion(targetPromotion)) {
          showToast(
            promotionService.getActionBlockedReason(targetPromotion, "resume"),
            "error",
          );
          closeConfirmDialog();
          return;
        }

        setIsStatusUpdating(targetPromotion.id);

        const nextPromotions = await promotionService.updatePromotionStatus(
          promotions,
          targetPromotion.id,
          "Active",
        );

        setPromotions(nextPromotions);

        showToast(`${targetPromotion.postTitle} đã được tiếp tục.`);

        if (selectedPromotion?.id === targetPromotion.id) {
          setSelectedPromotion(
            nextPromotions.find((item) => item.id === targetPromotion.id) ?? null,
          );
        }
      }

      closeConfirmDialog();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái đơn quảng bá.",
        "error",
      );
    } finally {
      setIsStatusUpdating(null);
    }
  };

  const handlePackageActionChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;

    setActionFormData((prev) => {
      if (name === "slot") {
        const nextSlot = value as PromotionSlot;
        const nextPackage = activePackages.find((item) => item.slot === nextSlot);
        const nextStartDate =
          actionModalMode === "reopen" ? todayDateInput : prev.startDate;

        return {
          ...prev,
          slot: nextSlot,
          packageId: nextPackage ? String(nextPackage.id) : "",
          endDate: nextPackage
            ? calculateEndDate(nextStartDate, nextPackage.durationDays)
            : prev.endDate,
        };
      }

      if (name === "packageId") {
        const nextPackage = activePackages.find(
          (item) => item.id === Number(value),
        );
        const nextStartDate =
          actionModalMode === "reopen" ? todayDateInput : prev.startDate;

        return {
          ...prev,
          packageId: value,
          slot: nextPackage?.slot ?? prev.slot,
          endDate: nextPackage
            ? calculateEndDate(nextStartDate, nextPackage.durationDays)
            : prev.endDate,
        };
      }

      if (name === "startDate") {
        return {
          ...prev,
          startDate: value,
          endDate: selectedActionPackage
            ? calculateEndDate(value, selectedActionPackage.durationDays)
            : prev.endDate,
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handlePackageActionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!actionTargetPromotion || !selectedActionPackage) {
      showToast("Vui lòng chọn gói hợp lệ trước khi tiếp tục.", "error");
      return;
    }

    const effectiveStartDate =
      actionModalMode === "reopen"
        ? todayDateInput
        : actionFormData.startDate;
    const effectiveEndDate =
      actionModalMode === "reopen"
        ? calculateEndDate(todayDateInput, selectedActionPackage.durationDays)
        : actionFormData.endDate;

    if (!effectiveStartDate || !effectiveEndDate) {
      showToast("Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.", "error");
      return;
    }

    if (effectiveStartDate < todayDateInput) {
      showToast(
        "Ngày bắt đầu phải từ ngày hiện tại trở đi.",
        "error",
      );
      return;
    }

    const selectedDuration = calculateDurationDays(
      effectiveStartDate,
      effectiveEndDate,
    );

    if (selectedDuration === null) {
      showToast("Khoảng thời gian chạy của gói không hợp lệ.", "error");
      return;
    }

    if (selectedDuration !== selectedActionPackage.durationDays) {
      showToast(
        `Gói ${selectedActionPackage.name} phải chạy đúng ${selectedActionPackage.durationDays} ngày.`,
        "error",
      );
      return;
    }

    if (actionModalMode === "reopen" && actionFormData.paymentStatus !== "Paid") {
      showToast(
        "Chỉ mở lại gói đã hết hạn sau khi xác nhận thanh toán.",
        "error",
      );
      return;
    }

    const payload: PromotionPackageActionPayload = {
      packageId: selectedActionPackage.id,
      packageName: selectedActionPackage.name,
      slot: selectedActionPackage.slot,
      startDate:
        actionModalMode === "change" ? effectiveStartDate : undefined,
      endDate:
        actionModalMode === "change" ? effectiveEndDate : undefined,
      budget: selectedActionPackage.price,
      paymentStatus: actionFormData.paymentStatus,
      adminNote: actionFormData.adminNote,
    };

    try {
      setIsActionSubmitting(true);

      const nextPromotions =
        actionModalMode === "reopen"
          ? await promotionService.reopenPromotion(
              promotions,
              actionTargetPromotion.id,
              payload,
            )
          : await promotionService.changePromotionPackage(
              promotions,
              actionTargetPromotion.id,
              payload,
            );

      setPromotions(nextPromotions);

      if (selectedPromotion?.id === actionTargetPromotion.id) {
        setSelectedPromotion(
          nextPromotions.find((item) => item.id === actionTargetPromotion.id) ??
            null,
        );
      }

      showToast(
        actionModalMode === "reopen"
          ? `${actionTargetPromotion.postTitle} đã được admin mở lại.`
          : `${actionTargetPromotion.postTitle} đã chuyển sang ${selectedActionPackage.name}.`,
      );

      closeActionModal();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật gói quảng bá cho đơn này.",
        "error",
      );
    } finally {
      setIsActionSubmitting(false);
    }
  };


  return (
    <div className="promotions-page">
      <PageHeader
        title="Quản lý đơn quảng bá"
        description="Theo dõi từng đơn mua gói quảng bá, trạng thái thanh toán, lịch chạy, đổi gói và mở lại khi admin xác nhận."
      />

      <div className="promotions-summary-grid">
        {summaryCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
          />
        ))}
      </div>

      <SearchToolbar
        placeholder="Tìm theo tiêu đề bài đăng, chủ sở hữu hoặc gói"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Lọc theo vị trí, trạng thái, thanh toán và khoảng ngày"
        filterSummaryItems={[
          getSlotLabel(selectedSlotFilter),
          statusLabelMap[selectedStatusFilter],
          paymentLabelMap[selectedPaymentFilter],
          fromDateFilter || "Từ đầu kỳ",
          toDateFilter || "Đến hiện tại",
        ]}
      />

      {showFilters && (
        <SectionCard
          title="Bộ lọc đơn quảng bá"
          description="Lọc theo vị trí hiển thị, trạng thái chạy, thanh toán và khoảng ngày của đơn."
        >
          <div className="promotions-filters">
            <div className="promotions-filters__field">
              <label htmlFor="promotion-slot-filter">Vị trí hiển thị</label>
              <select
                id="promotion-slot-filter"
                value={selectedSlotFilter}
                onChange={(event) =>
                  setSelectedSlotFilter(
                    event.target.value as PromotionSlot | "All",
                  )
                }
              >
                {slotFilterOptions.map((slot) => (
                  <option key={slot} value={slot}>
                    {getSlotLabel(slot)}
                  </option>
                ))}
              </select>
            </div>

            <div className="promotions-filters__field">
              <label htmlFor="promotion-status-filter">Trạng thái</label>
              <select
                id="promotion-status-filter"
                value={selectedStatusFilter}
                onChange={(event) =>
                  setSelectedStatusFilter(
                    event.target.value as PromotionStatus | "All",
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

            <div className="promotions-filters__field">
              <label htmlFor="promotion-payment-filter">Thanh toán</label>
              <select
                id="promotion-payment-filter"
                value={selectedPaymentFilter}
                onChange={(event) =>
                  setSelectedPaymentFilter(
                    event.target.value as PromotionPaymentStatus | "All",
                  )
                }
              >
                {paymentFilterOptions.map((status) => (
                  <option key={status} value={status}>
                    {paymentLabelMap[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="promotions-filters__field">
              <label htmlFor="promotion-from-date">Từ ngày</label>
              <input
                id="promotion-from-date"
                type="date"
                value={fromDateFilter}
                max={toDateFilter || todayDateInput}
                onChange={(event) =>
                  handleFromDateFilterChange(event.target.value)
                }
              />
            </div>

            <div className="promotions-filters__field">
              <label htmlFor="promotion-to-date">Đến ngày</label>
              <input
                id="promotion-to-date"
                type="date"
                value={toDateFilter}
                min={fromDateFilter || undefined}
                max={todayDateInput}
                onChange={(event) =>
                  handleToDateFilterChange(event.target.value)
                }
              />
            </div>
          </div>
        </SectionCard>
      )}

      <SectionCard
        title="Danh sách đơn quảng bá"
        description="Theo dõi bài đăng, chủ sở hữu, gói đã mua, vị trí hiển thị, thanh toán, lịch chạy và cảnh báo vận hành."
      >
        {isLoading ? (
          <EmptyState
            title="Đang tải đơn quảng bá"
            description="Đang lấy dữ liệu đơn quảng bá từ hệ thống quản trị."
          />
        ) : pageError ? (
          <EmptyState
            title="Không thể tải đơn quảng bá"
            description={pageError}
          />
        ) : filteredPromotions.length === 0 ? (
          <EmptyState
            title="Không có đơn quảng bá phù hợp"
            description="Không có đơn quảng bá nào khớp bộ lọc hiện tại. Hãy thử điều kiện khác."
          />
        ) : (
          <div className="promotions-directory">
            <div className="promotions-table-wrapper">
              <table className="promotions-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Bài đăng</th>
                    <th>Chủ sở hữu</th>
                    <th>Gói</th>
                    <th>Vị trí hiển thị</th>
                    <th>Thời gian chạy</th>
                    <th>Thanh toán</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedPromotions.map((promotion) => (
                    <tr key={promotion.id}>
                      <td>#{promotion.id}</td>
                      <td>
                        <div className="promotions-cell">
                          <strong>{promotion.postTitle}</strong>
                          <span>Mã bài: #{promotion.postId}</span>
                        </div>
                      </td>
                      <td>{promotion.owner}</td>
                      <td>{promotion.packageName}</td>
                      <td>
                        <StatusBadge label={getSlotLabel(promotion.slot)} variant="slot" />
                      </td>
                      <td>
                        <div className="promotions-cell">
                          <strong>{promotion.startDate}</strong>
                          <span>{promotion.endDate}</span>
                        </div>
                      </td>
                      <td>
                        <div className="promotions-cell">
                          <StatusBadge
                            label={paymentLabelMap[promotion.paymentStatus]}
                            variant={
                              promotion.paymentStatus === "Paid"
                                ? "success"
                                : "processing"
                            }
                          />
                          <span>{promotion.budget}</span>
                        </div>
                      </td>
                      <td>
                          <StatusBadge
                            label={statusLabelMap[promotion.status]}
                            variant={
                              promotion.status === "Active"
                                ? "active"
                              : promotion.status === "Paused"
                                ? "paused"
                              : promotion.status === "Completed"
                                ? "success"
                                : promotion.status === "Scheduled"
                                  ? "pending"
                                  : "expired"
                            }
                          />
                      </td>
                      <td>
                        <div className="promotions-actions">
                          <button
                            type="button"
                            className="promotions-actions__view"
                            onClick={() => openViewModal(promotion)}
                          >
                            Xem
                          </button>

                          {promotion.status === "Active" ? (
                            <>
                              <button
                                type="button"
                                className="promotions-actions__pause"
                                onClick={() =>
                                  handleActionClick(promotion, "pause")
                                }
                                disabled={isStatusUpdating === promotion.id}
                              >
                                Tạm dừng
                              </button>
                              {renderChangePackageButton(promotion)}
                            </>
                          ) : promotion.status === "Paused" ? (
                            <>
                              <button
                                type="button"
                                className="promotions-actions__resume"
                                onClick={() =>
                                  handleActionClick(promotion, "resume")
                                }
                                disabled={isStatusUpdating === promotion.id}
                              >
                                Tiếp tục
                              </button>
                              {renderChangePackageButton(promotion)}
                            </>
                          ) : promotion.status === "Scheduled" ? (
                            <>
                              {renderChangePackageButton(promotion)}
                              <button
                                type="button"
                                className="promotions-actions__disabled"
                                disabled
                                title="Đơn quảng bá đã lên lịch nhưng chưa bắt đầu."
                              >
                                Sắp chạy
                              </button>
                            </>
                          ) : promotion.status === "Expired" ? (
                            <button
                              type="button"
                              className={
                                promotionService.canReopenPromotion(promotion)
                                  ? "promotions-actions__reopen"
                                  : "promotions-actions__disabled"
                              }
                              onClick={() => openReopenModal(promotion)}
                              disabled={
                                !promotionService.canReopenPromotion(promotion)
                              }
                              title={
                                !promotionService.canReopenPromotion(promotion)
                                  ? promotionService.getActionBlockedReason(
                                      promotion,
                                      "reopen",
                                    )
                                  : "Mở lại đơn quảng bá đã hết hạn"
                              }
                            >
                              Mở lại
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="promotions-actions__disabled"
                              disabled
                              title="Đơn quảng bá đã dùng hết quota trước thời hạn."
                            >
                              Hoàn tất
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="promotions-pagination">
              <span className="promotions-pagination__info">
                Trang {page} / {totalPages}
              </span>

              <div className="promotions-pagination__actions">
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
          </div>
        )}
      </SectionCard>

      <BaseModal
        isOpen={isModalOpen}
        title="Chi tiết đơn quảng bá"
        description="Xem cấu hình gói, lịch chạy, thanh toán và trạng thái vận hành của đơn."
        onClose={closeModal}
        maxWidth="820px"
      >
        {selectedPromotion ? (
          <div className="promotions-modal__content">
            <div className="promotions-modal__grid">
              <div className="promotions-modal__field">
                <label>Tiêu đề bài đăng</label>
                <input
                  type="text"
                  value={selectedPromotion.postTitle}
                  disabled
                />
              </div>

              <div className="promotions-modal__field">
                <label>Chủ sở hữu</label>
                <input type="text" value={selectedPromotion.owner} disabled />
              </div>

              <div className="promotions-modal__field">
                <label>Vị trí hiển thị</label>
                <input
                  type="text"
                  value={getSlotLabel(selectedPromotion.slot)}
                  disabled
                />
              </div>

              <div className="promotions-modal__field">
                <label>Gói</label>
                <input
                  type="text"
                  value={selectedPromotion.packageName}
                  disabled
                />
              </div>

              <div className="promotions-modal__field">
                <label>Trạng thái thanh toán</label>
                <input
                  type="text"
                  value={
                    selectedPromotion.paymentStatus === "Paid"
                      ? "Đã thanh toán"
                      : "Chờ xác nhận"
                  }
                  disabled
                />
              </div>

              <div className="promotions-modal__field">
                <label>Người theo dõi</label>
                <input
                  type="text"
                  value={
                    selectedPromotion.handledBy === "Admin"
                      ? "Quản trị viên"
                      : "Quản lý vận hành"
                  }
                  disabled
                />
              </div>

              <div className="promotions-modal__field">
                <label>Ngày bắt đầu</label>
                <input
                  type="text"
                  value={selectedPromotion.startDate}
                  disabled
                />
              </div>

              <div className="promotions-modal__field">
                <label>Ngày kết thúc</label>
                <input type="text" value={selectedPromotion.endDate} disabled />
              </div>

              <div className="promotions-modal__field">
                <label>Trạng thái</label>
                <input
                  type="text"
                  value={statusLabelMap[selectedPromotion.status]}
                  disabled
                />
              </div>

              <div className="promotions-modal__field">
                <label>Ngân sách</label>
                <input type="text" value={selectedPromotion.budget} disabled />
              </div>
            </div>

            <div className="promotions-modal__field">
              <label>Ghi chú admin</label>
              <textarea value={selectedPromotion.note} rows={4} disabled />
            </div>

            {selectedPromotion.warnings.length > 0 ? (
              <div className="promotions-modal__notice">
                {selectedPromotion.warnings.join(" • ")}
              </div>
            ) : null}

            {selectedPromotion.status === "Active" &&
              !promotionService.canPausePromotion(selectedPromotion) && (
                <div className="promotions-modal__notice">
                  {promotionService.getActionBlockedReason(
                    selectedPromotion,
                    "pause",
                  )}
                </div>
              )}

            {selectedPromotion.status === "Paused" &&
              !promotionService.canResumePromotion(selectedPromotion) && (
                <div className="promotions-modal__notice">
                  {promotionService.getActionBlockedReason(
                    selectedPromotion,
                    "resume",
                  )}
                </div>
              )}

            {selectedPromotion.status === "Expired" &&
              !promotionService.canReopenPromotion(selectedPromotion) && (
                <div className="promotions-modal__notice">
                  {promotionService.getActionBlockedReason(
                    selectedPromotion,
                    "reopen",
                  )}
                </div>
              )}

            {(selectedPromotion.status === "Active" ||
              selectedPromotion.status === "Paused" ||
              selectedPromotion.status === "Scheduled") &&
              !promotionService.canChangePromotionPackage(selectedPromotion) && (
                <div className="promotions-modal__notice">
                  {promotionService.getChangePackageBlockedReason(
                    selectedPromotion,
                  )}
                </div>
              )}

            <div className="promotions-modal__actions">
              <button
                type="button"
                className="promotions-modal__close"
                onClick={closeModal}
              >
                Đóng
              </button>

              {selectedPromotion.status === "Active" ? (
                <>
                  <button
                    type="button"
                    className={
                      promotionService.canChangePromotionPackage(
                        selectedPromotion,
                      )
                        ? "promotions-modal__change"
                        : "promotions-modal__close"
                    }
                    onClick={() => openChangePackageModal(selectedPromotion)}
                    disabled={
                      !promotionService.canChangePromotionPackage(
                        selectedPromotion,
                      )
                    }
                    title={
                      !promotionService.canChangePromotionPackage(
                        selectedPromotion,
                      )
                        ? promotionService.getChangePackageBlockedReason(
                            selectedPromotion,
                          )
                        : "Đổi gói quảng bá"
                    }
                  >
                    Đổi gói
                  </button>
                  <button
                    type="button"
                    className="promotions-modal__pause"
                    onClick={() => handleActionClick(selectedPromotion, "pause")}
                    disabled={
                      !promotionService.canPausePromotion(selectedPromotion)
                    }
                    title={
                      !promotionService.canPausePromotion(selectedPromotion)
                        ? promotionService.getActionBlockedReason(
                            selectedPromotion,
                            "pause",
                          )
                        : "Tạm dừng đơn quảng bá này"
                    }
                  >
                    Tạm dừng
                  </button>
                </>
              ) : selectedPromotion.status === "Paused" ? (
                <>
                  <button
                    type="button"
                    className={
                      promotionService.canChangePromotionPackage(
                        selectedPromotion,
                      )
                        ? "promotions-modal__change"
                        : "promotions-modal__close"
                    }
                    onClick={() => openChangePackageModal(selectedPromotion)}
                    disabled={
                      !promotionService.canChangePromotionPackage(
                        selectedPromotion,
                      )
                    }
                    title={
                      !promotionService.canChangePromotionPackage(
                        selectedPromotion,
                      )
                        ? promotionService.getChangePackageBlockedReason(
                            selectedPromotion,
                          )
                        : "Đổi gói quảng bá"
                    }
                  >
                    Đổi gói
                  </button>
                  <button
                    type="button"
                    className="promotions-modal__resume"
                    onClick={() => handleActionClick(selectedPromotion, "resume")}
                    disabled={
                      !promotionService.canResumePromotion(selectedPromotion)
                    }
                    title={
                      !promotionService.canResumePromotion(selectedPromotion)
                        ? promotionService.getActionBlockedReason(
                            selectedPromotion,
                            "resume",
                          )
                        : "Tiếp tục đơn quảng bá này"
                    }
                  >
                    Tiếp tục
                  </button>
                </>
              ) : selectedPromotion.status === "Scheduled" ? (
                <button
                  type="button"
                  className={
                    promotionService.canChangePromotionPackage(selectedPromotion)
                      ? "promotions-modal__change"
                      : "promotions-modal__close"
                  }
                  onClick={() => openChangePackageModal(selectedPromotion)}
                  disabled={
                    !promotionService.canChangePromotionPackage(
                      selectedPromotion,
                    )
                  }
                  title={
                    !promotionService.canChangePromotionPackage(
                      selectedPromotion,
                    )
                      ? promotionService.getChangePackageBlockedReason(
                          selectedPromotion,
                        )
                      : "Đổi gói quảng bá"
                  }
                >
                  Đổi gói
                </button>
              ) : selectedPromotion.status === "Expired" ? (
                <button
                  type="button"
                  className="promotions-modal__reopen"
                  onClick={() => openReopenModal(selectedPromotion)}
                  disabled={
                    !promotionService.canReopenPromotion(selectedPromotion)
                  }
                  title={
                    !promotionService.canReopenPromotion(selectedPromotion)
                      ? promotionService.getActionBlockedReason(
                          selectedPromotion,
                          "reopen",
                        )
                      : "Mở lại đơn quảng bá đã hết hạn"
                  }
                >
                  Mở lại gói
                </button>
              ) : (
                <button
                  type="button"
                  className="promotions-modal__close"
                  disabled
                  title="Đơn quảng bá đã dùng hết quota trước thời hạn."
                >
                  Hoàn tất
                </button>
              )}
            </div>
          </div>
        ) : null}
      </BaseModal>

      <BaseModal
        isOpen={isActionModalOpen}
        title={
          actionModalMode === "reopen"
            ? "Mở lại gói đã hết hạn"
            : "Đổi gói quảng bá"
        }
        description={
          actionModalMode === "reopen"
            ? "Xác nhận thanh toán và mở lại chiến dịch ngay tại thời điểm admin xử lý."
            : "Chuyển khách sang gói khác và cập nhật lịch chạy từ admin."
        }
        onClose={closeActionModal}
        maxWidth="760px"
      >
        {actionTargetPromotion ? (
          <form
            className="promotions-package-form"
            onSubmit={handlePackageActionSubmit}
          >
            <div className="promotions-modal__grid">
              {actionModalMode === "change" ? (
                <div className="promotions-modal__field">
                  <label htmlFor="slot">Vị trí hiển thị</label>
                  <select
                    id="slot"
                    name="slot"
                    value={actionFormData.slot}
                    onChange={handlePackageActionChange}
                  >
                    {Array.from(
                      new Set(activePackages.map((item) => item.slot)),
                    ).map((slot) => (
                      <option key={slot} value={slot}>
                        {getSlotLabel(slot)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="promotions-modal__field">
                <label htmlFor="packageId">Gói</label>
                <select
                  id="packageId"
                  name="packageId"
                  value={actionFormData.packageId}
                  onChange={handlePackageActionChange}
                >
                  {availablePackages.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {actionModalMode === "change" ? (
                <>
                  <div className="promotions-modal__field">
                    <label htmlFor="startDate">Từ ngày</label>
                    <input
                      id="startDate"
                      name="startDate"
                      type="date"
                      min={todayDateInput}
                      value={actionFormData.startDate}
                      onChange={handlePackageActionChange}
                    />
                  </div>

                  <div className="promotions-modal__field">
                    <label htmlFor="endDate">Đến ngày</label>
                    <input
                      id="endDate"
                      name="endDate"
                      type="date"
                      min={actionFormData.startDate || todayDateInput}
                      value={actionFormData.endDate}
                      disabled
                    />
                    <span className="promotions-modal__hint">
                      Ngày kết thúc được tính tự động theo thời lượng của gói đã chọn.
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="promotions-modal__field">
                    <label>Thời điểm mở lại</label>
                    <input
                      type="text"
                      value="Hệ thống lấy ngay lúc admin xác nhận"
                      disabled
                    />
                  </div>

                  <div className="promotions-modal__field">
                    <label>Kết thúc dự kiến</label>
                    <input
                      type="text"
                      value={
                        selectedActionPackage
                          ? calculateEndDate(
                              todayDateInput,
                              selectedActionPackage.durationDays,
                            )
                          : ""
                      }
                      disabled
                    />
                    <span className="promotions-modal__hint">
                      Hệ thống tự mở lại từ thời điểm xác nhận và tính ngày kết thúc theo thời lượng gói.
                    </span>
                  </div>
                </>
              )}

              <div className="promotions-modal__field">
                <label htmlFor="paymentStatus">Trạng thái thanh toán</label>
                <select
                  id="paymentStatus"
                  name="paymentStatus"
                  value={actionFormData.paymentStatus}
                  onChange={handlePackageActionChange}
                  disabled={actionModalMode === "reopen"}
                >
                  <option value="Paid">Đã thanh toán</option>
                  <option value="Pending Verification">Chờ xác nhận</option>
                </select>
              </div>

              <div className="promotions-modal__field">
                <label>Ngân sách cập nhật</label>
                <input
                  type="text"
                  value={selectedActionPackage?.price ?? ""}
                  disabled
                />
              </div>
            </div>

            <div className="promotions-modal__field">
              <label htmlFor="adminNote">Ghi chú admin</label>
              <textarea
                id="adminNote"
                name="adminNote"
                rows={4}
                value={actionFormData.adminNote}
                onChange={handlePackageActionChange}
                placeholder="Nêu lý do đổi gói hoặc mở lại gói"
              />
            </div>

            <div className="promotions-modal__actions">
              <button
                type="button"
                className="promotions-modal__close"
                onClick={closeActionModal}
                disabled={isActionSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className={
                  actionModalMode === "reopen"
                    ? "promotions-modal__reopen"
                    : "promotions-modal__change"
                }
                disabled={isActionSubmitting}
              >
                {isActionSubmitting
                  ? "Đang lưu..."
                  : actionModalMode === "reopen"
                    ? "Mở lại gói"
                    : "Lưu thay đổi gói"}
              </button>
            </div>
          </form>
        ) : null}
      </BaseModal>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={
          confirmState.action ? confirmTitleMap[confirmState.action] : "Xác nhận"
        }
        message={
          confirmState.action
            ? confirmMessageMap[confirmState.action]
            : "Vui lòng xác nhận thao tác này."
        }
        confirmText={
          confirmState.action
            ? confirmButtonMap[confirmState.action]
            : "Xác nhận"
        }
        cancelText="Hủy"
        tone={
          confirmState.action ? confirmToneMap[confirmState.action] : "neutral"
        }
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmDialog}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default PromotionsPage;
