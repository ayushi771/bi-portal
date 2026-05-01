// src/pages/Home.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Home.css";

import employeeIcon from "./employee.jpeg";
import projectIcon from "./project.jpeg";
import performanceIcon from "./performance.jpeg";
import hiringIcon from "./hiring.jpeg";


const dashboards = [
  { id: "3", path: "/employee", title: "Employee Analytics", desc: "Department, salary and workforce insights", icon: employeeIcon, favImage: "/employee.jpg", allowedRoles: ["admin", "hr" , "ceo"] },
  { id: "7", path: "/project", title: "Project Analytics", desc: "Project budgets, teams and delivery metrics", icon: projectIcon, favImage: "/project.jpg", allowedRoles: ["admin", "manager", "finance manager" , "ceo"] },
  { id: "4", path: "/performance", title: "Performance Analytics", desc: "Employee performance and productivity analysis", icon: performanceIcon, favImage: "/performance.jpg", allowedRoles: ["admin", "analyst" , "ceo"] },
  { id: "5", path: "/hiring", title: "Hiring Analytics", desc: "Recruitment funnel and hiring success metrics", icon: hiringIcon, favImage: "/hiring.jpg", allowedRoles: ["admin", "manager", "hr" , "ceo"] },
];

function userKeyFor(user) {
  return (user && (user.username || user.id)) ? String(user.username || user.id) : "anonymous";
}
function storageKeyForUser(userKey) {
  return `biportal:favorites:${userKey}`;
}
function normalizeRole(name) {
  return (name || "").toString().toLowerCase();
}
function allowedForRole(dashboardId, role) {
  const d = dashboards.find((x) => x.id === dashboardId);
  if (!d || !d.allowedRoles) return false;
  return d.allowedRoles.map((r) => (r || "").toLowerCase()).includes(normalizeRole(role));
}

