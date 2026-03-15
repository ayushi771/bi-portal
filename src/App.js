import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ProjectDashboard from "./pages/ProjectDashboard";
import PerformanceDashboard from "./pages/PerformanceDashboard";
import HiringDashboard from "./pages/HiringDashboard";
import Login from "./pages/Login";

import { getCurrentUser } from "./api/api";

function App() {

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then((data) => {
        setUser(data);
        setRole(data.role?.name?.toLowerCase());
      })
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => {
        setLoading(false);
      });

  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setRole(null);
  };

  // wait while checking session
  if (loading) {
    return <div>Loading...</div>;
  }

  // if no user → login page
  if (!user) {
    return <Login onLogin={() => window.location.reload()} />;
  }

  return (
    <BrowserRouter>

      <Sidebar user={user} role={role} onLogout={handleLogout} />

      <div className="main-content">

        <Routes>

          <Route path="/" element={<Home />} />

          <Route
            path="/employee"
            element={
              <ProtectedRoute role={role} allowedRoles={["admin"]}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/project"
            element={
              <ProtectedRoute role={role} allowedRoles={["admin","manager"]}>
                <ProjectDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/performance"
            element={
              <ProtectedRoute role={role} allowedRoles={["admin","analyst"]}>
                <PerformanceDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hiring"
            element={
              <ProtectedRoute role={role} allowedRoles={["admin","manager"]}>
                <HiringDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />

        </Routes>

      </div>

    </BrowserRouter>
  );
}

export default App;