import { useState } from "react";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import { promotionService } from "../services/promotionService";
import type { Promotion } from "../types/promotion";
import "./PromotionsPage.css";

function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>(
    promotionService.getPromotions(),
  );
  const [searchKeyword, setSearchKeyword] = useState("");

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

  const filteredPromotions = promotions.filter((promotion) => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return true;

    return (
      promotion.postTitle.toLowerCase().includes(keyword) ||
      promotion.owner.toLowerCase().includes(keyword)
    );
  });

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
                  <span className="promotions-badge promotions-badge--slot">
                    {promotion.slot}
                  </span>
                </td>
                <td>{promotion.packageName}</td>
                <td>{promotion.startDate}</td>
                <td>{promotion.endDate}</td>
                <td>
                  <span
                    className={
                      promotion.status === "Active"
                        ? "promotions-badge promotions-badge--active"
                        : promotion.status === "Paused"
                          ? "promotions-badge promotions-badge--paused"
                          : "promotions-badge promotions-badge--expired"
                    }
                  >
                    {promotion.status}
                  </span>
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
                        onClick={() => handleUpdateStatus(promotion)}
                      >
                        Pause
                      </button>
                    ) : promotion.status === "Paused" ? (
                      <button
                        type="button"
                        className="promotions-actions__resume"
                        onClick={() => handleUpdateStatus(promotion)}
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
    </div>
  );
}

export default PromotionsPage;
