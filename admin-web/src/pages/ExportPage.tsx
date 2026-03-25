import { useState } from "react";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { exportService } from "../services/exportService";
import "./ExportPage.css";

function ExportPage() {
  const historyItems = exportService.getExportHistory();
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

  const handleExportGeneralData = () => {
    showToast("General data export started successfully.");
  };

  const handleExportFinancialReport = () => {
    showToast("Financial report export started successfully.");
  };

  return (
    <div className="export-page">
      <PageHeader
        title="Export CSV"
        description="Export operational and financial reports for GreenMarket admin."
      />

      <div className="export-grid">
        <section className="export-card">
          <div className="export-card__header">
            <h3>General Data Export</h3>
            <p>Export operational records from the admin system.</p>
          </div>

          <div className="export-form">
            <div className="export-field">
              <label htmlFor="general-module">Module</label>
              <select id="general-module" defaultValue="Users">
                <option>Users</option>
                <option>Categories</option>
                <option>Attributes</option>
                <option>Templates</option>
                <option>Promotions</option>
                <option>Analytics</option>
              </select>
            </div>

            <div className="export-field">
              <label htmlFor="general-date-range">Date Range</label>
              <select id="general-date-range" defaultValue="Last 30 Days">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>This Year</option>
              </select>
            </div>

            <div className="export-field">
              <label htmlFor="general-format">File Format</label>
              <select id="general-format" defaultValue="CSV">
                <option>CSV</option>
                <option>XLSX</option>
              </select>
            </div>

            <button
              className="export-button"
              type="button"
              onClick={handleExportGeneralData}
            >
              Export General Data
            </button>
          </div>
        </section>

        <section className="export-card">
          <div className="export-card__header">
            <h3>Financial Export</h3>
            <p>Export revenue and customer spending reports.</p>
          </div>

          <div className="export-form">
            <div className="export-field">
              <label htmlFor="financial-report-type">Report Type</label>
              <select id="financial-report-type" defaultValue="Revenue Summary">
                <option>Revenue Summary</option>
                <option>Customer Spending Report</option>
                <option>Promotion Performance</option>
              </select>
            </div>

            <div className="export-field">
              <label htmlFor="financial-date-range">Date Range</label>
              <select id="financial-date-range" defaultValue="Last 30 Days">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>This Year</option>
              </select>
            </div>

            <div className="export-field">
              <label htmlFor="financial-format">File Format</label>
              <select id="financial-format" defaultValue="CSV">
                <option>CSV</option>
                <option>XLSX</option>
              </select>
            </div>

            <button
              className="export-button"
              type="button"
              onClick={handleExportFinancialReport}
            >
              Export Financial Report
            </button>
          </div>
        </section>
      </div>

      <section className="export-history-card">
        <div className="export-card__header">
          <h3>Recent Export History</h3>
          <p>Track recently generated reports.</p>
        </div>

        <div className="export-history-table-wrapper">
          <table className="export-history-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Report Name</th>
                <th>Type</th>
                <th>Format</th>
                <th>Generated By</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {historyItems.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td>{item.reportName}</td>
                  <td>{item.type}</td>
                  <td>{item.format}</td>
                  <td>{item.generatedBy}</td>
                  <td>{item.date}</td>
                  <td>
                    <StatusBadge
                      label={item.status}
                      variant={
                        item.status === "Completed" ? "success" : "processing"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default ExportPage;
