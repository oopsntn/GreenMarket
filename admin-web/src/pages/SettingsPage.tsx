import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { settingsService } from "../services/settingsService";
import type { SettingsState } from "../types/settings";
import "./SettingsPage.css";

const initialSettings: SettingsState = {
  general: {
    platformName: "GreenMarket",
    supportEmail: "support@greenmarket.vn",
    defaultLanguage: "English",
  },
  moderation: {
    autoModeration: true,
    bannedKeywordFilter: true,
    reportLimit: 5,
  },
  postLifecycle: {
    postExpiryDays: 30,
    restoreWindowDays: 7,
    allowAutoExpire: true,
  },
  media: {
    maxImagesPerPost: 10,
    maxFileSizeMb: 5,
    enableImageCompression: true,
  },
};

const validateSettings = (settings: SettingsState) => {
  if (!settings.general.platformName.trim()) {
    throw new Error("Platform name is required.");
  }

  if (!settings.general.supportEmail.trim().includes("@")) {
    throw new Error("Support email must be a valid email address.");
  }

  if (settings.moderation.reportLimit < 1) {
    throw new Error("Max reports before review must be at least 1.");
  }

  if (settings.postLifecycle.postExpiryDays < 1) {
    throw new Error("Post expiry days must be at least 1.");
  }

  if (settings.postLifecycle.restoreWindowDays < 1) {
    throw new Error("Restore window must be at least 1 day.");
  }

  if (
    settings.postLifecycle.restoreWindowDays >
    settings.postLifecycle.postExpiryDays
  ) {
    throw new Error("Restore window cannot be greater than post expiry days.");
  }

  if (settings.media.maxImagesPerPost < 1) {
    throw new Error("Max images per post must be at least 1.");
  }

  if (settings.media.maxFileSizeMb < 1) {
    throw new Error("Max file size must be at least 1 MB.");
  }
};

