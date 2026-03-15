import React from "react";

function ProjectDashboard() {
  return (
    <div>
      <h2>Project Analysis Dashboard</h2>

      <iframe
        title="Project Dashboard"
        width="100%"
        height="900"
        src="http://localhost:8088/superset/dashboard/4/?native_filters_key=EFFvhKM8G-k"
      />
    </div>
  );
}

export default ProjectDashboard;