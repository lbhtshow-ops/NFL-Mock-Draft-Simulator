export default function DashboardGrid({ className = "", children }) {
  return (
    <div className={`dashboard_grid ${className}`}>
      {children}
    </div>
  );
}