import React from "react";

function DashboardShell({ children, className = "" }) {
  return (
    <div className={`dashboard_shell ${className}`}>
      {children}
    </div>
  );
}

export default DashboardShell;