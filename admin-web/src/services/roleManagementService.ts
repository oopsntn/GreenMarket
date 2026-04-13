import { apiClient } from "../lib/apiClient";
import type {
  ApiBusinessRoleResponse,
  RoleFormState,
  RoleManagementItem,
} from "../types/roleManagement";

const translateRoleTitle = (value: string) => {
  const normalized = value.trim().toLowerCase();

  if (normalized === "user") return "Người dùng";
  if (normalized === "host") return "Chủ shop";
  if (normalized === "collaborator") return "Cộng tác viên";
  if (normalized === "manager") return "Quản lý";
  if (normalized === "operation staff") return "Nhân viên vận hành";

  return value;
};

const translateAudienceGroup = (
  value: string | null | undefined,
): "Marketplace" | "Operations" => {
  return value?.toLowerCase() === "operations" ? "Operations" : "Marketplace";
};

const translateText = (value: string | null | undefined) => {
  const normalized = value?.trim();
  if (!normalized) {
    return "";
  }

  const replacements: Record<string, string> = {
    Marketplace: "Marketplace",
    Operations: "Vận hành",
    "User Web + User App": "Web người dùng + ứng dụng người dùng",
    "Browse listings": "Xem bài đăng",
    "Save favorites": "Lưu yêu thích",
    "Contact sellers": "Liên hệ người bán",
    "Submit reports": "Gửi báo cáo",
    "View approved posts": "Xem bài đăng đã duyệt",
    "Report listings": "Báo cáo bài đăng",
    "Track personal purchase and contact history":
      "Theo dõi lịch sử mua hàng và liên hệ cá nhân",
    "Marketplace customer role used by buyers and visitors who explore ornamental plant listings.":
      "Vai trò khách hàng marketplace dành cho người mua và người truy cập đang xem các bài đăng cây cảnh.",
    "Manage shop profile and listings":
      "Quản lý hồ sơ shop và bài đăng",
    "Purchase promotion packages": "Mua gói quảng bá",
    "Track shop analytics": "Theo dõi phân tích của shop",
    "Prepare content and media for listings":
      "Chuẩn bị nội dung và media cho bài đăng",
    "Edit assigned listings": "Chỉnh sửa bài đăng được phân công",
    "Upload media": "Tải lên media",
    "View moderation feedback": "Xem phản hồi kiểm duyệt",
    "View moderation reports and results":
      "Xem báo cáo và kết quả kiểm duyệt",
    "Oversee promotion operations": "Giám sát vận hành quảng bá",
    "Access operational dashboards": "Truy cập dashboard điều hành",
    "Perform moderation workflows": "Thực hiện thao tác kiểm duyệt",
    "Support campaign operations": "Hỗ trợ xử lý chiến dịch",
    "Export reports and logs": "Xuất báo cáo và nhật ký",
  };

  return replacements[normalized] || normalized;
};

