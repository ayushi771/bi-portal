import React, { useEffect, useRef, useState, useCallback } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../utils/animations";

const DASH_ID = "5";
const EMBED_ID = "24afe570-3d2d-4f7b-a543-3e9719289c6a";

const API_BASE = "http://localhost:8000";
const SUPERSET_URL = "http://localhost:8088";

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

export default function HiringDashboard({ user, role }) {
  const dashboardRef = useRef(null);
  const lastUpdateRef = useRef(null);
  const isMountedRef = useRef(true);

  const userKey = userKeyFor(user);
  const roleKey = normalizeRole(role);
  const storageKey = `biportal:favorites:${userKey}`;

  const [isFav, setIsFav] = useState(false);

  // ------------------------
  // LOAD DASHBOARD
  // ------------------------
  const loadDashboard = useCallback(() => {
    if (!dashboardRef.current) return;

    dashboardRef.current.innerHTML = "";

    embedDashboard({
      id: EMBED_ID,
      supersetDomain: SUPERSET_URL,
      mountPoint: dashboardRef.current,
      fetchGuestToken: () =>
        fetch(`${API_BASE}/superset/token/${EMBED_ID}`)
          .then((res) => res.json())
          .then((data) => data.token),
    });
  }, []);

  // ------------------------
  // FAVORITES
  // ------------------------
  const readRoleFavs = useCallback(() => {
    const all = readAllFavs(storageKey);
    return all?.[roleKey] || {};
  }, [storageKey, roleKey]);

  const writeRoleFav = useCallback(
    (value) => {
      const all = readAllFavs(storageKey);
      const updated = { ...all };

      updated[roleKey] = updated[roleKey] || {};

      if (value) updated[roleKey][DASH_ID] = true;
      else delete updated[roleKey][DASH_ID];

      writeAllFavs(storageKey, updated);

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
    },
    [storageKey, roleKey, userKey]
  );

  useEffect(() => {
    const favs = readRoleFavs();
    setIsFav(!!favs[DASH_ID]);
  }, [readRoleFavs]);

  const toggleFavorite = () => {
    const next = !isFav;
    writeRoleFav(next);
    setIsFav(next);
  };

  // ------------------------
  // INITIAL LOAD
  // ------------------------
  useEffect(() => {
    loadDashboard();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadDashboard]);

  // ------------------------
  // SMART AUTO REFRESH (NO INTERVAL)
  // ------------------------
  const smartCheck = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/data/last-update/hiring`);
      const data = await res.json();

      const newTime = data.last_update;

      if (!lastUpdateRef.current) {
        lastUpdateRef.current = newTime;
      } else if (newTime && newTime !== lastUpdateRef.current) {
        console.log("📊 Data changed → refreshing dashboard");

        lastUpdateRef.current = newTime;

        loadDashboard();
      }

    } catch (err) {
      console.error("Smart refresh error", err);
    }

    // 🔁 re-run only if component is alive
    if (isMountedRef.current) {
      setTimeout(smartCheck, 20000); // 20 sec adaptive loop
    }
  }, [loadDashboard]);

  useEffect(() => {
    smartCheck();
  }, [smartCheck]);

  // ------------------------
  // UI
  // ------------------------
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={styles.page}>
      
      <motion.div variants={fadeInUp} style={styles.header}>
        <h2 style={styles.title}>Hiring Dashboard</h2>

        {role?.toLowerCase() === "admin" && (
          <button
            onClick={() =>
              window.open(
                `${SUPERSET_URL}/superset/dashboard/${DASH_ID}/?edit=true`,
                "_blank"
              )
            }
            style={styles.editBtn}
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
  header: { display: "flex", alignItems: "center", gap: "15px" },
  title: { margin: 0 },

  favoriteBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    padding: "10px 16px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.6)",
  },

  editBtn: {
    padding: "10px 16px",
    borderRadius: "20px",
    background: "linear-gradient(90deg, #6366f1, #ec4899)",
    color: "#fff",
    border: "none",
    cursor: "pointer",
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