import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { accountPackageService } from "../services/accountPackageService";
import type {
  AccountPackage,
  AccountPackageCode,
  AccountPackageFormState,
} from "../types/accountPackage";
import "./AccountPackagesPage.css";

type PackageGroupFilter = "All" | "Tài khoản" | "Shop";

const PAGE_SIZE = 5;

function AccountPackagesPage() {
  const [packages, setPackages] = useState<AccountPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] =
    useState<PackageGroupFilter>("All");
  const [page, setPage] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<AccountPackage | null>(
    null,
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formData, setFormData] = useState<AccountPackageFormState>({
    price: "",
    durationDays: 90,
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const summaryCards = accountPackageService.getSummaryCards(packages);

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

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setIsLoading(true);
        setPageError("");
        const data = await accountPackageService.getCatalog();
        setPackages(data.packages);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể tải gói tài khoản / shop.";
        setPageError(message);
        showToast(message, "error");
      } finally {
        setIsLoading(false);
      }
    };

    void loadCatalog();
  }, []);

  const filteredPackages = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return packages.filter((item) => {
      const matchesKeyword =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.scopeLabel.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword);

      const matchesGroup =
        selectedGroupFilter === "All" ||
        (selectedGroupFilter === "Tài khoản"
          ? item.code !== "SHOP_VIP"
          : item.code === "SHOP_VIP");

      return matchesKeyword && matchesGroup;
    });
  }, [packages, searchKeyword, selectedGroupFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPackages.length / PAGE_SIZE));

  const paginatedPackages = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredPackages.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredPackages, page]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedGroupFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const openViewModal = (targetPackage: AccountPackage) => {
    setSelectedPackage(targetPackage);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedPackage(null);
    setIsViewModalOpen(false);
  };

  const openEditModal = (targetPackage: AccountPackage) => {
    setSelectedPackage(targetPackage);
    setFormData(accountPackageService.getEmptyForm(targetPackage));
    setFormError("");
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    if (isSubmitting) return;
    setSelectedPackage(null);
    setFormData({ price: "", durationDays: 90 });
    setFormError("");
    setIsFormModalOpen(false);
  };

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "durationDays" ? Number(value) : value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedPackage) {
      return;
    }

    try {
      setIsSubmitting(true);

      const updatedPackage = await accountPackageService.updatePackage(
        selectedPackage.code as AccountPackageCode,
        formData,
        selectedPackage,
      );

      setPackages((prev) =>
        prev.map((item) =>
          item.code === updatedPackage.code ? updatedPackage : item,
        ),
      );

      showToast(`Đã cập nhật gói ${updatedPackage.title}.`);
      closeFormModal();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Không thể lưu thay đổi gói tài khoản / shop.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="account-packages-page">
      <PageHeader
        title="Gói tài khoản / shop"
        description="Quản trị 3 gói cố định của hệ thống: Chủ vườn vĩnh viễn, Cá nhân theo tháng và Nhà vườn VIP. Admin chỉ điều chỉnh giá, và riêng VIP có thể đổi thêm thời hạn."
      />

      <div className="account-packages-summary-grid">
        {summaryCards.map((card) => (
          <div key={card.title} className="account-packages-summary-card">
            <span className="account-packages-summary-card__label">
              {card.title}
            </span>
            <strong className="account-packages-summary-card__value">
              {card.value}
            </strong>
            <p className="account-packages-summary-card__subtitle">
              {card.subtitle}
            </p>
          </div>
        ))}
      </div>

      <SectionCard
        title="Cách quản trị nhóm gói"
        description="Ba gói trong màn này được khóa loại gói để giữ ổn định nghiệp vụ. Admin có thể đổi giá, và với Nhà vườn VIP thì đổi thêm thời hạn để phù hợp chu kỳ vận hành."
      >
        <div className="account-packages-banner">
          <div className="account-packages-banner__item">
            <strong>Gói tài khoản</strong>
            <span>
              Chủ vườn vĩnh viễn và Cá nhân theo tháng ảnh hưởng đến quyền đăng
              bài, mở shop và chính sách vận hành tài khoản.
            </span>
          </div>
          <div className="account-packages-banner__item">
            <strong>Gói shop VIP</strong>
            <span>
              Nhà vườn VIP ảnh hưởng đến độ nổi bật của shop trong danh sách nhà
              vườn. Gói này không đi chung với vị trí hiển thị bài đẩy trên trang
              chủ.
            </span>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Bộ lọc gói tài khoản / shop"
        description="Tìm nhanh 3 gói cố định và chọn đúng nhóm cần điều chỉnh giá."
      >
        <div className="account-packages-filters">
          <div className="account-packages-filters__field account-packages-filters__field--search">
            <label htmlFor="account-package-search">Tìm kiếm</label>
            <input
              id="account-package-search"
              type="text"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Tìm theo tên gói, phạm vi hoặc mô tả"
            />
          </div>

          <div className="account-packages-filters__field">
            <label htmlFor="account-package-group-filter">Nhóm gói</label>
            <select
              id="account-package-group-filter"
              value={selectedGroupFilter}
              onChange={(event) =>
                setSelectedGroupFilter(event.target.value as PackageGroupFilter)
              }
            >
              <option value="All">Tất cả nhóm</option>
              <option value="Tài khoản">Tài khoản</option>
              <option value="Shop">Shop</option>
            </select>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Danh sách gói tài khoản / shop"
        description="Màn này chỉ quản trị 3 gói cố định. Không tạo mới, không xóa, chỉ điều chỉnh giá và thời hạn VIP khi cần."
      >
        {isLoading ? (
          <EmptyState
            title="Đang tải gói tài khoản / shop"
            description="Vui lòng chờ trong khi hệ thống đồng bộ cấu hình hiện tại."
          />
        ) : pageError ? (
          <EmptyState
            title="Không thể tải gói tài khoản / shop"
            description={pageError}
          />
        ) : filteredPackages.length === 0 ? (
          <EmptyState
            title="Không tìm thấy gói phù hợp"
            description="Không có gói nào khớp với bộ lọc hiện tại."
          />
        ) : (
          <>
            <div className="account-packages-table-wrapper">
              <table className="account-packages-table">
                <thead>
                  <tr>
                    <th>Mã gói</th>
                    <th>Tên gói</th>
                    <th>Nhóm</th>
                    <th>Chu kỳ</th>
                    <th>Giá hiện tại</th>
                    <th>Trạng thái</th>
                    <th>Cập nhật gần nhất</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedPackages.map((item) => (
                    <tr key={item.code}>
                      <td>{item.code}</td>
                      <td>{item.title}</td>
                      <td>{item.groupLabel}</td>
                      <td>{item.cycleLabel}</td>
                      <td>{item.priceLabel}</td>
                      <td>
                        <StatusBadge
                          label={item.statusLabel}
                          variant={
                            item.code === "SHOP_VIP" && item.statusLabel === "Tạm dừng"
                              ? "disabled"
                              : "success"
                          }
                        />
                      </td>
                      <td>{item.updatedAt || "Chưa cập nhật"}</td>
                      <td>
                        <div className="account-packages-actions">
                          <button
                            type="button"
                            className="account-packages-actions__view"
                            onClick={() => openViewModal(item)}
                          >
                            Xem
                          </button>
                          <button
                            type="button"
                            className="account-packages-actions__edit"
                            onClick={() => openEditModal(item)}
                          >
                            Sửa giá
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="account-packages-pagination">
              <span className="account-packages-pagination__info">
                Trang {page} / {totalPages}
              </span>
              <div className="account-packages-pagination__actions">
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
        isOpen={isViewModalOpen}
        title="Chi tiết gói tài khoản / shop"
        description="Xem thông tin kinh doanh, quyền lợi và chu kỳ của gói đã chốt trong hệ thống."
        onClose={closeViewModal}
        maxWidth="760px"
      >
        {selectedPackage ? (
          <div className="account-packages-modal">
            <div>
              <span>Tên gói</span>
              <strong>{selectedPackage.title}</strong>
            </div>
            <div>
              <span>Nhóm gói</span>
              <strong>{selectedPackage.groupLabel}</strong>
            </div>
            <div>
              <span>Giá hiện tại</span>
              <strong>{selectedPackage.priceLabel}</strong>
            </div>
            <div>
              <span>Chu kỳ</span>
              <strong>{selectedPackage.cycleLabel}</strong>
            </div>
            <div>
              <span>Trạng thái</span>
              <strong>{selectedPackage.statusLabel}</strong>
            </div>
            <div>
              <span>Cập nhật gần nhất</span>
              <strong>{selectedPackage.updatedAt || "Chưa cập nhật"}</strong>
            </div>
            <div className="account-packages-modal__field">
              <span>Phạm vi áp dụng</span>
              <p>{selectedPackage.scopeLabel}</p>
            </div>
            <div className="account-packages-modal__field">
              <span>Mô tả</span>
              <p>{selectedPackage.description}</p>
            </div>
            <div className="account-packages-modal__field">
              <span>Quyền lợi</span>
              <ul className="account-packages-modal__features">
                {selectedPackage.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </BaseModal>

      <BaseModal
        isOpen={isFormModalOpen}
        title="Điều chỉnh gói tài khoản / shop"
        description="Admin chỉ được sửa giá, và riêng gói Nhà vườn VIP được sửa thêm thời hạn áp dụng."
        onClose={closeFormModal}
        maxWidth="720px"
      >
        {selectedPackage ? (
          <form className="account-package-form" onSubmit={handleSubmit}>
            <label>
              <span>Tên gói</span>
              <input type="text" value={selectedPackage.title} disabled />
            </label>

            <label>
              <span>Giá mới</span>
              <input
                name="price"
                type="text"
                value={formData.price}
                onChange={handleFormChange}
                disabled={isSubmitting}
                placeholder="Nhập giá mới"
              />
            </label>

            <label>
              <span>Chu kỳ</span>
              <input type="text" value={selectedPackage.cycleLabel} disabled />
            </label>

            <label>
              <span>Phạm vi</span>
              <input type="text" value={selectedPackage.scopeLabel} disabled />
            </label>

            {selectedPackage.durationEditable ? (
              <label className="account-package-form__wide">
                <span>Thời hạn VIP (ngày)</span>
                <input
                  name="durationDays"
                  type="number"
                  min={1}
                  value={formData.durationDays}
                  onChange={handleFormChange}
                  disabled={isSubmitting}
                />
              </label>
            ) : null}

            {formError ? (
              <p className="account-package-form__error">{formError}</p>
            ) : null}

            <div className="account-package-form__actions">
              <button
                type="button"
                className="account-package-form__cancel"
                onClick={closeFormModal}
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="account-package-form__submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi giá"}
              </button>
            </div>
          </form>
        ) : null}
      </BaseModal>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default AccountPackagesPage;
