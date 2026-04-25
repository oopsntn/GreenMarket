import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { settingsService } from "../services/settingsService";
import type { SettingsState } from "../types/settings";
import "./SettingsPage.css";

const DEFAULT_SETTINGS: SettingsState = {
  general: {
    platformName: "GreenMarket",
    supportEmail: "support@greenmarket.vn",
    defaultLanguage: "Tiếng Việt",
  },
  moderation: {
    autoModeration: true,
    bannedKeywordFilter: true,
    bannedKeywords: ["lừa đảo", "spam", "vi phạm", "cấm"],
    reportLimit: 5,
  },
  postLifecycle: {
    postExpiryDays: 30,
    restoreWindowDays: 7,
    allowAutoExpire: true,
    postRateLimitPerHour: 10,
  },
  media: {
    maxImagesPerPost: 10,
    maxFileSizeMb: 5,
    enableImageCompression: true,
  },
  hostIncome: {
    articlePayoutAmount: 300000,
    viewBonusThreshold: 1000,
    viewBonusAmount: 120000,
  },
};

const normalizeSettings = (payload: Partial<SettingsState> | undefined): SettingsState => ({
  general: {
    ...DEFAULT_SETTINGS.general,
    ...(payload?.general ?? {}),
  },
  moderation: {
    ...DEFAULT_SETTINGS.moderation,
    ...(payload?.moderation ?? {}),
    bannedKeywords: Array.isArray(payload?.moderation?.bannedKeywords)
      ? payload.moderation.bannedKeywords
      : DEFAULT_SETTINGS.moderation.bannedKeywords,
  },
  postLifecycle: {
    ...DEFAULT_SETTINGS.postLifecycle,
    ...(payload?.postLifecycle ?? {}),
  },
  media: {
    ...DEFAULT_SETTINGS.media,
    ...(payload?.media ?? {}),
  },
  hostIncome: {
    ...DEFAULT_SETTINGS.hostIncome,
    ...(payload?.hostIncome ?? {}),
  },
});

