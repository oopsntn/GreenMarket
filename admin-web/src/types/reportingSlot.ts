export type ReportingSlotCatalogItem = {
  id: number;
  code: string;
  title: string;
  label: string;
  scope: "Homepage" | "Category" | "Search";
  capacity: number;
  status: "Active" | "Disabled";
};
