import "./SettingsPage.css";

function SettingsPage() {
  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <div>
          <h2>System Settings</h2>
          <p>
            Configure platform rules, moderation options, and lifecycle
            settings.
          </p>
        </div>

        <button className="settings-page__save-btn" type="button">
          Save Changes
        </button>
      </div>

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
                defaultValue="GreenMarket"
              />
            </div>

            <div className="settings-field">
              <label htmlFor="support-email">Support Email</label>
              <input
                id="support-email"
                type="email"
                defaultValue="support@greenmarket.vn"
              />
            </div>

            <div className="settings-field">
              <label htmlFor="default-language">Default Language</label>
              <select id="default-language" defaultValue="English">
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
              <input type="checkbox" defaultChecked />
            </div>

            <div className="settings-toggle">
              <div>
                <strong>Banned Keyword Filter</strong>
                <span>Block content containing prohibited terms</span>
              </div>
              <input type="checkbox" defaultChecked />
            </div>

            <div className="settings-field">
              <label htmlFor="report-limit">Max Reports Before Review</label>
              <input id="report-limit" type="number" defaultValue={5} />
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
              <input id="post-expiry" type="number" defaultValue={30} />
            </div>

            <div className="settings-field">
              <label htmlFor="restore-window">Restore Window (Days)</label>
              <input id="restore-window" type="number" defaultValue={7} />
            </div>

            <div className="settings-toggle">
              <div>
                <strong>Allow Auto Expire</strong>
                <span>Automatically expire inactive listings</span>
              </div>
              <input type="checkbox" defaultChecked />
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
              <input id="max-images" type="number" defaultValue={10} />
            </div>

            <div className="settings-field">
              <label htmlFor="max-size">Max File Size (MB)</label>
              <input id="max-size" type="number" defaultValue={5} />
            </div>

            <div className="settings-toggle">
              <div>
                <strong>Enable Image Compression</strong>
                <span>Compress uploaded media before storage</span>
              </div>
              <input type="checkbox" defaultChecked />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsPage;
