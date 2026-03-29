import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import { dashboardService } from "../services/dashboardService";
import "./DashboardPage.css";

function DashboardPage() {
  const statCards = dashboardService.getStatCards();
  const summary = dashboardService.getSummary();

  return (
    <div className="dashboard-page">
      <PageHeader
        title="Dashboard Overview"
        description="Welcome back. Here is the summary of GreenMarket system."
      />

      <div className="dashboard-cards">
        {statCards.map((card) => (
          <SectionCard key={card.title}>
            <div className="dashboard-card">
              <h3>{card.title}</h3>
              <strong>{card.value}</strong>
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard title={summary.title}>
        <div className="dashboard-panel">
          <p>{summary.description}</p>
        </div>
      </SectionCard>
    </div>
  );
}

export default DashboardPage;
