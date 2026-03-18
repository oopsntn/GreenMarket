import { dashboardService } from "../services/dashboardService";
import "./DashboardPage.css";

function DashboardPage() {
  const statCards = dashboardService.getStatCards();
  const summary = dashboardService.getSummary();

  return (
    <div className="dashboard-page">
      <div className="dashboard-title">
        <h2>Dashboard Overview</h2>
        <p>Welcome back. Here is the summary of GreenMarket system.</p>
      </div>

      <div className="dashboard-cards">
        {statCards.map((card) => (
          <div key={card.title} className="dashboard-card">
            <h3>{card.title}</h3>
            <strong>{card.value}</strong>
          </div>
        ))}
      </div>

      <div className="dashboard-panel">
        <h3>{summary.title}</h3>
        <p>{summary.description}</p>
      </div>
    </div>
  );
}

export default DashboardPage;
