import React from "react";
import { Link } from "react-router-dom";
import { getDecodedToken } from "../utils/authHelper";

const Navbar = () => {
  const decoded = getDecodedToken();
  const userName = decoded?.name || "User";

  const getInitials = (name) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <nav style={styles.navbar} className="glass-panel">
      <h2 style={styles.logo}>EduPortal</h2>
      <div style={styles.profileSection}>
        <Link to="/profile" style={styles.profileLink}>
          <span style={styles.userName}>{userName}</span>
          <div style={styles.miniAvatar}>
            {getInitials(userName)}
          </div>
        </Link>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid var(--border-color)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    margin: "0 0 24px 0",
  },
  logo: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "700",
    color: "var(--primary-color)",
    fontFamily: "'Outfit', sans-serif",
  },
  profileSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  profileLink: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    textDecoration: "none",
    padding: "6px 14px",
    borderRadius: "var(--radius-xl)",
    transition: "var(--transition-fast)",
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
  userName: {
    color: "var(--text-primary)",
    fontWeight: "600",
    fontSize: "14px",
  },
  miniAvatar: {
    width: "32px",
    height: "32px",
    backgroundColor: "var(--primary-color)",
    color: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
    border: "2px solid white",
    boxShadow: "var(--shadow-sm)",
  }
};

export default Navbar;
