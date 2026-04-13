import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { shopApi } from "../services/shopApi";
import type { Shop, ShopStatus } from "../types/shop";
import "./ShopsPage.css";

type ConfirmAction = "approve" | "reject" | "suspend" | "reactivate";

type ConfirmState = {
  isOpen: boolean;
  shopId: number | null;
  action: ConfirmAction | null;
};

const PAGE_SIZE = 5;

const statusFilterLabelMap: Record<ShopStatus | "All", string> = {
  All: "Tất cả",
  Pending: "Chờ duyệt",
  Active: "Đang hoạt động",
  Suspended: "Tạm ngưng",
  Rejected: "Đã từ chối",
};

const statusBadgeLabelMap: Record<ShopStatus, string> = {
  Pending: "Chờ duyệt",
  Active: "Đang hoạt động",
  Suspended: "Tạm ngưng",
  Rejected: "Đã từ chối",
};

function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    ShopStatus | "All"
  >("All");
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    shopId: null,
    action: null,
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  const fetchShops = async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await shopApi.getShops();
      setShops(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách cửa hàng.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchShops();
  }, []);

  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      const keyword = searchKeyword.trim().toLowerCase();
      const matchesStatus =
        selectedStatusFilter === "All" || shop.status === selectedStatusFilter;

      if (!keyword) return matchesStatus;

      const matchesKeyword =
        shop.name.toLowerCase().includes(keyword) ||
        shop.ownerName.toLowerCase().includes(keyword) ||
        shop.ownerEmail.toLowerCase().includes(keyword);

      return matchesKeyword && matchesStatus;
    });
  }, [searchKeyword, selectedStatusFilter, shops]);

  const totalPages = Math.max(1, Math.ceil(filteredShops.length / PAGE_SIZE));

  const paginatedShops = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredShops.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredShops, page]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedStatusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleApplyFilter = () => {
    setSearchKeyword(searchInput.trim());
  };

  const openViewModal = async (shop: Shop) => {
    try {
      const detailShop = await shopApi.getShopById(shop.id);
      setSelectedShop(detailShop);
      setIsModalOpen(true);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Không thể tải chi tiết cửa hàng.",
        "error",
      );
    }
  };

  const closeModal = () => {
    setSelectedShop(null);
    setIsModalOpen(false);
  };

  const openConfirmDialog = (shopId: number, action: ConfirmAction) => {
    setConfirmState({
      isOpen: true,
      shopId,
      action,
    });
  };

  const closeConfirmDialog = () => {
    if (isSubmitting) return;

    setConfirmState({
      isOpen: false,
      shopId: null,
      action: null,
    });
  };

  const confirmShop =
    confirmState.shopId !== null
      ? (shops.find((shop) => shop.id === confirmState.shopId) ?? null)
      : null;

  const confirmTitleMap: Record<ConfirmAction, string> = {
    approve: "Duyệt cửa hàng",
    reject: "Từ chối cửa hàng",
    suspend: "Tạm ngưng cửa hàng",
    reactivate: "Kích hoạt lại cửa hàng",
  };

  const confirmMessageMap: Record<ConfirmAction, string> = {
    approve: `Bạn có chắc muốn duyệt ${
      confirmShop?.name ?? "cửa hàng này"
    }? Cửa hàng sẽ chuyển sang trạng thái đang hoạt động.`,
    reject: `Bạn có chắc muốn từ chối ${
      confirmShop?.name ?? "cửa hàng này"
    }? Cửa hàng sẽ không được phép hoạt động trên hệ thống.`,
    suspend: `Bạn có chắc muốn tạm ngưng ${
      confirmShop?.name ?? "cửa hàng này"
    }? Cửa hàng sẽ bị hạn chế hoạt động cho đến khi được kích hoạt lại.`,
    reactivate: `Bạn có chắc muốn kích hoạt lại ${
      confirmShop?.name ?? "cửa hàng này"
    }? Cửa hàng sẽ hoạt động trở lại trên hệ thống.`,
  };

  const confirmButtonMap: Record<ConfirmAction, string> = {
    approve: "Duyệt cửa hàng",
    reject: "Từ chối cửa hàng",
    suspend: "Tạm ngưng",
    reactivate: "Kích hoạt lại",
  };

  const confirmToneMap: Record<
    ConfirmAction,
    "danger" | "success" | "neutral"
  > = {
    approve: "success",
    reject: "danger",
    suspend: "danger",
    reactivate: "success",
  };

  const nextStatusMap: Record<ConfirmAction, ShopStatus> = {
    approve: "Active",
    reject: "Rejected",
    suspend: "Suspended",
    reactivate: "Active",
  };

  const handleConfirmAction = async () => {
    if (confirmState.shopId === null || confirmState.action === null) return;

    const targetShop = shops.find((shop) => shop.id === confirmState.shopId);
    if (!targetShop) {
      closeConfirmDialog();
      return;
    }

    try {
      setIsSubmitting(true);

      await shopApi.updateShopStatus(
        confirmState.shopId,
        nextStatusMap[confirmState.action],
      );

      await fetchShops();

      if (selectedShop && selectedShop.id === confirmState.shopId) {
        const updatedDetail = await shopApi.getShopById(confirmState.shopId);
        setSelectedShop(updatedDetail);
      }

      if (confirmState.action === "approve") {
        showToast(`Đã duyệt ${targetShop.name} thành công.`);
      }

      if (confirmState.action === "reject") {
        showToast(`Đã từ chối ${targetShop.name}.`, "info");
      }

      if (confirmState.action === "suspend") {
        showToast(`Đã tạm ngưng ${targetShop.name}.`, "info");
      }

      if (confirmState.action === "reactivate") {
        showToast(`Đã kích hoạt lại ${targetShop.name}.`);
      }

      setConfirmState({
        isOpen: false,
        shopId: null,
        action: null,
      });
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật trạng thái cửa hàng.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="shops-page">
      <PageHeader
        title="Quản lý cửa hàng"
        description="Theo dõi cửa hàng, chủ sở hữu và trạng thái xét duyệt hoạt động trên hệ thống."
      />

      <SearchToolbar
        placeholder="Tìm theo tên cửa hàng hoặc chủ sở hữu"
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleApplyFilter}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Lọc theo trạng thái cửa hàng"
        filterSummaryLabel="Trạng thái hiện tại"
        filterSummaryItems={[statusFilterLabelMap[selectedStatusFilter]]}
      />

      {showFilters ? (
        <SectionCard
          title="Bộ lọc cửa hàng"
          description="Thu hẹp danh sách theo trạng thái xét duyệt và vận hành."
        >
          <div className="shops-filters">
            <div className="shops-filters__field">
              <label htmlFor="shops-status-filter">Trạng thái</label>
              <select
                id="shops-status-filter"
                value={selectedStatusFilter}
                onChange={(event) =>
                  setSelectedStatusFilter(
                    event.target.value as ShopStatus | "All",
                  )
                }
              >
                <option value="All">Tất cả</option>
                <option value="Pending">Chờ duyệt</option>
                <option value="Active">Đang hoạt động</option>
                <option value="Suspended">Tạm ngưng</option>
                <option value="Rejected">Đã từ chối</option>
              </select>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Danh sách cửa hàng"
        description="Rà soát thông tin cửa hàng, chủ sở hữu và trạng thái duyệt hiện tại."
      >
        {isLoading ? (
          <LoadingState
            title="Đang tải cửa hàng"
            description="Vui lòng chờ trong khi hệ thống lấy dữ liệu cửa hàng mới nhất."
          />
        ) : error ? (
          <ErrorState
            title="Không thể tải danh sách cửa hàng"
            description={error}
            actionLabel="Tải lại"
            onActionClick={() => void fetchShops()}
          />
        ) : filteredShops.length === 0 ? (
          <EmptyState
            title="Không tìm thấy cửa hàng"
            description="Không có cửa hàng nào khớp với điều kiện tìm kiếm hiện tại."
          />
        ) : (
          <>
            <div className="shops-table-wrapper">
              <table className="shops-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên cửa hàng</th>
                    <th>Chủ sở hữu</th>
                    <th>Email chủ sở hữu</th>
                    <th>Tổng bài đăng</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedShops.map((shop) => (
                    <tr key={shop.id}>
                      <td>#{shop.id}</td>
                      <td>{shop.name}</td>
                      <td>{shop.ownerName}</td>
                      <td
                        className={!shop.ownerEmail ? "shops-table__muted" : ""}
                      >
                        {shop.ownerEmail || ""}
                      </td>
                      <td>{shop.totalPosts}</td>
                      <td>
                        <StatusBadge
                          label={statusBadgeLabelMap[shop.status]}
                          variant={
                            shop.status === "Active"
                              ? "active"
                              : shop.status === "Pending"
                                ? "pending"
                                : shop.status === "Suspended"
                                  ? "suspended"
                                  : "rejected"
                          }
                        />
                      </td>
                      <td>{shop.createdAt}</td>
                      <td>
                        <div className="shops-actions">
                          <button
                            type="button"
                            className="shops-actions__view"
                            onClick={() => void openViewModal(shop)}
                          >
                            Xem
                          </button>

                          {shop.status === "Pending" && (
                            <>
                              <button
                                type="button"
                                className="shops-actions__approve"
                                onClick={() =>
                                  openConfirmDialog(shop.id, "approve")
                                }
                              >
                                Duyệt
                              </button>
                              <button
                                type="button"
                                className="shops-actions__reject"
                                onClick={() =>
                                  openConfirmDialog(shop.id, "reject")
                                }
                              >
                                Từ chối
                              </button>
                            </>
                          )}

                          {shop.status === "Active" && (
                            <button
                              type="button"
                              className="shops-actions__suspend"
                              onClick={() =>
                                openConfirmDialog(shop.id, "suspend")
                              }
                            >
                              Tạm ngưng
                            </button>
                          )}

                          {shop.status === "Suspended" && (
                            <button
                              type="button"
                              className="shops-actions__reactivate"
                              onClick={() =>
                                openConfirmDialog(shop.id, "reactivate")
                              }
                            >
                              Kích hoạt lại
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="shops-pagination">
              <span className="shops-pagination__info">
                Trang {page} / {totalPages}
              </span>

              <div className="shops-pagination__actions">
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
        isOpen={isModalOpen}
        title="Chi tiết cửa hàng"
        description="Xem thông tin cửa hàng và trạng thái duyệt hiện tại."
        onClose={closeModal}
        maxWidth="720px"
      >
        {selectedShop && (
          <div className="shops-modal__content">
            <div className="shops-modal__grid">
              <div className="shops-modal__field">
                <label>Tên cửa hàng</label>
                <input type="text" value={selectedShop.name} disabled />
              </div>

              <div className="shops-modal__field">
                <label>Chủ sở hữu</label>
                <input type="text" value={selectedShop.ownerName} disabled />
              </div>

              {selectedShop.ownerEmail && (
                <div className="shops-modal__field">
                  <label>Email chủ sở hữu</label>
                  <input type="text" value={selectedShop.ownerEmail} disabled />
                </div>
              )}

              <div className="shops-modal__field">
                <label>Tổng bài đăng</label>
                <input
                  type="text"
                  value={String(selectedShop.totalPosts)}
                  disabled
                />
              </div>

              <div className="shops-modal__field">
                <label>Trạng thái</label>
                <input
                  type="text"
                  value={statusBadgeLabelMap[selectedShop.status]}
                  disabled
                />
              </div>

              <div className="shops-modal__field">
                <label>Ngày tạo</label>
                <input type="text" value={selectedShop.createdAt} disabled />
              </div>
            </div>

            <div className="shops-modal__field">
              <label>Mô tả</label>
              <textarea value={selectedShop.description} rows={5} disabled />
            </div>

            <div className="shops-modal__actions">
              <button
                type="button"
                className="shops-modal__cancel"
                onClick={closeModal}
              >
                Đóng
              </button>

              {selectedShop.status === "Pending" && (
                <>
                  <button
                    type="button"
                    className="shops-modal__approve"
                    onClick={() => openConfirmDialog(selectedShop.id, "approve")}
                  >
                    Duyệt
                  </button>
                  <button
                    type="button"
                    className="shops-modal__reject"
                    onClick={() => openConfirmDialog(selectedShop.id, "reject")}
                  >
                    Từ chối
                  </button>
                </>
              )}

              {selectedShop.status === "Active" && (
                <button
                  type="button"
                  className="shops-modal__suspend"
                  onClick={() => openConfirmDialog(selectedShop.id, "suspend")}
                >
                  Tạm ngưng
                </button>
              )}

              {selectedShop.status === "Suspended" && (
                <button
                  type="button"
                  className="shops-modal__reactivate"
                  onClick={() =>
                    openConfirmDialog(selectedShop.id, "reactivate")
                  }
                >
                  Kích hoạt lại
                </button>
              )}
            </div>
          </div>
        )}
      </BaseModal>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={
          confirmState.action
            ? confirmTitleMap[confirmState.action]
            : "Xác nhận thao tác"
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
        onConfirm={() => void handleConfirmAction()}
        onCancel={closeConfirmDialog}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default ShopsPage;