const defaultRoleCatalog: Array<{
  code: string;
  title: string;
  audienceGroup: "Marketplace" | "Operations";
  accessScope: string;
  summary: string;
  responsibilities: string[];
  capabilities: string[];
}> = [
  {
    code: "USER",
    title: "Người dùng",
    audienceGroup: "Marketplace",
    accessScope:
      "Duyệt bài đăng, lưu mục yêu thích, liên hệ người bán và gửi báo cáo vi phạm.",
    summary:
      "Vai trò khách hàng trong sàn, dùng cho người mua và người truy cập đang xem các bài đăng cây cảnh.",
    responsibilities: [
      "Tìm kiếm và xem các bài đăng cây cảnh",
      "Lưu bài đăng và liên hệ shop",
      "Gửi báo cáo khi nội dung có dấu hiệu bất thường",
    ],
    capabilities: [
      "Xem các bài đăng đã duyệt",
      "Báo cáo bài đăng",
      "Theo dõi lịch sử mua hàng và liên hệ cá nhân",
    ],
  },
  {
    code: "HOST",
    title: "Chủ shop",
    audienceGroup: "Marketplace",
    accessScope:
      "Vận hành shop cây cảnh, đăng bài, quản lý hồ sơ shop và mua gói quảng bá.",
    summary:
      "Vai trò người bán dành cho chủ shop đăng cây cảnh và quản lý các gói quảng bá.",
    responsibilities: [
      "Tạo và duy trì hồ sơ shop",
      "Đăng mới và cập nhật bài bán hàng",
      "Mua gói quảng bá và theo dõi chiến dịch",
    ],
    capabilities: [
      "Quản lý shop và bài đăng",
      "Mua gói quảng bá",
      "Theo dõi phân tích của shop",
    ],
  },
  {
    code: "COLLABORATOR",
    title: "Cộng tác viên",
    audienceGroup: "Marketplace",
    accessScope:
      "Hỗ trợ Chủ shop chuẩn bị nội dung, cập nhật bài đăng và quản lý hình ảnh hoặc video.",
    summary:
      "Vai trò cộng tác vận hành do Chủ shop phân công để hỗ trợ duy trì chất lượng bài đăng và nội dung shop.",
    responsibilities: [
      "Chuẩn bị nội dung và media cho bài đăng",
      "Cập nhật thông tin bài đăng thay cho Chủ shop",
      "Phối hợp với quản lý hoặc nhân viên vận hành khi có phản hồi kiểm duyệt",
    ],
    capabilities: [
      "Chỉnh sửa bài đăng được phân công",
      "Tải lên media",
      "Xem phản hồi kiểm duyệt",
    ],
  },
  {
    code: "MANAGER",
    title: "Quản lý",
    audienceGroup: "Operations",
    accessScope:
      "Giám sát kiểm duyệt, theo dõi quảng bá, thực thi chính sách và tổng hợp đánh giá vận hành.",
    summary:
      "Vai trò giám sát theo dõi chất lượng vận hành, xử lý chiến dịch và phối hợp nhân sự.",
    responsibilities: [
      "Xem các tình huống vận hành bị chuyển cấp",
      "Phê duyệt quyết định xử lý chiến dịch",
      "Theo dõi phân tích và tổng hợp doanh thu",
    ],
    capabilities: [
      "Xem báo cáo và kết quả kiểm duyệt",
      "Giám sát xử lý quảng bá",
      "Truy cập các dashboard điều hành",
    ],
  },
  {
    code: "OPERATION_STAFF",
    title: "Nhân viên vận hành",
    audienceGroup: "Operations",
    accessScope:
      "Thực hiện kiểm duyệt hằng ngày, hỗ trợ mở lại quảng bá, xuất báo cáo và xử lý nghiệp vụ vận hành.",
    summary:
      "Vai trò nhân sự vận hành trực tiếp, thực hiện các tác vụ hằng ngày do quản lý hoặc admin giao.",
    responsibilities: [
      "Kiểm duyệt nội dung bị báo cáo và xử lý vấn đề người dùng",
      "Hỗ trợ mở lại quảng bá và xử lý gói dịch vụ",
      "Chuẩn bị file xuất và tổng hợp vận hành",
    ],
    capabilities: [
      "Thực hiện thao tác kiểm duyệt",
      "Hỗ trợ xử lý chiến dịch",
      "Xuất báo cáo và nhật ký",
    ],
  },
];

const ensureStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => translateText(item))
    .filter(Boolean);
};

const toMultilineText = (values: string[]) => values.join("\n");

const parseMultilineText = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const mapApiStatusToUi = (value: string | null | undefined) =>
  value?.toLowerCase() === "disabled" ? "Disabled" : "Active";

