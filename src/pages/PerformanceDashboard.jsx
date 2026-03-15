import React from "react";

function PerformanceDashboard() {
  return (
    <div>
      <h2>Performance Analysis Dashboard</h2>

      <iframe
        title="Performance Dashboard"
        width="100%"
        height="900"
        src="http://localhost:8088/superset/dashboard/5/?native_filters_key=czW7WdZVrms"
      />
    </div>
  );
}

export default PerformanceDashboard;