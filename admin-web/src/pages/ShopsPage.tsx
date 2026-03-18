import "./ShopsPage.css";

type ShopStatus = "Pending" | "Active" | "Suspended" | "Rejected";

type Shop = {
  id: number;
  name: string;
  ownerName: string;
  ownerEmail: string;
  totalPosts: number;
  status: ShopStatus;
  createdAt: string;
};

const shops: Shop[] = [
  {
    id: 1,
    name: "Green Leaf Corner",
    ownerName: "Nguyen Van A",
    ownerEmail: "vana@greenmarket.vn",
    totalPosts: 12,
    status: "Active",
    createdAt: "2026-03-10",
  },
  {
    id: 2,
    name: "Bonsai Home",
    ownerName: "Tran Thi B",
    ownerEmail: "thib@greenmarket.vn",
    totalPosts: 8,
    status: "Pending",
    createdAt: "2026-03-11",
  },
  {
    id: 3,
    name: "Succulent Garden",
    ownerName: "Le Van C",
    ownerEmail: "vanc@greenmarket.vn",
    totalPosts: 15,
    status: "Suspended",
    createdAt: "2026-03-12",
  },
  {
    id: 4,
    name: "Mini Plant House",
    ownerName: "Pham Thi D",
    ownerEmail: "thid@greenmarket.vn",
    totalPosts: 4,
    status: "Rejected",
    createdAt: "2026-03-13",
  },
];

function ShopsPage() {
  return (
    <div className="shops-page">
      <div className="shops-page__header">
        <div>
          <h2>Shops Management</h2>
          <p>Manage shops, shop owners, and approval status in the system.</p>
        </div>

        <button className="shops-page__add-btn" type="button">
          + Add Shop
        </button>
      </div>

      <div className="shops-toolbar">
        <input
          className="shops-toolbar__search"
          type="text"
          placeholder="Search by shop name or owner"
        />

        <button className="shops-toolbar__filter-btn" type="button">
          Filter
        </button>
      </div>

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
            {shops.map((shop) => (
              <tr key={shop.id}>
                <td>#{shop.id}</td>
                <td>{shop.name}</td>
                <td>{shop.ownerName}</td>
                <td>{shop.ownerEmail}</td>
                <td>{shop.totalPosts}</td>
                <td>
                  <span
                    className={
                      shop.status === "Active"
                        ? "shops-badge shops-badge--active"
                        : shop.status === "Pending"
                          ? "shops-badge shops-badge--pending"
                          : shop.status === "Suspended"
                            ? "shops-badge shops-badge--suspended"
                            : "shops-badge shops-badge--rejected"
                    }
                  >
                    {shop.status}
                  </span>
                </td>
                <td>{shop.createdAt}</td>
                <td>
                  <div className="shops-actions">
                    <button type="button" className="shops-actions__view">
                      View
                    </button>

                    {shop.status === "Pending" && (
                      <>
                        <button
                          type="button"
                          className="shops-actions__approve"
                        >
                          Approve
                        </button>
                        <button type="button" className="shops-actions__reject">
                          Reject
                        </button>
                      </>
                    )}

                    {shop.status === "Active" && (
                      <button type="button" className="shops-actions__suspend">
                        Suspend
                      </button>
                    )}

                    {shop.status === "Suspended" && (
                      <button
                        type="button"
                        className="shops-actions__reactivate"
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
    </div>
  );
}

export default ShopsPage;
