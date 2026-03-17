import "./PromotionsPage.css";

type Promotion = {
  id: number;
  postTitle: string;
  owner: string;
  slot: "Home Top" | "Category Top" | "Search Boost";
  packageName: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Paused" | "Expired";
};

const promotions: Promotion[] = [
  {
    id: 1,
    postTitle: "Rare Monstera Deliciosa for Sale",
    owner: "Nguyen Van A",
    slot: "Home Top",
    packageName: "Premium 7 Days",
    startDate: "2026-03-15",
    endDate: "2026-03-22",
    status: "Active",
  },
  {
    id: 2,
    postTitle: "Mini Bonsai Collection",
    owner: "Tran Thi B",
    slot: "Category Top",
    packageName: "Standard 5 Days",
    startDate: "2026-03-14",
    endDate: "2026-03-19",
    status: "Paused",
  },
  {
    id: 3,
    postTitle: "Succulent Combo Pot Set",
    owner: "Le Van C",
    slot: "Search Boost",
    packageName: "Boost 3 Days",
    startDate: "2026-03-10",
    endDate: "2026-03-13",
    status: "Expired",
  },
];

function PromotionsPage() {
  return (
    <div className="promotions-page">
      <div className="promotions-page__header">
        <div>
          <h2>Promotions Management</h2>
          <p>Manage boosted posts, placement slots, and promotion status.</p>
        </div>

        <button className="promotions-page__add-btn" type="button">
          + Add Promotion
        </button>
      </div>

      <div className="promotions-toolbar">
        <input
          className="promotions-toolbar__search"
          type="text"
          placeholder="Search by post title or owner"
        />

        <button className="promotions-toolbar__filter-btn" type="button">
          Filter
        </button>
      </div>

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
            {promotions.map((promotion) => (
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
                      >
                        Pause
                      </button>
                    ) : promotion.status === "Paused" ? (
                      <button
                        type="button"
                        className="promotions-actions__resume"
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
