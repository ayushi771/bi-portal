import React from "react";
import { Link } from "react-router-dom";

function Sidebar({ user, role, onLogout, onLoginClick }) {
  return (
    <div className="navbar">
      <h2>BI Portal</h2>

      <div className="nav-links">
        <Link to="/">Home</Link>

        {/* Admin only */}
        {role === "admin" && (
          <Link to="/employee">Employee</Link>
        )}

        {/* Admin + Manager */}
        {(role === "admin" || role === "manager") && (
          <Link to="/project">Projects</Link>
        )}

        {/* Admin + Analyst */}
        {(role === "admin" || role === "analyst") && (
          <Link to="/performance">Performance</Link>
        )}

        {/* Admin + Manager */}
        {(role === "admin" || role === "manager") && (
          <Link to="/hiring">Hiring</Link>
        )}

        {user ? (
          <>
            <span className="username">Hello, {user.username}</span>
            <button className="btn logout" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <button className="btn login" onClick={onLoginClick}>
            Login
          </button>
        )}
      </div>
    </div>
  );
}

export default Sidebar;