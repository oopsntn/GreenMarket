import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { settingsService } from "../services/settingsService";
import type { SettingsState, SupportedLanguage } from "../types/settings";
import "./SettingsPage.css";

const DEFAULT_SETTINGS: SettingsState = {
  general: {
    platformName: "GreenMarket",
    supportEmail: "support@greenmarket.vn",
    defaultLanguage: "Tiếng Việt",
    otpSandboxEnabled: true,
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
};

const languageOptions: SupportedLanguage[] = ["Tiếng Việt", "Tiếng Anh"];

const normalizeKeywordList = (value: string) => {
  return Array.from(
    new Set(
      value
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
};

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

  if (settings.media.maxImagesPerPost < 1) {
    throw new Error("Số ảnh tối đa mỗi bài phải từ 1 trở lên.");
  }

  if (settings.media.maxFileSizeMb < 1) {
    throw new Error("Dung lượng tệp tối đa phải từ 1 MB trở lên.");
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

  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(savedSettings);
  }, [savedSettings, settings]);

  const showToast = (message: string, tone: ToastItem["tone"] = "success") => {
    const toastId = Date.now() + Math.random();

    setToasts((prev) => [
      ...prev,
      {
        id: toastId,
        message,
        tone,
      },
    ]);

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

      const nextSettings = await settingsService.getSettings();
      setSettings(nextSettings);
      setSavedSettings(nextSettings);
      setKeywordInput(nextSettings.moderation.bannedKeywords.join("\n"));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải thiết lập hệ thống.";
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

      const updated = await settingsService.updateSettings(nextSettings);
      setSettings(updated);
      setSavedSettings(updated);
      setKeywordInput(updated.moderation.bannedKeywords.join("\n"));
      showToast("Đã lưu thiết lập hệ thống thành công.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể lưu thiết lập hệ thống.";
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
      const defaultSettings = await settingsService.resetSettings();
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
        description="Quản lý các quy tắc vận hành, kiểm duyệt, vòng đời bài đăng và giới hạn tải lên cho GreenMarket."
        actionLabel={isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        onActionClick={() => void handleSave()}
      />

      <div className="settings-toolbar">
        <div className="settings-toolbar__status">
          {isDirty ? "Bạn có thay đổi chưa lưu." : "Thiết lập đã đồng bộ với máy chủ."}
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
        <div className="settings-info-banner">
          Đang tải thiết lập từ API quản trị...
        </div>
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
              <label htmlFor="default-language">Ngôn ngữ mặc định</label>
              <select
                id="default-language"
                value={settings.general.defaultLanguage}
                onChange={(event) =>
                  handleInputChange(
                    "general",
                    "defaultLanguage",
                    event.target.value as SupportedLanguage,
                  )
                }
                disabled={isLoading || isSaving}
              >
                {languageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <small>Áp dụng cho nội dung mặc định khi tạo dữ liệu mới.</small>
            </div>

            <div className="settings-toggle">
              <div>
                <strong>Chế độ OTP sandbox</strong>
                <span>Bật khi cần test OTP nội bộ mà không gửi SMS thật ra ngoài.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.general.otpSandboxEnabled}
                onChange={(event) =>
                  handleInputChange(
                    "general",
                    "otpSandboxEnabled",
                    event.target.checked,
                  )
                }
                disabled={isLoading || isSaving}
              />
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
                <span>Tự động gắn cờ nội dung có dấu hiệu vi phạm để admin rà soát.</span>
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
              <small>Mỗi dòng hoặc mỗi dấu phẩy là một từ khóa. Hệ thống sẽ tự loại bỏ giá trị trùng.</small>
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
              <small>Dùng để giới hạn spam và tránh người dùng đăng quá nhiều bài trong 1 giờ.</small>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Media và giới hạn tải lên"
          description="Quản lý số ảnh, dung lượng tệp và tối ưu hóa media khi tải lên."
        >
          <div className="settings-form settings-form--padded">
            <div className="settings-field">
              <label htmlFor="max-images-per-post">Số ảnh tối đa mỗi bài</label>
              <input
                id="max-images-per-post"
                type="number"
                min={1}
                value={settings.media.maxImagesPerPost}
                onChange={(event) =>
                  handleInputChange(
                    "media",
                    "maxImagesPerPost",
                    Number(event.target.value),
                  )
                }
                disabled={isLoading || isSaving}
              />
              <small>Giới hạn số lượng ảnh mà người dùng có thể đính kèm trong một bài đăng.</small>
            </div>

            <div className="settings-field">
              <label htmlFor="max-file-size-mb">Dung lượng tệp tối đa (MB)</label>
              <input
                id="max-file-size-mb"
                type="number"
                min={1}
                value={settings.media.maxFileSizeMb}
                onChange={(event) =>
                  handleInputChange(
                    "media",
                    "maxFileSizeMb",
                    Number(event.target.value),
                  )
                }
                disabled={isLoading || isSaving}
              />
              <small>Áp dụng cho ảnh tải lên từ phía người dùng trên các nền tảng web và mobile.</small>
            </div>

            <div className="settings-toggle">
              <div>
                <strong>Bật nén ảnh</strong>
                <span>Giảm dung lượng ảnh trước khi lưu để tối ưu hiệu năng tải trang.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.media.enableImageCompression}
                onChange={(event) =>
                  handleInputChange(
                    "media",
                    "enableImageCompression",
                    event.target.checked,
                  )
                }
                disabled={isLoading || isSaving}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default SettingsPage;
