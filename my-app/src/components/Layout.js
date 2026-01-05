import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
  const navigate = useNavigate();

  const handleBack = () => navigate(-1);

  const handleLogout = () => {
    localStorage.removeItem("token");
    alert("Logged out successfully");
    navigate("/login");
  };

  const styles = {
    layoutWrapper: {
      display: "flex",
      width: "100%",
      minHeight: "100vh",
      background: "#f5f7fa",
      overflow: "hidden",
      fontFamily: "Inter, sans-serif",
    },

    contentArea: {
      flexGrow: 1,
      paddingLeft: 0, // Sidebar overlays
      transition: "0.3s ease",
      width: "100%",
    },

    topbar: {
      height: "70px",
      background: "#0a4275",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      color: "white",
      position: "sticky",
      top: 0,
      zIndex: 10,
      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    },

    topButton: {
      background: "rgba(255,255,255,0.15)",
      padding: "8px 16px",
      borderRadius: "6px",
      color: "white",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
      backdropFilter: "blur(6px)",
      transition: "0.2s",
    },

    topButtonHover: {
      background: "rgba(255,255,255,0.25)",
    },

    pageContent: {
      padding: "25px",
      maxWidth: "1100px",
      margin: "auto",
    },

    // Mobile
    "@media (max-width: 768px)": {
      contentArea: {
        paddingLeft: 0,
      },
      topbar: {
        padding: "0 12px",
      },
      pageContent: {
        padding: "15px",
      },
    },
  };

  return (
    <div style={styles.layoutWrapper}>
      {/* Sidebar overlay (never pushes content) */}
      <Sidebar />

      {/* RIGHT SIDE CONTENT */}
      <div style={styles.contentArea}>
        {/* TOP NAVBAR */}
        <div style={styles.topbar}>
          <button
            style={styles.topButton}
            onMouseOver={(e) =>
              (e.target.style.background = styles.topButtonHover.background)
            }
            onMouseOut={(e) =>
              (e.target.style.background = styles.topButton.background)
            }
            onClick={handleBack}
          >
            ⬅ Back
          </button>

          <Navbar />

          <button
            style={{ ...styles.topButton, background: "#e53935" }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        {/* PAGE CONTENT */}
        <div style={styles.pageContent}>{children}</div>
      </div>
    </div>
  );
};

export default Layout;
