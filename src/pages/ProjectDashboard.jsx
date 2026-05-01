import React, { useEffect, useRef, useState, useCallback } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../utils/animations";

const DASH_ID = "7";
const handleEditDashboard = () => {
  window.open(
    `http://localhost:8088/superset/dashboard/${DASH_ID}/?edit=true`,
    "_blank"
  );
};
const EMBED_ID = "890aa819-8fbf-4ddd-8b74-aab7b15c4164";

function normalizeRole(name) {
  return (name || "").toLowerCase();
}

function userKeyFor(user) {
  return user?.username || user?.id || "anonymous";
}

function readAllFavs(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

function writeAllFavs(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export default function ProjectDashboard({ user, role }) {
  const dashboardRef = useRef(null);

  const userKey = userKeyFor(user);
  const roleKey = normalizeRole(role);
  const storageKey = `biportal:favorites:${userKey}`;

  const [isFav, setIsFav] = useState(false);

  // ✅ READ ROLE FAVORITES
  const readRoleFavs = useCallback(() => {
    const all = readAllFavs(storageKey);
    return all?.[roleKey] || {};
  }, [storageKey, roleKey]);

  // ✅ WRITE ROLE FAVORITES
  const writeRoleFav = useCallback((value) => {
    const all = readAllFavs(storageKey);
    const updated = { ...all };

    updated[roleKey] = updated[roleKey] || {};

    if (value) updated[roleKey][DASH_ID] = true;
    else delete updated[roleKey][DASH_ID];

    writeAllFavs(storageKey, updated);

    // 🔥 EVENT TRIGGER
    window.dispatchEvent(
      new CustomEvent("favorites-updated", {
        detail: {
          userKey,
          role: roleKey,
          dashboardId: DASH_ID,
          isFavorite: value,
        },
      })
    );
  }, [storageKey, roleKey, userKey]);

  // ✅ INIT + SYNC
  useEffect(() => {
    const favs = readRoleFavs();
    setIsFav(!!favs[DASH_ID]);

    const handler = (e) => {
      const d = e.detail;
      if (d.userKey === userKey && normalizeRole(d.role) === roleKey) {
        const updated = readRoleFavs();
        setIsFav(!!updated[DASH_ID]);
      }
    };

    const onStorage = (e) => {
      if (e.key === storageKey) {
        const updated = readRoleFavs();
        setIsFav(!!updated[DASH_ID]);
      }
    };

    window.addEventListener("favorites-updated", handler);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("favorites-updated", handler);
      window.removeEventListener("storage", onStorage);
    };
  }, [readRoleFavs, userKey, roleKey, storageKey]);

  // ✅ EMBED DASHBOARD
  useEffect(() => {
    if (!dashboardRef.current) return;

    dashboardRef.current.innerHTML = "";

    embedDashboard({
      id: EMBED_ID,
      supersetDomain: "http://localhost:8088",
      mountPoint: dashboardRef.current,
      fetchGuestToken: () =>
        fetch(`http://localhost:8000/superset/token/${EMBED_ID}`)
          .then((res) => res.json())
          .then((data) => data.token),
    });
  }, []);

  // ✅ TOGGLE FAVORITE
  const toggleFavorite = async () => {
    const next = !isFav;

    writeRoleFav(next);
    setIsFav(next);

    // optional backend sync
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch(`http://localhost:8000/superset/favorites/${DASH_ID}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: roleKey, isFavorite: next }),
        });
      }
    } catch (err) {
      console.error("Backend sync failed", err);
    }
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={styles.page}>
      
      <motion.div variants={fadeInUp} style={styles.header}>
        <h2 style={styles.title}>Project Dashboard</h2>
         {role?.toLowerCase() === "admin" && (
  <button
    onClick={handleEditDashboard}
    style={{
      padding: "10px 16px",
      borderRadius: 999,
      background: " linear-gradient(90deg, #6366f1, #ec4899)",
      color: "#fff",
      fontWeight: 700,
      border: "none",
      cursor: "pointer",
      marginLeft: 940,
      flexWrap: "wrap"
    }}
  >
    Edit Dashboard
  </button>
)}
        <div onClick={toggleFavorite} style={styles.favoriteBox}>
          <span style={{ ...styles.star, color: isFav ? "#FFD700" : "#999" }}>
            {isFav ? "★" : "☆"}
          </span>
          <span>{isFav ? "Favorited" : "Add to Favorites"}</span>
        </div>
      </motion.div>

      <motion.div variants={fadeInUp} style={styles.card}>
        <div ref={dashboardRef} style={styles.dashboard} />
      </motion.div>
    </motion.div>
  );
}

const styles = {
  page: { padding: "20px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { margin: 0 },
  favoriteBox: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.6)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  star: { fontSize: "18px" },
  card: {
    marginTop: "10px",
    borderRadius: "16px",
    padding: "10px",
    background: "rgba(255,255,255,0.6)",
  },
  dashboard: { height: "1000px" },
};