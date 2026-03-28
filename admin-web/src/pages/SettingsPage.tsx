import { useState } from "react";
import PageHeader from "../components/PageHeader";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { settingsService } from "../services/settingsService";
import type { SettingsState } from "../types/settings";
import "./SettingsPage.css";

function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(
    settingsService.getSettings(),
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    const updated = settingsService.updateSettings(settings);
    setSettings(updated);
    showToast("Settings saved successfully.");
  };

  return (
    <div className="settings-page">
      <PageHeader
        title="System Settings"
        description="Configure platform rules, moderation options, and lifecycle settings."
        actionLabel="Save Changes"
        onActionClick={handleSave}
      />

      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-card__header">
            <h3>General Settings</h3>
            <p>Basic platform configuration</p>
          </div>

          <div className="settings-form">
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
        </section>

        <section className="settings-card">
          <div className="settings-card__header">
            <h3>Moderation Rules</h3>
            <p>Control content moderation behavior</p>
          </div>

          <div className="settings-form">
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
        </section>

        <section className="settings-card">
          <div className="settings-card__header">
            <h3>Post Lifecycle Rules</h3>
            <p>Manage how long posts remain active</p>
          </div>

          <div className="settings-form">
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
        </section>

        <section className="settings-card">
          <div className="settings-card__header">
            <h3>Media Settings</h3>
            <p>Control upload and image rules</p>
          </div>

          <div className="settings-form">
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
        </section>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default SettingsPage;
