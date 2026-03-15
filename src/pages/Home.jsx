import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div>
      <h1>Business Intelligence Portal</h1>

      <div className="card-grid">

        <Link to="/employee" className="dashboard-card">
          <h3>Employee Analytics</h3>
          <p>Department, salary and workforce insights</p>
        </Link>

        <Link to="/project" className="dashboard-card">
          <h3>Project Analytics</h3>
          <p>Project budgets, teams and delivery metrics</p>
        </Link>

        <Link to="/performance" className="dashboard-card">
          <h3>Performance Analytics</h3>
          <p>Employee performance and productivity analysis</p>
        </Link>

        <Link to="/hiring" className="dashboard-card">
          <h3>Hiring Analytics</h3>
          <p>Recruitment funnel and hiring success metrics</p>
        </Link>

      </div>
    </div>
  );
}

export default Home;