import React, { useEffect, useRef } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../utils/animations";
function PerformanceDashboard() {
  const dashboardRef = useRef(null);

  useEffect(() => {
    if (!dashboardRef.current) return;

    embedDashboard({
      id: "90859ba8-749e-4777-b8f3-f8d5ca556b0b", // ✅ Performance Dashboard ID
      supersetDomain: "http://localhost:8088",
      mountPoint: dashboardRef.current,

      // 🔥 Fetch token from FastAPI
      fetchGuestToken: () =>
        fetch(
          "http://localhost:8000/superset/token/90859ba8-749e-4777-b8f3-f8d5ca556b0b"
        )
          .then((res) => res.json())
          .then((data) => {
            if (data.token) return data.token;
            throw new Error("Token not received");
          }),

      
    });
  }, []);

  return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        style={styles.page}
      >
        <motion.h2 variants={fadeInUp}>
          Performance Dashboard
        </motion.h2>
  
        {/* Glass Card Container */}
        <motion.div variants={fadeInUp} style={styles.card}>
          <div ref={dashboardRef} style={styles.dashboard} />
        </motion.div>
      </motion.div>
    );
  }
  
  const styles = {
    page: {
      padding: "20px",
    },
    card: {
      marginTop: "10px",
      borderRadius: "16px",
      padding: "10px",
      backdropFilter: "blur(10px)",
      background: "rgba(255,255,255,0.6)",
      boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
    },
    dashboard: {
      height: "1000px",
      borderRadius: "12px",
      overflow: "hidden",
    },
  };

export default PerformanceDashboard;