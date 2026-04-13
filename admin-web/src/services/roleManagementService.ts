import { apiClient } from "../lib/apiClient";
import type {
  ApiBusinessRoleResponse,
  RoleFormState,
  RoleManagementItem,
} from "../types/roleManagement";

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
    title: "User",
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
    title: "Host",
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
    title: "Collaborator",
    audienceGroup: "Marketplace",
    accessScope:
      "Hỗ trợ Host chuẩn bị nội dung, cập nhật bài đăng và quản lý hình ảnh/video.",
    summary:
      "Vai trò cộng tác vận hành do Host phân công để hỗ trợ duy trì chất lượng bài đăng và nội dung shop.",
    responsibilities: [
      "Chuẩn bị nội dung và media cho bài đăng",
      "Cập nhật thông tin bài đăng thay cho Host",
      "Phối hợp với Manager hoặc Operation Staff khi có phản hồi kiểm duyệt",
    ],
    capabilities: [
      "Chỉnh sửa bài đăng được phân công",
      "Tải lên media",
      "Xem phản hồi kiểm duyệt",
    ],
  },
  {
    code: "MANAGER",
    title: "Manager",
    audienceGroup: "Operations",
    accessScope:
      "Giám sát kiểm duyệt, theo dõi quảng bá, thực thi chính sách và tổng hợp đánh giá vận hành.",
    summary:
      "Vai trò giám sát theo dõi chất lượng vận hành, xử lý chiến dịch và phối hợp nhân sự.",
    responsibilities: [
      "Xem các tình huống vận hành bị escalated",
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
    title: "Operation Staff",
    audienceGroup: "Operations",
    accessScope:
      "Thực hiện kiểm duyệt hằng ngày, hỗ trợ mở lại quảng bá, xuất báo cáo và xử lý nghiệp vụ vận hành.",
    summary:
      "Vai trò nhân sự vận hành trực tiếp, thực hiện các tác vụ hằng ngày do Manager hoặc Admin giao.",
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
    .map((item) => item.trim())
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

const mapApiAudienceGroup = (
  value: string | null | undefined,
): "Marketplace" | "Operations" => {
  return value?.toLowerCase() === "operations" ? "Operations" : "Marketplace";
};

const mapApiRoleToUi = (item: ApiBusinessRoleResponse): RoleManagementItem => ({
  id: item.businessRoleId,
  code: item.businessRoleCode,
  title: item.businessRoleTitle,
  audienceGroup: mapApiAudienceGroup(item.businessRoleAudienceGroup),
  accessScope: item.businessRoleAccessScope ?? "",
  summary: item.businessRoleSummary ?? "",
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
  businessRoleResponsibilities: parseMultilineText(
    formData.responsibilitiesText,
  ),
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
    const existingByCode = new Map(
      existingRoles.map((role) => [role.code, role]),
    );

    await Promise.all(
      defaultRoleCatalog.map(async (defaultRole) => {
        const matched = existingByCode.get(defaultRole.code);

        if (matched) {
          await apiClient.request<ApiBusinessRoleResponse>(
            `/api/admin/business-roles/${matched.id}`,
            {
              method: "PUT",
              includeJsonContentType: true,
              defaultErrorMessage: `Không thể đồng bộ vai trò ${defaultRole.title}.`,
              body: JSON.stringify({
                businessRoleCode: defaultRole.code,
                businessRoleTitle: defaultRole.title,
                businessRoleAudienceGroup: defaultRole.audienceGroup,
                businessRoleAccessScope: defaultRole.accessScope,
                businessRoleSummary: defaultRole.summary,
                businessRoleResponsibilities: defaultRole.responsibilities,
                businessRoleCapabilities: defaultRole.capabilities,
                businessRoleStatus: "active",
              }),
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
            body: JSON.stringify({
              businessRoleCode: defaultRole.code,
              businessRoleTitle: defaultRole.title,
              businessRoleAudienceGroup: defaultRole.audienceGroup,
              businessRoleAccessScope: defaultRole.accessScope,
              businessRoleSummary: defaultRole.summary,
              businessRoleResponsibilities: defaultRole.responsibilities,
              businessRoleCapabilities: defaultRole.capabilities,
              businessRoleStatus: "active",
            }),
          },
        );
      }),
    );

    return this.fetchRoles();
  },
};