const normalizeKeywordList = (value: string) =>
  Array.from(
    new Set(
      value
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

const validateSettings = (settings: SettingsState) => {
  if (!settings.general.platformName.trim()) {
    throw new Error("Tên nền tảng là bắt buộc.");
  }

  if (!settings.general.supportEmail.trim().includes("@")) {
    throw new Error("Email hỗ trợ phải đúng định dạng.");
  }

  if (settings.moderation.reportLimit < 1) {
    throw new Error("Số báo cáo tối đa trước khi kiểm tra thủ công phải từ 1 trở lên.");
  }

  if (settings.postLifecycle.postExpiryDays < 1) {
    throw new Error("Số ngày bài đăng tự hết hạn phải từ 1 trở lên.");
  }

  if (settings.postLifecycle.restoreWindowDays < 1) {
    throw new Error("Số ngày cho phép khôi phục từ thùng rác phải từ 1 trở lên.");
  }

  if (
    settings.postLifecycle.restoreWindowDays >
    settings.postLifecycle.postExpiryDays
  ) {
    throw new Error(
      "Số ngày khôi phục không được lớn hơn số ngày bài đăng tự hết hạn.",
    );
  }

  if (settings.postLifecycle.postRateLimitPerHour < 1) {
    throw new Error("Giới hạn số bài đăng mỗi giờ phải từ 1 trở lên.");
  }

  if (settings.hostIncome.articlePayoutAmount < 0) {
    throw new Error("Nhuận bút cố định mỗi bài không được âm.");
  }

  if (settings.hostIncome.viewBonusThreshold < 1) {
    throw new Error("Mốc lượt xem để nhận thưởng phải từ 1 trở lên.");
  }

  if (settings.hostIncome.viewBonusAmount < 0) {
    throw new Error("Tiền thưởng lượt xem không được âm.");
  }

};

function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [keywordInput, setKeywordInput] = useState(
    DEFAULT_SETTINGS.moderation.bannedKeywords.join("\n"),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const isDirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSettings),
    [savedSettings, settings],
  );

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

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setFormError("");

      const nextSettings = normalizeSettings(await settingsService.getSettings());
      setSettings(nextSettings);
      setSavedSettings(nextSettings);
      setKeywordInput(nextSettings.moderation.bannedKeywords.join("\n"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tải thiết lập hệ thống.";
      setFormError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleInputChange = (
    section: keyof SettingsState,
    field: string,
    value: string | number | boolean | string[],
  ) => {
    if (formError) {
      setFormError("");
    }

    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleKeywordChange = (value: string) => {
    setKeywordInput(value);
    handleInputChange("moderation", "bannedKeywords", normalizeKeywordList(value));
  };

  const handleSave = async () => {
    try {
      const nextSettings = {
        ...settings,
        moderation: {
          ...settings.moderation,
          bannedKeywords: normalizeKeywordList(keywordInput),
        },
      };

      validateSettings(nextSettings);
      setFormError("");
      setIsSaving(true);

      const updated = normalizeSettings(
        await settingsService.updateSettings(nextSettings),
      );
      setSettings(updated);
      setSavedSettings(updated);
      setKeywordInput(updated.moderation.bannedKeywords.join("\n"));
      showToast("Đã lưu thiết lập hệ thống thành công.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể lưu thiết lập hệ thống.";
      setFormError(message);
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn khôi phục toàn bộ thiết lập về mặc định không?",
    );

    if (!confirmed) return;

    try {
      setIsSaving(true);
      const defaultSettings = normalizeSettings(await settingsService.resetSettings());
      setSettings(defaultSettings);
      setSavedSettings(defaultSettings);
      setKeywordInput(defaultSettings.moderation.bannedKeywords.join("\n"));
      setFormError("");
      showToast("Đã khôi phục thiết lập mặc định.", "info");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể khôi phục thiết lập mặc định.";
      setFormError(message);
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <PageHeader
        title="Thiết lập hệ thống"
        description="Quản lý các quy tắc vận hành, kiểm duyệt, vòng đời bài đăng và cấu hình chi trả cố định cho Host trên GreenMarket."
        actionLabel={isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        onActionClick={() => void handleSave()}
      />

      <div className="settings-toolbar">
        <div className="settings-toolbar__status">
          {isDirty
            ? "Bạn có thay đổi chưa lưu."
            : "Thiết lập đã đồng bộ với máy chủ."}
        </div>

        <button
          type="button"
          className="settings-toolbar__reset"
          onClick={() => void handleReset()}
          disabled={isLoading || isSaving}
        >
          Khôi phục mặc định
        </button>
      </div>

      {formError ? <div className="settings-error-banner">{formError}</div> : null}

      {isLoading ? (
        <div className="settings-info-banner">Đang tải thiết lập từ API quản trị...</div>
      ) : null}

      <div className="settings-stack">
        <SectionCard
          title="Thiết lập chung"
          description="Cấu hình nền tảng và các tùy chọn dùng chung cho toàn hệ thống."
        >
          <div className="settings-form settings-form--padded">
            <div className="settings-field">
              <label htmlFor="platform-name">Tên nền tảng</label>
              <input
                id="platform-name"
                type="text"
                value={settings.general.platformName}
                onChange={(event) =>
                  handleInputChange("general", "platformName", event.target.value)
                }
                disabled={isLoading || isSaving}
              />
              <small>Hiển thị ở trang đăng nhập, tiêu đề và email hệ thống.</small>
            </div>

            <div className="settings-field">
              <label htmlFor="support-email">Email hỗ trợ</label>
              <input
                id="support-email"
                type="email"
                value={settings.general.supportEmail}
                onChange={(event) =>
                  handleInputChange("general", "supportEmail", event.target.value)
                }
                disabled={isLoading || isSaving}
              />
              <small>Dùng để liên hệ hỗ trợ và gửi thông báo vận hành.</small>
            </div>

            <div className="settings-field">
              <label htmlFor="default-language">Ngôn ngữ hiển thị</label>
              <input
                id="default-language"
                type="text"
                value="Tiếng Việt"
                readOnly
                disabled
              />
              <small>Admin web hiện chỉ hỗ trợ tiếng Việt.</small>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Thu nhập Host"
          description="Chốt mức tiền cố định cho mỗi bài Host được admin duyệt và khoản thưởng cố định khi bài đạt mốc lượt xem."
        >
          <div className="settings-form settings-form--padded">
            <div className="settings-field">
              <label htmlFor="host-article-payout">Nhuận bút cố định mỗi bài (VND)</label>
              <input
                id="host-article-payout"
                type="number"
                min={0}
                value={settings.hostIncome.articlePayoutAmount}
                onChange={(event) =>
                  handleInputChange(
                    "hostIncome",
                    "articlePayoutAmount",
                    Number(event.target.value),
                  )
                }
                disabled={isLoading || isSaving}
              />
              <small>
                Khi bài Host được admin duyệt và xuất bản, hệ thống sẽ ghi nhận đúng khoản
                tiền cố định này.
              </small>
            </div>

            <div className="settings-field">
              <label htmlFor="host-view-threshold">Mốc lượt xem nhận thưởng</label>
              <input
                id="host-view-threshold"
                type="number"
                min={1}
                value={settings.hostIncome.viewBonusThreshold}
                onChange={(event) =>
                  handleInputChange(
                    "hostIncome",
                    "viewBonusThreshold",
                    Number(event.target.value),
                  )
                }
                disabled={isLoading || isSaving}
              />
              <small>
                Khi bài đạt mốc lượt xem này, hệ thống sẽ cộng thêm một khoản thưởng cố định.
              </small>
            </div>

            <div className="settings-field">
              <label htmlFor="host-view-bonus">Thưởng cố định khi đạt mốc view (VND)</label>
              <input
                id="host-view-bonus"
                type="number"
                min={0}
                value={settings.hostIncome.viewBonusAmount}
                onChange={(event) =>
                  handleInputChange(
                    "hostIncome",
                    "viewBonusAmount",
                    Number(event.target.value),
                  )
                }
                disabled={isLoading || isSaving}
              />
              <small>
                Mỗi bài chỉ được cộng khoản thưởng này một lần khi chạm mốc đã cấu hình.
              </small>
            </div>

          </div>
        </SectionCard>

        <SectionCard
          title="Quy tắc kiểm duyệt"
          description="Quản lý các tiêu chí lọc nội dung và ngưỡng cần kiểm tra thủ công."
        >
          <div className="settings-form settings-form--padded">
            <div className="settings-toggle">
              <div>
                <strong>Tự động kiểm duyệt cơ bản</strong>
                <span>
                  Tự động gắn cờ nội dung có dấu hiệu vi phạm để admin rà soát.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.moderation.autoModeration}
                onChange={(event) =>
                  handleInputChange(
                    "moderation",
                    "autoModeration",
                    event.target.checked,
                  )
                }
                disabled={isLoading || isSaving}
              />
            </div>

            <div className="settings-toggle">
              <div>
                <strong>Lọc từ khóa cấm</strong>
                <span>Kiểm tra tiêu đề và nội dung bài đăng theo danh sách từ khóa cấm.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.moderation.bannedKeywordFilter}
                onChange={(event) =>
                  handleInputChange(
                    "moderation",
                    "bannedKeywordFilter",
                    event.target.checked,
                  )
                }
                disabled={isLoading || isSaving}
              />
            </div>

            <div className="settings-field">
              <label htmlFor="banned-keywords">Danh sách từ khóa cấm</label>
              <textarea
                id="banned-keywords"
                rows={5}
                value={keywordInput}
                onChange={(event) => handleKeywordChange(event.target.value)}
                disabled={isLoading || isSaving}
                placeholder="Mỗi dòng một từ khóa. Ví dụ: lừa đảo, spam, cấm"
              />
              <small>
                Mỗi dòng hoặc mỗi dấu phẩy là một từ khóa. Hệ thống sẽ tự loại bỏ giá
                trị trùng.
              </small>
            </div>

            <div className="settings-field">
              <label htmlFor="report-limit">
                Số báo cáo tối đa trước khi kiểm tra thủ công
              </label>
              <input
                id="report-limit"
                type="number"
                min={1}
                value={settings.moderation.reportLimit}
                onChange={(event) =>
                  handleInputChange(
                    "moderation",
                    "reportLimit",
                    Number(event.target.value),
                  )
                }
                disabled={isLoading || isSaving}
              />
              <small>Khi vượt ngưỡng này, nội dung sẽ cần admin xem xét trực tiếp.</small>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Vòng đời bài đăng"
          description="Thiết lập thời gian tồn tại, khôi phục và nhịp đăng bài của người dùng."
        >
          <div className="settings-form settings-form--padded">
            <div className="settings-field">
              <label htmlFor="post-expiry-days">Số ngày bài đăng tự hết hạn</label>
              <input
                id="post-expiry-days"
                type="number"
                min={1}
                value={settings.postLifecycle.postExpiryDays}
                onChange={(event) =>
                  handleInputChange(
                    "postLifecycle",
                    "postExpiryDays",
                    Number(event.target.value),
                  )
                }
                disabled={isLoading || isSaving}
              />
              <small>Bài đăng quá thời gian này sẽ được chuyển về trạng thái hết hạn.</small>
            </div>

            <div className="settings-field">
              <label htmlFor="restore-window-days">
                Số ngày cho phép khôi phục từ thùng rác
              </label>
              <input
                id="restore-window-days"
                type="number"
                min={1}
                value={settings.postLifecycle.restoreWindowDays}
                onChange={(event) =>
                  handleInputChange(
                    "postLifecycle",
                    "restoreWindowDays",
                    Number(event.target.value),
                  )
                }
                disabled={isLoading || isSaving}
              />
              <small>Trong khoảng thời gian này, bài đăng đã xóa vẫn có thể khôi phục.</small>
            </div>

            <div className="settings-toggle">
              <div>
                <strong>Áp dụng tự động hết hạn</strong>
                <span>Bật để hệ thống tự xử lý bài đăng quá hạn theo cấu hình bên trên.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.postLifecycle.allowAutoExpire}
                onChange={(event) =>
                  handleInputChange(
                    "postLifecycle",
                    "allowAutoExpire",
                    event.target.checked,
                  )
                }
                disabled={isLoading || isSaving}
              />
            </div>

            <div className="settings-field">
              <label htmlFor="post-rate-limit">Giới hạn số bài đăng mỗi giờ</label>
              <input
                id="post-rate-limit"
                type="number"
                min={1}
                value={settings.postLifecycle.postRateLimitPerHour}
                onChange={(event) =>
                  handleInputChange(
                    "postLifecycle",
                    "postRateLimitPerHour",
                    Number(event.target.value),
                  )
                }
                disabled={isLoading || isSaving}
              />
              <small>
                Dùng để giới hạn spam và tránh người dùng đăng quá nhiều bài trong 1
                giờ.
              </small>
            </div>
          </div>
        </SectionCard>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default SettingsPage;