function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(initialSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setFormError("");
      setSettings(await settingsService.getSettings());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load settings.";
      setFormError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

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

  const handleInputChange = (
    section: keyof SettingsState,
    field: string,
    value: string | number | boolean,
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

  const handleSave = async () => {
    try {
      validateSettings(settings);
      setFormError("");
      setIsSaving(true);

      const updated = await settingsService.updateSettings(settings);
      setSettings(updated);
      showToast("Settings saved successfully.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save settings.";
      setFormError(message);
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsSaving(true);
      const defaultSettings = await settingsService.resetSettings();
      setSettings(defaultSettings);
      setFormError("");
      showToast("Settings were reset to defaults.", "info");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to reset settings.";
      setFormError(message);
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <PageHeader
        title="System Settings"
        description="Configure platform rules, moderation options, and lifecycle settings."
        actionLabel={isSaving ? "Saving..." : "Save Changes"}
        onActionClick={() => void handleSave()}
      />

      <div className="settings-toolbar">
        <button
          type="button"
          className="settings-toolbar__reset"
          onClick={() => void handleReset()}
          disabled={isLoading || isSaving}
        >
          Reset To Defaults
        </button>
      </div>

      {formError ? <div className="settings-error-banner">{formError}</div> : null}

      {isLoading ? <div className="settings-error-banner">Loading settings from admin API...</div> : null}

      <div className="settings-grid">
        <SectionCard
          title="General Settings"
          description="Basic platform configuration"
        >
          <div className="settings-form settings-form--padded">
            <div className="settings-field">
              <label htmlFor="platform-name">Platform Name</label>
              <input
                id="platform-name"
                type="text"
                value={settings.general.platformName}
                onChange={(e) =>
                  handleInputChange("general", "platformName", e.target.value)
                }
              />
            </div>

            <div className="settings-field">
              <label htmlFor="support-email">Support Email</label>
              <input
                id="support-email"
                type="email"
                value={settings.general.supportEmail}
                onChange={(e) =>
                  handleInputChange("general", "supportEmail", e.target.value)
                }
              />
            </div>

            <div className="settings-field">
              <label htmlFor="default-language">Default Language</label>
              <select
                id="default-language"
                value={settings.general.defaultLanguage}
                onChange={(e) =>
                  handleInputChange(
                    "general",
                    "defaultLanguage",
                    e.target.value,
                  )
                }
              >
                <option>English</option>
                <option>Vietnamese</option>
              </select>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Moderation Rules"
          description="Control content moderation behavior"
        >
          <div className="settings-form settings-form--padded">
            <div className="settings-toggle">
              <div>
                <strong>Auto Moderation</strong>
                <span>Automatically flag suspicious posts</span>
              </div>
              <input
                type="checkbox"
                checked={settings.moderation.autoModeration}
                onChange={(e) =>
                  handleInputChange(
                    "moderation",
                    "autoModeration",
                    e.target.checked,
                  )
                }
              />
            </div>

            <div className="settings-toggle">
              <div>
                <strong>Banned Keyword Filter</strong>
                <span>Block content containing prohibited terms</span>
              </div>
              <input
                type="checkbox"
                checked={settings.moderation.bannedKeywordFilter}
                onChange={(e) =>
                  handleInputChange(
                    "moderation",
                    "bannedKeywordFilter",
                    e.target.checked,
                  )
                }
              />
            </div>

            <div className="settings-field">
              <label htmlFor="report-limit">Max Reports Before Review</label>
              <input
                id="report-limit"
                type="number"
                value={settings.moderation.reportLimit}
                onChange={(e) =>
                  handleInputChange(
                    "moderation",
                    "reportLimit",
                    Number(e.target.value),
                  )
                }
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Post Lifecycle Rules"
          description="Manage how long posts remain active"
        >
          <div className="settings-form settings-form--padded">
            <div className="settings-field">
              <label htmlFor="post-expiry">Post Expiry Days</label>
              <input
                id="post-expiry"
                type="number"
                value={settings.postLifecycle.postExpiryDays}
                onChange={(e) =>
                  handleInputChange(
                    "postLifecycle",
                    "postExpiryDays",
                    Number(e.target.value),
                  )
                }
              />
            </div>

            <div className="settings-field">
              <label htmlFor="restore-window">Restore Window (Days)</label>
              <input
                id="restore-window"
                type="number"
                value={settings.postLifecycle.restoreWindowDays}
                onChange={(e) =>
                  handleInputChange(
                    "postLifecycle",
                    "restoreWindowDays",
                    Number(e.target.value),
                  )
                }
              />
            </div>

            <div className="settings-toggle">
              <div>
                <strong>Allow Auto Expire</strong>
                <span>Automatically expire inactive listings</span>
              </div>
              <input
                type="checkbox"
                checked={settings.postLifecycle.allowAutoExpire}
                onChange={(e) =>
                  handleInputChange(
                    "postLifecycle",
                    "allowAutoExpire",
                    e.target.checked,
                  )
                }
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Media Settings"
          description="Control upload and image rules"
        >
          <div className="settings-form settings-form--padded">
            <div className="settings-field">
              <label htmlFor="max-images">Max Images Per Post</label>
              <input
                id="max-images"
                type="number"
                value={settings.media.maxImagesPerPost}
                onChange={(e) =>
                  handleInputChange(
                    "media",
                    "maxImagesPerPost",
                    Number(e.target.value),
                  )
                }
              />
            </div>

            <div className="settings-field">
              <label htmlFor="max-size">Max File Size (MB)</label>
              <input
                id="max-size"
                type="number"
                value={settings.media.maxFileSizeMb}
                onChange={(e) =>
                  handleInputChange(
                    "media",
                    "maxFileSizeMb",
                    Number(e.target.value),
                  )
                }
              />
            </div>

            <div className="settings-toggle">
              <div>
                <strong>Enable Image Compression</strong>
                <span>Compress uploaded media before storage</span>
              </div>
              <input
                type="checkbox"
                checked={settings.media.enableImageCompression}
                onChange={(e) =>
                  handleInputChange(
                    "media",
                    "enableImageCompression",
                    e.target.checked,
                  )
                }
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
