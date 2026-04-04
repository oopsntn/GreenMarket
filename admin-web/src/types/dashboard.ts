export type DashboardStatCard = {
  title: string;
  value: string;
};

export type DashboardSummary = {
  title: string;
  description: string;
};

export type DashboardApiResponse = {
  statCards: DashboardStatCard[];
  summary: DashboardSummary;
};