const mapApiRoleToUi = (item: ApiBusinessRoleResponse): RoleManagementItem => ({
  id: item.businessRoleId,
  code: item.businessRoleCode,
  title: translateRoleTitle(item.businessRoleTitle),
  audienceGroup: translateAudienceGroup(item.businessRoleAudienceGroup),
  accessScope: translateText(item.businessRoleAccessScope),
  summary: translateText(item.businessRoleSummary),
  responsibilities: ensureStringArray(item.businessRoleResponsibilities),
  capabilities: ensureStringArray(item.businessRoleCapabilities),
  createdAt: item.businessRoleCreatedAt?.slice(0, 10) ?? "",
  updatedAt: item.businessRoleUpdatedAt?.slice(0, 10) ?? "",
  status: mapApiStatusToUi(item.businessRoleStatus),
});

const mapFormToApiPayload = (
  existingRole: RoleManagementItem,
  formData: RoleFormState,
) => ({
  businessRoleCode: existingRole.code,
  businessRoleTitle: formData.title.trim(),
  businessRoleAudienceGroup: formData.audienceGroup,
  businessRoleAccessScope: formData.accessScope.trim(),
  businessRoleSummary: formData.summary.trim(),
  businessRoleResponsibilities: parseMultilineText(formData.responsibilitiesText),
  businessRoleCapabilities: parseMultilineText(formData.capabilitiesText),
  businessRoleStatus:
    existingRole.status === "Disabled" ? "disabled" : "active",
});

export const roleManagementService = {
  async fetchRoles(): Promise<RoleManagementItem[]> {
    const data = await apiClient.request<ApiBusinessRoleResponse[]>(
      "/api/admin/business-roles",
      {
        defaultErrorMessage:
          "Không thể tải danh mục vai trò nghiệp vụ của marketplace.",
      },
    );

    return data.map(mapApiRoleToUi);
  },

  mapRoleToForm(role: RoleManagementItem): RoleFormState {
    return {
      title: role.title,
      audienceGroup: role.audienceGroup,
      accessScope: role.accessScope,
      summary: role.summary,
      responsibilitiesText: toMultilineText(role.responsibilities),
      capabilitiesText: toMultilineText(role.capabilities),
    };
  },

  async updateRole(
    roleId: number,
    existingRole: RoleManagementItem,
    formData: RoleFormState,
  ): Promise<RoleManagementItem> {
    const data = await apiClient.request<ApiBusinessRoleResponse>(
      `/api/admin/business-roles/${roleId}`,
      {
        method: "PUT",
        includeJsonContentType: true,
        defaultErrorMessage:
          "Không thể cập nhật vai trò nghiệp vụ của marketplace.",
        body: JSON.stringify(mapFormToApiPayload(existingRole, formData)),
      },
    );

    return mapApiRoleToUi(data);
  },

  async syncDefaultRoles(): Promise<RoleManagementItem[]> {
    const existingRoles = await this.fetchRoles();
    const existingByCode = new Map(existingRoles.map((role) => [role.code, role]));

    await Promise.all(
      defaultRoleCatalog.map(async (defaultRole) => {
        const matched = existingByCode.get(defaultRole.code);

        const payload = {
          businessRoleCode: defaultRole.code,
          businessRoleTitle: defaultRole.title,
          businessRoleAudienceGroup: defaultRole.audienceGroup,
          businessRoleAccessScope: defaultRole.accessScope,
          businessRoleSummary: defaultRole.summary,
          businessRoleResponsibilities: defaultRole.responsibilities,
          businessRoleCapabilities: defaultRole.capabilities,
          businessRoleStatus: "active",
        };

        if (matched) {
          await apiClient.request<ApiBusinessRoleResponse>(
            `/api/admin/business-roles/${matched.id}`,
            {
              method: "PUT",
              includeJsonContentType: true,
              defaultErrorMessage: `Không thể đồng bộ vai trò ${defaultRole.title}.`,
              body: JSON.stringify(payload),
            },
          );
          return;
        }

        await apiClient.request<ApiBusinessRoleResponse>(
          "/api/admin/business-roles",
          {
            method: "POST",
            includeJsonContentType: true,
            defaultErrorMessage: `Không thể tạo vai trò ${defaultRole.title}.`,
            body: JSON.stringify(payload),
          },
        );
      }),
    );

    return this.fetchRoles();
  },
};
