import "./DashboardPage.css";

function DashboardPage() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-title">
        <h2>Dashboard Overview</h2>
        <p>Welcome back. Here is the summary of GreenMarket system.</p>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Total Users</h3>
          <strong>1,250</strong>
        </div>

        <div className="dashboard-card">
          <h3>Total Posts</h3>
          <strong>3,480</strong>
        </div>

        <div className="dashboard-card">
          <h3>Pending Reports</h3>
          <strong>28</strong>
        </div>

        <div className="dashboard-card">
          <h3>Revenue</h3>
          <strong>$2,340</strong>
        </div>
      </div>

      <div className="dashboard-panel">
        <h3>System Summary</h3>
        <p>
          This area will later display analytics, latest activities, moderation
          status, promotion performance, and financial reports.
        </p>
      </div>
    </div>
  );
}

export default DashboardPage;
