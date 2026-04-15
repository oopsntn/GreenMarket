import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BaseModal from "../components/BaseModal";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { roleManagementService } from "../services/roleManagementService";
import type {
  RoleFormState,
  RoleManagementItem,
} from "../types/roleManagement";
import "./RolesManagementPage.css";

const capabilityRows = [
  {
    capability: "Duyệt và mua bài đăng cây cảnh",
    roles: ["USER"],
  },
  {
    capability: "Quản lý hồ sơ shop và bài đăng cây cảnh",
    roles: ["HOST", "COLLABORATOR"],
  },
  {
    capability: "Mua và theo dõi gói quảng bá",
    roles: ["HOST", "MANAGER"],
  },
  {
    capability: "Xử lý kiểm duyệt và báo cáo vi phạm",
    roles: ["MANAGER", "OPERATION_STAFF"],
  },
  {
    capability: "Xem phân tích, doanh thu và xuất báo cáo",
    roles: ["MANAGER", "OPERATION_STAFF"],
  },
];

const audienceGroupLabel = {
  Marketplace: "Kinh doanh trên sàn",
  Operations: "Vận hành",
} as const;

function RolesManagementPage() {
  const [roles, setRoles] = useState<RoleManagementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleManagementItem | null>(
    null,
  );
  const [formData, setFormData] = useState<RoleFormState | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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

  const loadRoles = useCallback(async (showSuccessToast = false) => {
    try {
      setIsLoading(true);
      setError("");

      const data = await roleManagementService.fetchRoles();
      setRoles(data);

      if (showSuccessToast) {
        showToast("Đã tải lại danh mục vai trò nghiệp vụ.");
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Không thể tải danh mục vai trò nghiệp vụ.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const filteredRoles = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return roles.filter((role) => {
      return (
        !keyword ||
        role.code.toLowerCase().includes(keyword) ||
        role.title.toLowerCase().includes(keyword) ||
        role.summary.toLowerCase().includes(keyword)
      );
    });
  }, [roles, searchKeyword]);

  const marketplaceRoleCount = roles.filter(
    (role) => role.audienceGroup === "Marketplace",
  ).length;
  const operationsRoleCount = roles.filter(
    (role) => role.audienceGroup === "Operations",
  ).length;

  const openEditModal = (role: RoleManagementItem) => {
    setSelectedRole(role);
    setFormData(roleManagementService.mapRoleToForm(role));
  };

  const closeModal = () => {
    setSelectedRole(null);
    setFormData(null);
  };

  const handleFormChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;

    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [name]: value,
          }
        : prev,
    );
  };

  const handleSaveRole = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedRole || !formData) return;

    try {
      const updatedRole = await roleManagementService.updateRole(
        selectedRole.id,
        selectedRole,
        formData,
      );

      setRoles((prev) =>
        prev.map((role) => (role.id === updatedRole.id ? updatedRole : role)),
      );

      closeModal();
      showToast(`Đã cập nhật định nghĩa vai trò ${updatedRole.title}.`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Không thể cập nhật vai trò.",
        "error",
      );
    }
  };

  const handleResetCatalog = async () => {
    try {
      setIsLoading(true);
      const syncedRoles = await roleManagementService.syncDefaultRoles();
      setRoles(syncedRoles);
      showToast(
        "Đã đồng bộ danh mục vai trò theo nghiệp vụ chuẩn của GreenMarket.",
        "info",
      );
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Không thể đồng bộ vai trò mặc định.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="roles-management-page">
      <PageHeader
        title="Quản lý vai trò nghiệp vụ"
        description="Admin quản lý danh mục vai trò nghiệp vụ dùng chung trong GreenMarket. Màn này chỉ mô tả vai trò nghiệp vụ, không quản lý quyền đăng nhập admin."
        actionLabel="Đồng bộ vai trò chuẩn"
        onActionClick={() => void handleResetCatalog()}
      />

      <div className="roles-management-summary-grid">
        <StatCard
          title="Tổng vai trò quản lý"
          value={String(roles.length)}
          subtitle="Danh mục vai trò nghiệp vụ do admin duy trì"
        />
        <StatCard
          title="Vai trò kinh doanh trên sàn"
          value={String(marketplaceRoleCount)}
          subtitle="Vai trò tham gia luồng mua bán trên sàn"
        />
        <StatCard
          title="Vai trò vận hành"
          value={String(operationsRoleCount)}
          subtitle="Vai trò nội bộ phục vụ vận hành và giám sát"
        />
      </div>

      <SearchToolbar
        placeholder="Tìm theo tên vai trò, mã vai trò hoặc phạm vi trách nhiệm"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        filterSummaryItems={[
          `Hiển thị ${filteredRoles.length} vai trò`,
          `${roles.filter((role) => role.status === "Active").length} đang hoạt động`,
        ]}
      />

      <SectionCard
        title="Nơi gán vai trò thực tế"
        description="Màn này chỉ định nghĩa danh mục vai trò. Việc gán vai trò cho từng tài khoản trên sàn được thực hiện ở màn Người dùng."
        actions={
          <Link className="roles-management-link" to="/users">
            Mở màn Người dùng
          </Link>
        }
      >
        <p className="roles-management-note">
          Dùng màn này để chuẩn hóa ý nghĩa, phạm vi và trách nhiệm của từng vai
          trò nghiệp vụ. Khi cần gán một vai trò cho tài khoản cụ thể, hãy sang
          màn Người dùng.
        </p>
      </SectionCard>

      <SectionCard
        title="Danh mục vai trò"
        description="Rà soát ý nghĩa nghiệp vụ, phạm vi truy cập và trách nhiệm chính của từng vai trò theo tài liệu báo cáo dự án."
      >
        {isLoading ? (
          <div className="roles-management-empty-state">
            Đang tải danh mục vai trò nghiệp vụ...
          </div>
        ) : error ? (
          <EmptyState title="Không thể tải vai trò" description={error} />
        ) : filteredRoles.length === 0 ? (
          <EmptyState
            title="Không tìm thấy vai trò"
            description="Không có vai trò nào khớp với từ khóa tìm kiếm hiện tại."
          />
        ) : (
          <div className="roles-management-list">
            {filteredRoles.map((role) => (
              <div key={role.id} className="roles-management-card">
                <div className="roles-management-card__header">
                  <div>
                    <strong>{role.title}</strong>
                    <p>{role.summary}</p>
                  </div>

                  <button type="button" onClick={() => openEditModal(role)}>
                    Sửa định nghĩa
                  </button>
                </div>

                <div className="roles-management-card__meta">
                  <StatusBadge label={role.code} variant="type" />
                  <StatusBadge
                    label={
                      role.audienceGroup === "Marketplace"
                        ? audienceGroupLabel.Marketplace
                        : audienceGroupLabel.Operations
                    }
                    variant="processing"
                  />
                  <StatusBadge
                    label={
                      role.status === "Active"
                        ? "Đang hoạt động"
                        : "Ngừng hoạt động"
                    }
                    variant={role.status === "Active" ? "active" : "locked"}
                  />
                </div>

                <div className="roles-management-card__details">
                  <div>
                    <label>Phạm vi truy cập</label>
                    <p>{role.accessScope}</p>
                  </div>

                  <div>
                    <label>Trách nhiệm chính</label>
                    <ul>
                      {role.responsibilities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <label>Năng lực tiêu biểu</label>
                    <ul>
                      {role.capabilities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Ma trận năng lực vai trò"
        description="Đối chiếu nhanh vai trò nào nên đảm nhiệm từng chức năng cốt lõi trong GreenMarket."
      >
        <div className="roles-capability-table-wrapper">
          <table className="roles-capability-table">
            <thead>
              <tr>
                <th>Chức năng</th>
                {roles.map((role) => (
                  <th key={role.code}>{role.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {capabilityRows.map((row) => (
                <tr key={row.capability}>
                  <td>{row.capability}</td>
                  {roles.map((role) => (
                    <td key={`${row.capability}-${role.code}`}>
                      {row.roles.includes(role.code) ? "Có" : "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <BaseModal
        isOpen={selectedRole !== null && formData !== null}
        title={
          selectedRole
            ? `Chỉnh sửa vai trò ${selectedRole.title}`
            : "Chỉnh sửa vai trò"
        }
        description="Cập nhật mô tả, phạm vi và trách nhiệm cho vai trò nghiệp vụ trong danh mục do admin quản lý."
        onClose={closeModal}
        maxWidth="720px"
      >
        {selectedRole && formData ? (
          <form className="roles-management-form" onSubmit={handleSaveRole}>
            <div className="roles-management-form__field">
              <label>Mã vai trò</label>
              <input type="text" value={selectedRole.code} disabled />
            </div>

            <div className="roles-management-form__grid">
              <div className="roles-management-form__field">
                <label htmlFor="role-title">Tên vai trò</label>
                <input
                  id="role-title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleFormChange}
                />
              </div>

              <div className="roles-management-form__field">
                <label htmlFor="role-audience-group">Nhóm vai trò</label>
                <select
                  id="role-audience-group"
                  name="audienceGroup"
                  value={formData.audienceGroup}
                  onChange={handleFormChange}
                >
                  <option value="Marketplace">{audienceGroupLabel.Marketplace}</option>
                  <option value="Operations">{audienceGroupLabel.Operations}</option>
                </select>
              </div>
            </div>

            <div className="roles-management-form__field">
              <label htmlFor="role-scope">Phạm vi truy cập</label>
              <textarea
                id="role-scope"
                name="accessScope"
                rows={3}
                value={formData.accessScope}
                onChange={handleFormChange}
              />
            </div>

            <div className="roles-management-form__field">
              <label htmlFor="role-summary">Mô tả vai trò</label>
              <textarea
                id="role-summary"
                name="summary"
                rows={3}
                value={formData.summary}
                onChange={handleFormChange}
              />
            </div>

            <div className="roles-management-form__grid">
              <div className="roles-management-form__field">
                <label htmlFor="role-responsibilities">Trách nhiệm</label>
                <textarea
                  id="role-responsibilities"
                  name="responsibilitiesText"
                  rows={6}
                  value={formData.responsibilitiesText}
                  onChange={handleFormChange}
                />
              </div>

              <div className="roles-management-form__field">
                <label htmlFor="role-capabilities">Năng lực</label>
                <textarea
                  id="role-capabilities"
                  name="capabilitiesText"
                  rows={6}
                  value={formData.capabilitiesText}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="roles-management-form__actions">
              <button type="button" onClick={closeModal}>
                Hủy
              </button>
              <button type="submit">Lưu định nghĩa vai trò</button>
            </div>
          </form>
        ) : null}
      </BaseModal>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default RolesManagementPage;
