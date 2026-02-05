import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { FaChevronLeft, FaSignOutAlt } from "react-icons/fa";
import { logout as authLogout } from "../utils/authHelper";

const Layout = ({ children }) => {
  const navigate = useNavigate();

  const handleBack = () => navigate(-1);

  const handleLogout = () => {
    authLogout();
  };

  return (
    <div style={styles.layoutWrapper}>
      <Sidebar />

      <div style={styles.contentArea}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <button className="modern-btn btn-outline" onClick={handleBack} style={styles.backBtn}>
              <FaChevronLeft size={12} />
              <span>Back</span>
            </button>
          </div>

          <div style={styles.headerCenter}>
            <Navbar />
          </div>

          <div style={styles.headerRight}>
            <button className="modern-btn" onClick={handleLogout} style={styles.logoutBtn}>
              <FaSignOutAlt size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <main style={styles.pageContent} className="fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

const styles = {
  layoutWrapper: {
    display: "flex",
    minHeight: "100vh",
    background: "var(--background-color)",
  },
  contentArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 32px",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid var(--border-color)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerLeft: {
    width: "150px",
  },
  headerCenter: {
    flex: 1,
  },
  headerRight: {
    width: "150px",
    display: "flex",
    justifyContent: "flex-end",
  },
  backBtn: {
    padding: "6px 12px",
    fontSize: "13px",
  },
  logoutBtn: {
    padding: "6px 14px",
    fontSize: "13px",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    color: "var(--error-color)",
    fontWeight: "600",
  },
  pageContent: {
    padding: "32px",
    maxWidth: "1280px",
    width: "100%",
    margin: "0 auto",
  },
};

export default Layout;
