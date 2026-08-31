interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  accent?: "blue" | "green" | "amber" | "purple";
}

export default function StatCard({ label, value, icon, accent = "blue" }: StatCardProps) {
  return (
    <div className={`stat-card stat-card-${accent}`}>
      {icon && <div className="stat-card-icon">{icon}</div>}
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}
