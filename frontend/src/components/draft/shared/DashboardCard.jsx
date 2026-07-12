export default function DashboardCard({ className = "", children }) {
  return (
    <div className={`dashboard_card ${className}`}>
      {children}
    </div>
  );
}