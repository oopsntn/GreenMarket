import { useState } from "react";
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
  description: string;
};

const initialShops: Shop[] = [
  {
    id: 1,
    name: "Green Leaf Corner",
    ownerName: "Nguyen Van A",
    ownerEmail: "vana@greenmarket.vn",
    totalPosts: 12,
    status: "Active",
    createdAt: "2026-03-10",
    description:
      "A specialty plant shop focusing on indoor plants, decorative pots, and beginner-friendly care guides.",
  },
  {
    id: 2,
    name: "Bonsai Home",
    ownerName: "Tran Thi B",
    ownerEmail: "thib@greenmarket.vn",
    totalPosts: 8,
    status: "Pending",
    createdAt: "2026-03-11",
    description:
      "A curated bonsai store offering premium miniature trees, pruning tools, and maintenance support.",
  },
  {
    id: 3,
    name: "Succulent Garden",
    ownerName: "Le Van C",
    ownerEmail: "vanc@greenmarket.vn",
    totalPosts: 15,
    status: "Suspended",
    createdAt: "2026-03-12",
    description:
      "A succulent-focused shop with themed combo sets, terrarium kits, and seasonal offers.",
  },
  {
    id: 4,
    name: "Mini Plant House",
    ownerName: "Pham Thi D",
    ownerEmail: "thid@greenmarket.vn",
    totalPosts: 4,
    status: "Rejected",
    createdAt: "2026-03-13",
    description:
      "A small plant startup shop currently under review for profile and product information completeness.",
  },
];

function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openViewModal = (shop: Shop) => {
    setSelectedShop(shop);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedShop(null);
    setIsModalOpen(false);
  };

  const updateShopStatus = (shopId: number, status: ShopStatus) => {
    setShops((prev) =>
      prev.map((shop) => (shop.id === shopId ? { ...shop, status } : shop)),
    );

    setSelectedShop((prev) =>
      prev && prev.id === shopId ? { ...prev, status } : prev,
    );
  };

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
                    <button
                      type="button"
                      className="shops-actions__view"
                      onClick={() => openViewModal(shop)}
                    >
                      View
                    </button>

                    {shop.status === "Pending" && (
                      <>
                        <button
                          type="button"
                          className="shops-actions__approve"
                          onClick={() => updateShopStatus(shop.id, "Active")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="shops-actions__reject"
                          onClick={() => updateShopStatus(shop.id, "Rejected")}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {shop.status === "Active" && (
                      <button
                        type="button"
                        className="shops-actions__suspend"
                        onClick={() => updateShopStatus(shop.id, "Suspended")}
                      >
                        Suspend
                      </button>
                    )}

                    {shop.status === "Suspended" && (
                      <button
                        type="button"
                        className="shops-actions__reactivate"
                        onClick={() => updateShopStatus(shop.id, "Active")}
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

      {isModalOpen && selectedShop && (
        <div className="shops-modal-backdrop">
          <div className="shops-modal">
            <div className="shops-modal__header">
              <div>
                <h3>Shop Details</h3>
                <p>Review shop information and current approval status.</p>
              </div>

              <button
                type="button"
                className="shops-modal__close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

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
                  <input type="text" value={selectedShop.ownerEmail} disabled />
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
                        updateShopStatus(selectedShop.id, "Active")
                      }
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="shops-modal__reject"
                      onClick={() =>
                        updateShopStatus(selectedShop.id, "Rejected")
                      }
                    >
                      Reject
                    </button>
                  </>
                )}

                {selectedShop.status === "Active" && (
                  <button
                    type="button"
                    className="shops-modal__suspend"
                    onClick={() =>
                      updateShopStatus(selectedShop.id, "Suspended")
                    }
                  >
                    Suspend
                  </button>
                )}

                {selectedShop.status === "Suspended" && (
                  <button
                    type="button"
                    className="shops-modal__reactivate"
                    onClick={() => updateShopStatus(selectedShop.id, "Active")}
                  >
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShopsPage;
