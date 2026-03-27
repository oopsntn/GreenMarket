import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { shopApi } from "../services/shopApi";
import type { Shop, ShopStatus } from "../types/shop";
import "./ShopsPage.css";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";

type ConfirmAction = "approve" | "reject" | "suspend" | "reactivate";

type ConfirmState = {
  isOpen: boolean;
  shopId: number | null;
  action: ConfirmAction | null;
};

function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

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
      setError(err instanceof Error ? err.message : "Failed to load shops.");
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

      if (!keyword) return true;

      return (
        shop.name.toLowerCase().includes(keyword) ||
        shop.ownerName.toLowerCase().includes(keyword) ||
        shop.ownerEmail.toLowerCase().includes(keyword)
      );
    });
  }, [shops, searchKeyword]);

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
        err instanceof Error ? err.message : "Failed to load shop details.",
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
    approve: "Approve Shop",
    reject: "Reject Shop",
    suspend: "Suspend Shop",
    reactivate: "Reactivate Shop",
  };

  const confirmMessageMap: Record<ConfirmAction, string> = {
    approve: `Are you sure you want to approve ${
      confirmShop?.name ?? "this shop"
    }? This shop will become active in the system.`,
    reject: `Are you sure you want to reject ${
      confirmShop?.name ?? "this shop"
    }? This shop will not be allowed to operate.`,
    suspend: `Are you sure you want to suspend ${
      confirmShop?.name ?? "this shop"
    }? The shop will be temporarily restricted.`,
    reactivate: `Are you sure you want to reactivate ${
      confirmShop?.name ?? "this shop"
    }? The shop will be active again.`,
  };

  const confirmButtonMap: Record<ConfirmAction, string> = {
    approve: "Approve Shop",
    reject: "Reject Shop",
    suspend: "Suspend Shop",
    reactivate: "Reactivate Shop",
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
        showToast(`${targetShop.name} has been approved successfully.`);
      }

      if (confirmState.action === "reject") {
        showToast(`${targetShop.name} has been rejected successfully.`, "info");
      }

      if (confirmState.action === "suspend") {
        showToast(
          `${targetShop.name} has been suspended successfully.`,
          "info",
        );
      }

      if (confirmState.action === "reactivate") {
        showToast(`${targetShop.name} has been reactivated successfully.`);
      }

      setConfirmState({
        isOpen: false,
        shopId: null,
        action: null,
      });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to update shop status.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="shops-page">
      <PageHeader
        title="Shops Management"
        description="Manage shops, shop owners, and approval status in the system."
      />

      <SearchToolbar
        placeholder="Search by shop name or owner"
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onFilterClick={handleApplyFilter}
      />

      {isLoading ? (
        <div className="shops-table-wrapper">
          <LoadingState
            title="Loading shops..."
            description="Please wait while the system loads the latest shop data."
          />
        </div>
      ) : error ? (
        <div className="shops-table-wrapper">
          <ErrorState
            title="Failed to load shops"
            description={error}
            actionLabel="Try Again"
            onActionClick={() => void fetchShops()}
          />
        </div>
      ) : filteredShops.length === 0 ? (
        <EmptyState
          title="No shops found"
          description="No shops match your current search. Try another keyword to continue."
        />
      ) : (
        <div className="shops-table-wrapper">
          <table className="shops-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Shop Name</th>
                <th>Owner</th>
                <th>Owner Email</th>
                <th>Total Posts</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredShops.map((shop) => (
                <tr key={shop.id}>
                  <td>#{shop.id}</td>
                  <td>{shop.name}</td>
                  <td>{shop.ownerName}</td>
                  <td>{shop.ownerEmail || "-"}</td>
                  <td>{shop.totalPosts}</td>
                  <td>
                    <StatusBadge
                      label={shop.status}
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
                        View
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
                            Approve
                          </button>
                          <button
                            type="button"
                            className="shops-actions__reject"
                            onClick={() => openConfirmDialog(shop.id, "reject")}
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {shop.status === "Active" && (
                        <button
                          type="button"
                          className="shops-actions__suspend"
                          onClick={() => openConfirmDialog(shop.id, "suspend")}
                        >
                          Suspend
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
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BaseModal
        isOpen={isModalOpen}
        title="Shop Details"
        description="Review shop information and current approval status."
        onClose={closeModal}
        maxWidth="720px"
      >
        {selectedShop && (
          <div className="shops-modal__content">
            <div className="shops-modal__grid">
              <div className="shops-modal__field">
                <label>Shop Name</label>
                <input type="text" value={selectedShop.name} disabled />
              </div>

              <div className="shops-modal__field">
                <label>Owner</label>
                <input type="text" value={selectedShop.ownerName} disabled />
              </div>

              <div className="shops-modal__field">
                <label>Owner Email</label>
                <input
                  type="text"
                  value={selectedShop.ownerEmail || "-"}
                  disabled
                />
              </div>

              <div className="shops-modal__field">
                <label>Total Posts</label>
                <input
                  type="text"
                  value={String(selectedShop.totalPosts)}
                  disabled
                />
              </div>

              <div className="shops-modal__field">
                <label>Status</label>
                <input type="text" value={selectedShop.status} disabled />
              </div>

              <div className="shops-modal__field">
                <label>Created Date</label>
                <input type="text" value={selectedShop.createdAt} disabled />
              </div>
            </div>

            <div className="shops-modal__field">
              <label>Description</label>
              <textarea value={selectedShop.description} rows={5} disabled />
            </div>

            <div className="shops-modal__actions">
              <button
                type="button"
                className="shops-modal__cancel"
                onClick={closeModal}
              >
                Close
              </button>

              {selectedShop.status === "Pending" && (
                <>
                  <button
                    type="button"
                    className="shops-modal__approve"
                    onClick={() =>
                      openConfirmDialog(selectedShop.id, "approve")
                    }
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="shops-modal__reject"
                    onClick={() => openConfirmDialog(selectedShop.id, "reject")}
                  >
                    Reject
                  </button>
                </>
              )}

              {selectedShop.status === "Active" && (
                <button
                  type="button"
                  className="shops-modal__suspend"
                  onClick={() => openConfirmDialog(selectedShop.id, "suspend")}
                >
                  Suspend
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
                  Reactivate
                </button>
              )}
            </div>
          </div>
        )}
      </BaseModal>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={
          confirmState.action ? confirmTitleMap[confirmState.action] : "Confirm"
        }
        message={
          confirmState.action
            ? confirmMessageMap[confirmState.action]
            : "Please confirm this action."
        }
        confirmText={
          confirmState.action
            ? confirmButtonMap[confirmState.action]
            : "Confirm"
        }
        cancelText="Cancel"
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
