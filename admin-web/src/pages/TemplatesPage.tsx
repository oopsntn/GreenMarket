import "./TemplatesPage.css";

type Template = {
  id: number;
  name: string;
  type: "Rejection Reason" | "Report Reason" | "Notification";
  content: string;
  status: "Active" | "Disabled";
  updatedAt: string;
};

const templates: Template[] = [
  {
    id: 1,
    name: "Post Rejection - Invalid Content",
    type: "Rejection Reason",
    content: "Your post violates our marketplace content policy.",
    status: "Active",
    updatedAt: "2026-03-14",
  },
  {
    id: 2,
    name: "Post Rejection - Missing Information",
    type: "Rejection Reason",
    content:
      "Your post is missing required information and cannot be approved.",
    status: "Active",
    updatedAt: "2026-03-13",
  },
  {
    id: 3,
    name: "Report Reason - Spam Content",
    type: "Report Reason",
    content: "This content appears to be spam or misleading.",
    status: "Active",
    updatedAt: "2026-03-12",
  },
  {
    id: 4,
    name: "Notification - Account Locked",
    type: "Notification",
    content: "Your account has been locked due to suspicious activity.",
    status: "Disabled",
    updatedAt: "2026-03-11",
  },
];

function TemplatesPage() {
  return (
    <div className="templates-page">
      <div className="templates-page__header">
        <div>
          <h2>Template Management</h2>
          <p>
            Manage rejection reasons, report templates, and notification
            content.
          </p>
        </div>

        <button className="templates-page__add-btn" type="button">
          + Add Template
        </button>
      </div>

      <div className="templates-toolbar">
        <input
          className="templates-toolbar__search"
          type="text"
          placeholder="Search by template name or type"
        />

        <button className="templates-toolbar__filter-btn" type="button">
          Filter
        </button>
      </div>

      <div className="templates-table-wrapper">
        <table className="templates-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Template Name</th>
              <th>Type</th>
              <th>Content Preview</th>
              <th>Status</th>
              <th>Updated Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {templates.map((template) => (
              <tr key={template.id}>
                <td>#{template.id}</td>
                <td>{template.name}</td>
                <td>
                  <span className="templates-badge templates-badge--type">
                    {template.type}
                  </span>
                </td>
                <td className="templates-content-preview">
                  {template.content}
                </td>
                <td>
                  <span
                    className={
                      template.status === "Active"
                        ? "templates-badge templates-badge--active"
                        : "templates-badge templates-badge--disabled"
                    }
                  >
                    {template.status}
                  </span>
                </td>
                <td>{template.updatedAt}</td>
                <td>
                  <div className="templates-actions">
                    <button type="button" className="templates-actions__view">
                      View
                    </button>

                    <button type="button" className="templates-actions__edit">
                      Edit
                    </button>

                    {template.status === "Active" ? (
                      <button
                        type="button"
                        className="templates-actions__disable"
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="templates-actions__enable"
                      >
                        Enable
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TemplatesPage;
