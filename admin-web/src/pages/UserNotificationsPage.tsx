import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import ToastContainer, {
  type ToastItem,
} from "../components/ToastContainer";
import { adminNotificationService } from "../services/adminNotificationService";
import { templateService } from "../services/templateService";
import { userService } from "../services/userService";
import type {
  AdminNotificationFormState,
  AdminNotificationHistoryItem,
  AdminNotificationRecipientOption,
  AdminNotificationScope,
  AdminNotificationType,
} from "../types/adminNotification";
import {
  adminNotificationScopeLabels,
  adminNotificationTypeLabels,
  buildNotificationPreviewTitle,
  buildRecipientOptionFromUser,
  emptyAdminNotificationForm,
} from "../types/adminNotification";
import type { Template } from "../types/template";
import "./UserNotificationsPage.css";

const HISTORY_PAGE_SIZE = 6;

const createToastId = () => Date.now() + Math.floor(Math.random() * 1000);

function UserNotificationsPage() {
  const [formState, setFormState] = useState<AdminNotificationFormState>(
    emptyAdminNotificationForm,
  );
  const [templates, setTemplates] = useState<Template[]>([]);
  const [recipientOptions, setRecipientOptions] = useState<
    AdminNotificationRecipientOption[]
  >([]);
  const [history, setHistory] = useState<AdminNotificationHistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const selectedTemplate = useMemo(
    () =>
      templates.find(
        (template) => String(template.id) === formState.templateId,
      ) ?? null,
    [formState.templateId, templates],
  );

  const selectedRecipient = useMemo(
    () =>
      recipientOptions.find(
        (recipient) => String(recipient.id) === formState.recipientId,
      ) ?? null,
    [formState.recipientId, recipientOptions],
  );

  const previewTitle = buildNotificationPreviewTitle(
    selectedTemplate,
    formState.title,
  );
  const previewMessage =
    formState.message.trim() || selectedTemplate?.content || "Chưa có nội dung.";

  const totalHistoryPages = Math.max(
    1,
    Math.ceil(history.length / HISTORY_PAGE_SIZE),
  );

  const paginatedHistory = useMemo(() => {
    const startIndex = (historyPage - 1) * HISTORY_PAGE_SIZE;
    return history.slice(startIndex, startIndex + HISTORY_PAGE_SIZE);
  }, [history, historyPage]);

  const pushToast = (message: string, tone: ToastItem["tone"] = "success") => {
    const id = createToastId();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  };

  const handleToastClose = (id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const loadPageData = async () => {
    try {
      setIsLoading(true);
      setPageError("");

      const [users, templateResponse, historyResponse] = await Promise.all([
        userService.fetchUsers(),
        templateService.getTemplates({
          type: "Notification",
          status: "Active",
          page: 1,
          pageSize: 50,
        }),
        adminNotificationService.getHistory(),
      ]);

      setRecipientOptions(
        users
          .filter((user) => user.status === "Active")
          .map(buildRecipientOptionFromUser)
          .sort((left, right) => left.label.localeCompare(right.label, "vi")),
      );
      setTemplates(templateResponse.data);
      setHistory(historyResponse);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu thông báo người dùng.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPageData();
  }, []);

  useEffect(() => {
    setHistoryPage((current) => Math.min(current, totalHistoryPages));
  }, [totalHistoryPages]);

  const handleScopeChange = (scope: AdminNotificationScope) => {
    setFormError("");
    setFormState((current) => ({
      ...current,
      scope,
      recipientId: scope === "single" ? current.recipientId : "",
    }));
  };

  const handleTypeChange = (type: AdminNotificationType) => {
    setFormState((current) => ({
      ...current,
      type,
    }));
  };

  const handleFieldChange = (
    field: keyof AdminNotificationFormState,
    value: string,
  ) => {
    setFormError("");
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleTemplateChange = (templateId: string) => {
    const template =
      templates.find((item) => String(item.id) === templateId) ?? null;

    setFormError("");
    setFormState((current) => ({
      ...current,
      templateId,
      title: current.title.trim() ? current.title : template?.name ?? "",
      message: current.message.trim() ? current.message : template?.content ?? "",
    }));
  };

  const resetForm = () => {
    setFormError("");
    setFormState(emptyAdminNotificationForm);
  };

  const validateForm = () => {
    if (formState.scope === "single" && !formState.recipientId) {
      return "Vui lòng chọn người nhận cụ thể.";
    }

    if (!formState.title.trim()) {
      return "Tiêu đề thông báo là bắt buộc.";
    }

    if (!formState.message.trim()) {
      return "Nội dung thông báo là bắt buộc.";
    }

    return "";
  };

  const handleSubmit = async () => {
    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setIsSending(true);
      setFormError("");

      await adminNotificationService.sendNotification({
        scope: formState.scope,
        recipientId:
          formState.scope === "single"
            ? Number(formState.recipientId)
            : undefined,
        templateId: formState.templateId
          ? Number(formState.templateId)
          : undefined,
        title: formState.title.trim(),
        message: formState.message.trim(),
        type: formState.type,
      });

      await loadPageData();
      resetForm();
      pushToast("Đã gửi thông báo thành công.", "success");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Không thể gửi thông báo cho người dùng.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const statCards = [
    {
      title: "Tổng người nhận khả dụng",
      value: recipientOptions.length,
      description: "Các tài khoản đang hoạt động và có thể nhận thông báo ngay.",
    },
    {
      title: "Mẫu thông báo đang dùng",
      value: templates.length,
      description: "Chỉ lấy các mẫu loại Thông báo đang bật trong thư viện mẫu.",
    },
    {
      title: "Lịch sử gửi gần đây",
      value: history.length,
      description: "20 lượt gửi thủ công gần nhất của admin được lưu để đối soát.",
    },
  ];

  return (
    <div className="user-notifications-page">
      <ToastContainer toasts={toasts} onClose={handleToastClose} />

      <PageHeader
        title="Thông báo người dùng"
        description="Gửi thông báo thủ công cho một người hoặc toàn bộ người dùng đang hoạt động, đồng thời tận dụng mẫu nội dung để chuẩn hóa câu chữ."
      />

      <div className="user-notifications-page__stats">
        {statCards.map((card) => (
          <article
            key={card.title}
            className="user-notifications-page__stat-card"
          >
            <h3>{card.title}</h3>
            <span className="user-notifications-page__stat-value">
              {card.value}
            </span>
            <p>{card.description}</p>
          </article>
        ))}
      </div>

      {pageError ? (
        <p className="user-notifications-page__message user-notifications-page__message--error">
          {pageError}
        </p>
      ) : null}

      <div className="user-notifications-page__layout">
        <SectionCard
          title="Gửi thông báo thủ công"
          description="Chọn phạm vi gửi, mẫu nội dung và tinh chỉnh thông điệp trước khi đẩy sang trung tâm thông báo của user web."
        >
          <div className="user-notifications-page__form">
            <div className="user-notifications-page__field">
              <label>Phạm vi gửi</label>
              <small>
                Chọn gửi cho một người dùng cụ thể hoặc phát thông báo cho toàn
                bộ tài khoản đang hoạt động.
              </small>
              <div className="user-notifications-page__scope-list">
                {(Object.keys(adminNotificationScopeLabels) as AdminNotificationScope[]).map(
                  (scope) => (
                    <button
                      key={scope}
                      type="button"
                      className={`user-notifications-page__scope-button${
                        formState.scope === scope
                          ? " user-notifications-page__scope-button--active"
                          : ""
                      }`}
                      onClick={() => handleScopeChange(scope)}
                    >
                      {adminNotificationScopeLabels[scope]}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="user-notifications-page__fields">
              {formState.scope === "single" ? (
                <div className="user-notifications-page__field user-notifications-page__field--full">
                  <label htmlFor="notification-recipient">Người nhận</label>
                  <small>
                    Chỉ hiện người dùng đang hoạt động để tránh gửi nhầm vào tài
                    khoản đã khóa.
                  </small>
                  <select
                    id="notification-recipient"
                    className="user-notifications-page__select"
                    value={formState.recipientId}
                    onChange={(event) =>
                      handleFieldChange("recipientId", event.target.value)
                    }
                  >
                    <option value="">Chọn một người dùng</option>
                    {recipientOptions.map((recipient) => (
                      <option key={recipient.id} value={recipient.id}>
                        {recipient.label} - {recipient.sublabel}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="user-notifications-page__field user-notifications-page__field--full">
                  <div className="user-notifications-page__broadcast-note">
                    <h4>Thông báo sẽ gửi đến toàn bộ người dùng</h4>
                    <p>
                      Hệ thống sẽ phát thông báo tới tất cả tài khoản đang hoạt
                      động. Hãy kiểm tra kỹ tiêu đề và nội dung trước khi xác
                      nhận để tránh broadcast nhầm.
                    </p>
                  </div>
                </div>
              )}

              <div className="user-notifications-page__field user-notifications-page__field--full">
                <label htmlFor="notification-template">Chọn mẫu nội dung</label>
                <small>
                  Chỉ hiển thị các mẫu loại Thông báo đang hoạt động trong màn
                  Mẫu nội dung.
                </small>
                <select
                  id="notification-template"
                  className="user-notifications-page__select"
                  value={formState.templateId}
                  onChange={(event) => handleTemplateChange(event.target.value)}
                >
                  <option value="">Chọn mẫu để điền nhanh tiêu đề và nội dung</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTemplate ? (
                <div className="user-notifications-page__field user-notifications-page__field--full">
                  <div className="user-notifications-page__template-preview">
                    <h4>{selectedTemplate.name}</h4>
                    <div className="user-notifications-page__template-meta">
                      <span className="user-notifications-page__pill">
                        {selectedTemplate.type}
                      </span>
                      <span className="user-notifications-page__pill">
                        {selectedTemplate.status === "Active"
                          ? "Đang hoạt động"
                          : "Đã tắt"}
                      </span>
                    </div>
                    <p>{selectedTemplate.previewText}</p>
                    <p>{selectedTemplate.usageNote}</p>
                  </div>
                </div>
              ) : null}

              <div className="user-notifications-page__field user-notifications-page__field--full">
                <label>Loại thông báo</label>
                <small>
                  Loại thông báo quyết định màu sắc và mức độ ưu tiên khi hiển
                  thị ở chuông thông báo của user web.
                </small>
                <div className="user-notifications-page__type-list">
                  {(Object.keys(adminNotificationTypeLabels) as AdminNotificationType[]).map(
                    (type) => (
                      <button
                        key={type}
                        type="button"
                        className={`user-notifications-page__type-button${
                          formState.type === type
                            ? " user-notifications-page__type-button--active"
                            : ""
                        }`}
                        onClick={() => handleTypeChange(type)}
                      >
                        {adminNotificationTypeLabels[type]}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="user-notifications-page__field user-notifications-page__field--full">
                <label htmlFor="notification-title">Tiêu đề</label>
                <input
                  id="notification-title"
                  className="user-notifications-page__input"
                  type="text"
                  value={formState.title}
                  placeholder="Ví dụ: Cập nhật trạng thái bài đăng của bạn"
                  onChange={(event) =>
                    handleFieldChange("title", event.target.value)
                  }
                />
              </div>

              <div className="user-notifications-page__field user-notifications-page__field--full">
                <label htmlFor="notification-message">Nội dung</label>
                <textarea
                  id="notification-message"
                  className="user-notifications-page__textarea"
                  value={formState.message}
                  placeholder="Nhập thông điệp sẽ gửi tới user. Có thể chọn mẫu trước rồi chỉnh tay cho phù hợp."
                  onChange={(event) =>
                    handleFieldChange("message", event.target.value)
                  }
                />
              </div>
            </div>

            {formError ? (
              <p className="user-notifications-page__message user-notifications-page__message--error">
                {formError}
              </p>
            ) : null}

            <div className="user-notifications-page__actions">
              <button
                type="button"
                className="user-notifications-page__button"
                onClick={resetForm}
                disabled={isSending}
              >
                Làm lại
              </button>
              <button
                type="button"
                className="user-notifications-page__button user-notifications-page__button--primary"
                onClick={handleSubmit}
                disabled={isSending || isLoading}
              >
                {isSending ? "Đang gửi..." : "Gửi thông báo"}
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Xem trước thông báo"
          description="Kiểm tra nhanh phạm vi gửi, loại thông báo và nội dung cuối cùng trước khi phát đi."
        >
          <div className="user-notifications-page__preview">
            <div className="user-notifications-page__preview-card">
              <h4>{previewTitle}</h4>
              <div className="user-notifications-page__preview-meta">
                <span className="user-notifications-page__pill">
                  {adminNotificationTypeLabels[formState.type]}
                </span>
                <span className="user-notifications-page__pill">
                  {formState.scope === "single"
                    ? selectedRecipient?.label || "Chưa chọn người nhận"
                    : "Toàn bộ người dùng"}
                </span>
                <span className="user-notifications-page__pill">
                  {selectedTemplate?.name || "Không dùng mẫu"}
                </span>
              </div>
              <div className="user-notifications-page__preview-message">
                {previewMessage}
              </div>
            </div>

            <div className="user-notifications-page__broadcast-note">
              <h4>Gợi ý vận hành</h4>
              <p>
                Nên dùng phạm vi <strong>Một người dùng</strong> cho phản hồi cá
                nhân, nhắc bổ sung hồ sơ hoặc giải thích thay đổi trạng thái.
                Chỉ dùng broadcast khi thật sự cần thông báo hệ thống diện rộng.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Lịch sử gửi gần đây"
        description="Theo dõi các thông báo thủ công gần nhất để đối chiếu người nhận, mẫu đã dùng và nội dung đã phát."
      >
        <div className="user-notifications-page__history">
          {isLoading ? (
            <p>Đang tải lịch sử thông báo...</p>
          ) : history.length === 0 ? (
            <EmptyState
              title="Chưa có lượt gửi thủ công"
              description="Khi admin gửi thông báo đầu tiên, lịch sử sẽ hiển thị ở đây để tiện kiểm tra và audit."
            />
          ) : (
            <>
              <div className="user-notifications-page__history-list">
                {paginatedHistory.map((item) => (
                  <article
                    key={item.id}
                    className="user-notifications-page__history-item"
                  >
                    <div className="user-notifications-page__history-header">
                      <div>
                        <h4>{item.title}</h4>
                        <p>
                          Gửi lúc {item.sentAt} • {item.performedBy}
                        </p>
                      </div>
                      <span className="user-notifications-page__pill">
                        {adminNotificationTypeLabels[item.type]}
                      </span>
                    </div>

                    <div className="user-notifications-page__history-message">
                      {item.message}
                    </div>

                    <div className="user-notifications-page__history-meta">
                      <div className="user-notifications-page__history-meta-item">
                        <span>Phạm vi gửi</span>
                        <span>{adminNotificationScopeLabels[item.scope]}</span>
                      </div>
                      <div className="user-notifications-page__history-meta-item">
                        <span>Người nhận</span>
                        <span>
                          {item.recipientName}
                          {item.scope === "all_users"
                            ? ` (${item.recipientCount} tài khoản)`
                            : ""}
                        </span>
                      </div>
                      <div className="user-notifications-page__history-meta-item">
                        <span>Mẫu đã dùng</span>
                        <span>
                          {item.template?.templateName || "Không dùng mẫu"}
                        </span>
                      </div>
                      <div className="user-notifications-page__history-meta-item">
                        <span>Loại mẫu</span>
                        <span>{item.template?.templateType || "--"}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {totalHistoryPages > 1 ? (
                <div className="user-notifications-page__history-pagination">
                  <button
                    type="button"
                    className="user-notifications-page__button"
                    onClick={() =>
                      setHistoryPage((current) => Math.max(1, current - 1))
                    }
                    disabled={historyPage === 1}
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    className="user-notifications-page__button"
                    onClick={() =>
                      setHistoryPage((current) =>
                        Math.min(totalHistoryPages, current + 1),
                      )
                    }
                    disabled={historyPage === totalHistoryPages}
                  >
                    Sau
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

export default UserNotificationsPage;
