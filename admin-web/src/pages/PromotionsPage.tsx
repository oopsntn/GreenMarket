import { useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import StatusBadge from "../components/StatusBadge";
import { promotionService } from "../services/promotionService";
import type { Promotion } from "../types/promotion";
import "./PromotionsPage.css";

type ConfirmAction = "pause" | "resume";

type ConfirmState = {
  isOpen: boolean;
  promotionId: number | null;
  action: ConfirmAction | null;
};

function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>(
    promotionService.getPromotions(),
  );
  const [searchKeyword, setSearchKeyword] = useState("");
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    promotionId: null,
    action: null,
  });

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

  const handleUpdateStatus = (promotion: Promotion) => {
    if (promotion.status === "Active") {
      setPromotions((prev) =>
        promotionService.updatePromotionStatus(prev, promotion.id, "Paused"),
      );
      return;
    }

    if (promotion.status === "Paused") {
      setPromotions((prev) =>
        promotionService.updatePromotionStatus(prev, promotion.id, "Active"),
      );
    }
  };

  const handleConfirmAction = () => {
    if (confirmState.promotionId === null || confirmState.action === null)
      return;

    const targetPromotion = promotions.find(
      (item) => item.id === confirmState.promotionId,
    );
    if (!targetPromotion) {
      closeConfirmDialog();
      return;
    }

    handleUpdateStatus(targetPromotion);
    closeConfirmDialog();
  };

  const filteredPromotions = promotions.filter((promotion) => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return true;

    return (
      promotion.postTitle.toLowerCase().includes(keyword) ||
      promotion.owner.toLowerCase().includes(keyword)
    );
  });

  const confirmPromotion =
    confirmState.promotionId !== null
      ? (promotions.find((item) => item.id === confirmState.promotionId) ??
        null)
      : null;

  const promotionLabel = confirmPromotion?.postTitle ?? "this promotion";

  const confirmTitleMap: Record<ConfirmAction, string> = {
    pause: "Pause Promotion",
    resume: "Resume Promotion",
  };

  const confirmMessageMap: Record<ConfirmAction, string> = {
    pause: `Are you sure you want to pause ${promotionLabel}? This promotion will stop running until it is resumed.`,
    resume: `Are you sure you want to resume ${promotionLabel}? This promotion will become active again.`,
  };

  const confirmButtonMap: Record<ConfirmAction, string> = {
    pause: "Pause Promotion",
    resume: "Resume Promotion",
  };

  const confirmToneMap: Record<
    ConfirmAction,
    "danger" | "success" | "neutral"
  > = {
    pause: "danger",
    resume: "success",
  };

  return (
    <div className="promotions-page">
      <PageHeader
        title="Promotions Management"
        description="Manage boosted posts, placement slots, and promotion status."
        actionLabel="+ Add Promotion"
      />

      <SearchToolbar
        placeholder="Search by post title or owner"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
      />

      <div className="promotions-table-wrapper">
        <table className="promotions-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Post Title</th>
              <th>Owner</th>
              <th>Placement Slot</th>
              <th>Package</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredPromotions.map((promotion) => (
              <tr key={promotion.id}>
                <td>#{promotion.id}</td>
                <td>{promotion.postTitle}</td>
                <td>{promotion.owner}</td>
                <td>
                  <StatusBadge label={promotion.slot} variant="slot" />
                </td>
                <td>{promotion.packageName}</td>
                <td>{promotion.startDate}</td>
                <td>{promotion.endDate}</td>
                <td>
                  <StatusBadge
                    label={promotion.status}
                    variant={
                      promotion.status === "Active"
                        ? "active"
                        : promotion.status === "Paused"
                          ? "paused"
                          : "expired"
                    }
                  />
                </td>
                <td>
                  <div className="promotions-actions">
                    <button type="button" className="promotions-actions__view">
                      View
                    </button>

                    {promotion.status === "Active" ? (
                      <button
                        type="button"
                        className="promotions-actions__pause"
                        onClick={() => openConfirmDialog(promotion.id, "pause")}
                      >
                        Pause
                      </button>
                    ) : promotion.status === "Paused" ? (
                      <button
                        type="button"
                        className="promotions-actions__resume"
                        onClick={() =>
                          openConfirmDialog(promotion.id, "resume")
                        }
                      >
                        Resume
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="promotions-actions__disabled"
                        disabled
                      >
                        Closed
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmDialog}
      />
    </div>
  );
}

export default PromotionsPage;
