import "./StatCard.css";

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
};

function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="stat-card">
      <span className="stat-card__title">{title}</span>
      <strong className="stat-card__value">{value}</strong>
      {subtitle ? (
        <small className="stat-card__subtitle">{subtitle}</small>
      ) : null}
    </div>
  );
}

export default StatCard;
