import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserRole, getUserName, logout } from "../utils/authHelper";

const HomePage = () => {
  const navigate = useNavigate();
  const role = getUserRole();
  const name = getUserName();

  useEffect(() => {
    if (!role) {
      navigate("/login");
      return;
    }

    switch (role) {
      case "ADMIN":
        navigate("/admin");
        break;
      case "SCHOOLADMIN":
        navigate("/schooladmin");
        break;
      case "TEACHER":
        navigate("/teacher");
        break;
      case "STUDENT":
        navigate("/student");
        break;
      default:
        navigate("/login");
    }
  }, [role, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Welcome {name || "User"}!</h2>
      <p>Redirecting to your dashboard...</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default HomePage;
