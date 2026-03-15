import React from "react";

function EmployeeDashboard() {
  return (
    <div>
      <h2>Employee Analysis Dashboard</h2>

      <iframe
     title="Employee Dashboard"
     width="100%"
     height="900"
     src="http://localhost:8088/superset/dashboard/3/?standalone=1 "
/>
    </div>
  );
}

export default EmployeeDashboard;