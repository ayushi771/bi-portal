import React, { useEffect, useRef } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../utils/animations";
function HiringDashboard() {
  const dashboardRef = useRef(null);

  useEffect(() => {
    if (!dashboardRef.current) return;
    dashboardRef.current.innerHTML = "";
    embedDashboard({
      id: "679337b2-cc6a-41c2-86a4-7c6baeb51f24", // ✅ Hiring Dashboard ID
      supersetDomain: "http://localhost:8088",
      mountPoint: dashboardRef.current,

      // 🔥 Fetch token from backend
      fetchGuestToken: () =>
        fetch(
          "http://localhost:8000/superset/token/679337b2-cc6a-41c2-86a4-7c6baeb51f24"
        )
          .then((res) => res.json())
          .then((data) => {
            console.log("Hiring token:", data); // debug

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
            Hiring Dashboard
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
    height: "1000px",  // fixed height like EmployeeDashboard
    borderRadius: "12px",
    overflow: "hidden",
  },
};
export default HiringDashboard;