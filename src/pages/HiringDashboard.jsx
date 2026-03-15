import React from "react";

function HiringDashboard() {
  return (
    <div>
      <h2>Hiring Performance Dashboard</h2>

      <iframe
        title="Hiring Dashboard"
        width="100%"
        height="900"
        src="http://localhost:8088/superset/dashboard/6/?native_filters_key=VORQFIUir-U"
      />
    </div>
  );
}

export default HiringDashboard;