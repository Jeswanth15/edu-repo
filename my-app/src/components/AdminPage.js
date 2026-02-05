import React from "react";
import { getUserRole, getUserName } from "../utils/authHelper";
import { FaUserShield, FaTools, FaDatabase, FaShieldAlt } from "react-icons/fa";

const AdminPage = () => {
  const role = getUserRole();
  const name = getUserName();

  if (role !== "ADMIN") {
    return (
      <div style={styles.errorContainer}>
        <h3 style={styles.errorText}>Access Denied. Admins only.</h3>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>System Administration</h1>
        <p style={styles.subtitle}>Global configurations and system monitoring</p>
      </div>

      <div style={styles.grid}>
        <div className="premium-card" style={styles.welcomeCard}>
          <div style={styles.iconBox}><FaUserShield size={32} /></div>
          <div style={styles.welcomeText}>
            <h2 style={styles.welcomeTitle}>Welcome, {name || "Administrator"}</h2>
            <p style={styles.welcomeDesc}>You have full access to the system backend. Use these tools with caution.</p>
          </div>
        </div>

        <div style={styles.toolsGrid}>
          <div className="premium-card hover-lift" style={styles.toolCard}>
            <FaDatabase style={styles.toolIcon} />
            <h4>Database Management</h4>
            <p>View and manage raw system data entries.</p>
            <button className="modern-btn btn-outline" style={styles.btn}>Manage</button>
          </div>
          <div className="premium-card hover-lift" style={styles.toolCard}>
            <FaTools style={styles.toolIcon} />
            <h4>System Settings</h4>
            <p>Configure global application parameters.</p>
            <button className="modern-btn btn-outline" style={styles.btn}>Configure</button>
          </div>
          <div className="premium-card hover-lift" style={styles.toolCard}>
            <FaShieldAlt style={styles.toolIcon} />
            <h4>Security Audit</h4>
            <p>Review system logs and security patches.</p>
            <button className="modern-btn btn-outline" style={styles.btn}>Audit Logs</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "36px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "4px",
  },
  subtitle: {
    color: "var(--text-muted)",
    fontSize: "14px",
  },
  welcomeCard: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    padding: "32px",
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    color: "white",
    marginBottom: "32px",
  },
  iconBox: {
    width: "64px",
    height: "64px",
    borderRadius: "16px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--accent-color)",
  },
  welcomeTitle: {
    margin: 0,
    fontSize: "22px",
    color: "white",
  },
  welcomeDesc: {
    margin: "4px 0 0 0",
    fontSize: "15px",
    color: "rgba(255, 255, 255, 0.7)",
  },
  toolsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
  },
  toolCard: {
    padding: "24px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  toolIcon: {
    fontSize: "24px",
    color: "var(--primary-color)",
    marginBottom: "8px",
  },
  btn: {
    marginTop: "auto",
    width: "100%",
  },
  errorContainer: {
    textAlign: "center",
    padding: "100px 20px",
  },
  errorText: {
    color: "var(--error-color)",
  }
};

export default AdminPage;