function readAllFavs(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function writeAllFavs(key, obj) {
  try {
    localStorage.setItem(key, JSON.stringify(obj || {}));
    return true;
  } catch {
    return false;
  }
}

// Detect if object looks like legacy flat map: keys look like dash ids and values are booleans
function isLegacyFlat(obj) {
  if (!obj || typeof obj !== "object") return false;
  const keys = Object.keys(obj);
  if (keys.length === 0) return false;
  // treat as legacy if any key matches a known dashboard id
  return keys.some((k) => dashboards.some((d) => d.id === k));
}

export default function Home({ user, role }) {
  const location = useLocation();
  const userKey = userKeyFor(user);
  const storageKey = storageKeyForUser(userKey);
  const currentRole = normalizeRole(role);
  const [favorites, setFavorites] = useState({}); // view for current role only

  // Load role favorites, migrate if needed
  const loadRoleFavorites = useCallback(() => {
    const all = readAllFavs(storageKey);
    const roleKey = currentRole || "anon";

    // Migration: legacy flat format -> move into roleKey
    if (isLegacyFlat(all)) {
      // legacyMap is whole object
      const legacyMap = all;
      const next = {};
      next[roleKey] = legacyMap;
      writeAllFavs(storageKey, next);
      // Use legacyMap but filter by allowed role
      const cleaned = {};
      Object.keys(legacyMap || {}).forEach((dashId) => {
        if (allowedForRole(dashId, currentRole)) cleaned[dashId] = true;
      });
      setFavorites(cleaned);
      return cleaned;
    }

    const roleMap = (all && all[roleKey]) ? all[roleKey] : {};
    const cleaned = {};
    Object.keys(roleMap || {}).forEach((dashId) => {
      if (allowedForRole(dashId, currentRole)) cleaned[dashId] = true;
    });
    setFavorites(cleaned);
    return cleaned;
  }, [storageKey, currentRole]);

  useEffect(() => {
    loadRoleFavorites();
  }, [loadRoleFavorites]);

  // Listen for role-aware favorites updates and storage events
  useEffect(() => {
    const onCustom = (e) => {
      const detail = e?.detail || {};
      // detail: { userKey, role, dashboardId, isFavorite }
      if (!detail || detail.userKey !== userKey) return;
      const eventRole = normalizeRole(detail.role || "");
      const roleKey = currentRole || "anon";
      // If event role doesn't match currentRole, ignore (those favourites belong to other role)
      if (eventRole !== roleKey) return;

      setFavorites((prev) => {
        const next = { ...(prev || {}) };
        if (detail.isFavorite) next[detail.dashboardId] = true;
        else delete next[detail.dashboardId];
        return next;
      });
    };

    const onStorage = (e) => {
      if (e.key !== storageKey) return;
      loadRoleFavorites();
    };

    window.addEventListener("favorites-updated", onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("favorites-updated", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [userKey, storageKey, currentRole, loadRoleFavorites]);

  // Re-load when navigating back to Home (ensures admin role change is applied)
  useEffect(() => {
    loadRoleFavorites();
  }, [location.pathname, loadRoleFavorites]);

  // Toggle favorite in role-scoped storage
  const toggleFavorite = async (dashboardId, allowedRoles, e) => {
    if (e && e.preventDefault) { e.preventDefault(); e.stopPropagation(); }
    if (!allowedForRole(dashboardId, currentRole)) return;

    const all = readAllFavs(storageKey);
    const roleKey = currentRole || "anon";
    const roleMap = all[roleKey] ? { ...all[roleKey] } : {};

    const prev = !!roleMap[dashboardId];
    if (prev) delete roleMap[dashboardId];
    else roleMap[dashboardId] = true;

    const nextAll = { ...(all || {}), [roleKey]: roleMap };
    writeAllFavs(storageKey, nextAll);

    setFavorites(roleMap);
    // dispatch role-aware event (important)
    window.dispatchEvent(new CustomEvent("favorites-updated", { detail: { userKey, role: roleKey, dashboardId, isFavorite: !prev } }));

    // best-effort persist to backend (unchanged)
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:8000"}/superset/favorites/${dashboardId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("Persist favorites failed", err);
      }
    }
  };

  const favCount = Object.keys(favorites || {}).length;

  return (
    <div className="page-container">
      <div className="welcome-card">
        <div className="welcome-text">
          <p className="welcome-label">⚡ Dashboard Overview</p>
          <h2 className="welcome-title">Welcome, <span className="role-highlight">{currentRole || "User"}</span></h2>
          <p className="welcome-desc">Explore your analytics dashboards and gain insights from your data.</p>
        </div>
        <div className="welcome-blob"></div>
      </div>

      <h2 style={{ transform: "translateY(20px)", fontSize: "1.7rem" }}>Dashboards</h2>
      <div className="card-grid">
        {dashboards.map((d) => {
          const fav = !!favorites[d.id];
          const allowed = allowedForRole(d.id, currentRole);
          return (
            <Link key={d.id} to={d.path} className="dashboard-card" aria-label={d.title}>
              <button
                className={`fav-icon ${fav ? "fav-on" : ""} ${!allowed ? "fav-disabled" : ""}`}
                onClick={(e) => toggleFavorite(d.id, d.allowedRoles, e)}
                title={allowed ? (fav ? "Remove favorite" : "Add favorite") : "You don't have permission to favourite this dashboard"}
                aria-pressed={fav}
                aria-disabled={!allowed}
                type="button"
              >
                {fav ? "★" : "☆"}
              </button>

              <h3>{d.title}</h3>
              <img src={d.icon} alt={d.title} className="card-icon" />
              <p>{d.desc}</p>
              <span>Click to explore →</span>
            </Link>
          );
        })}
      </div>

      <div className="fav-section">
        <div className="fav-header">
          <h2>Favorites</h2>
          <div className="fav-count">{favCount} dashboards</div>
        </div>

        <div className="fav-grid">
          {favCount === 0 ? (
            <div className="fav-empty">
              <div className="fav-empty-icon">⭐</div>
              <p>No favorites yet</p>
            </div>
          ) : (
            dashboards.filter((d) => favorites[d.id]).map((d) => (
              <Link key={d.id} to={d.path} className="fav-card">
                <div className="fav-image"><img src={d.favImage} alt={d.title} /></div>
                <div className="fav-content">
                  <div className="fav-top">
                    <h3>{d.title}</h3>
                    <button
                      type="button"
                      className={`fav-star ${!allowedForRole(d.id, currentRole) ? "fav-disabled" : ""}`}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(d.id, d.allowedRoles, e); }}
                    >★</button>
                  </div>
                  <p>{d.desc}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}