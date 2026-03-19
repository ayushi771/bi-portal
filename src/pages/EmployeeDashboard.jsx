import React, { useEffect, useRef } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../utils/animations";

function EmployeeDashboard() {
  const dashboardRef = useRef(null);

  useEffect(() => {
    if (!dashboardRef.current) return;

    dashboardRef.current.innerHTML = "";

    embedDashboard({
      id: "2d1f2f5b-2974-434c-9f7a-53a3ab263310",
      supersetDomain: "http://localhost:8088",
      mountPoint: dashboardRef.current,

      fetchGuestToken: () =>
        fetch("http://localhost:8000/superset/token/2d1f2f5b-2974-434c-9f7a-53a3ab263310")
          .then((res) => res.json())
          .then((data) => data.token),
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
        Employee Dashboard
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

export default EmployeeDashboard;