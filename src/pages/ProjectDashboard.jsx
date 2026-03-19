import React, { useEffect, useRef } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../utils/animations";
function ProjectDashboard() {
  const dashboardRef = useRef(null);

  useEffect(() => {
    if (!dashboardRef.current) return;

    embedDashboard({
      id: "30f7be29-0935-4093-85c5-1db4ac30fff1", // ✅ Project Dashboard ID
      supersetDomain: "http://localhost:8088",
      mountPoint: dashboardRef.current,

      // 🔥 Fetch token from backend
      fetchGuestToken: () =>
        fetch(
          "http://localhost:8000/superset/token/30f7be29-0935-4093-85c5-1db4ac30fff1"
        )
          .then((res) => res.json())
          .then((data) => {
            console.log("Project token:", data); // ✅ debug

            if (data.token && typeof data.token === "string") {
              return data.token;
            } else {
              throw new Error("Invalid token");
            }
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

export default ProjectDashboard;