import React, { useState } from "react";
import { loginUser } from "../utils/api";
import { Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await loginUser({ email, password });

      localStorage.setItem("token", response.data);

      window.location.href = "/";
    } catch (error) {
      const message =
        error.response?.data ||
        "Invalid credentials. Please try again.";

      alert(message);
      console.error("Login failed:", error);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.subtitle}>Login to your account</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>

        <p style={styles.footerText}>
          New user?{" "}
          <Link to="/register" style={styles.link}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

/* Responsive + Professional UI Styles */
const styles = {
  wrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f4c75, #3282b8)",
    padding: "20px",
  },

  card: {
    background: "white",
    width: "100%",
    maxWidth: "420px",
    padding: "40px 30px",
    borderRadius: "16px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    textAlign: "center",
  },

  title: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "8px",
    color: "#0a4275",
  },

  subtitle: {
    color: "#666",
    marginBottom: "25px",
    fontSize: "14px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "15px",
    outline: "none",
    width: "100%",
  },

  button: {
    padding: "12px",
    borderRadius: "8px",
    background: "#0a4275",
    color: "white",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    marginTop: "5px",
    fontSize: "16px",
  },

  footerText: {
    marginTop: "15px",
    fontSize: "14px",
    color: "#333",
  },

  link: {
    color: "#0a4275",
    fontWeight: "600",
    textDecoration: "none",
  },
};

export default Login;
