import React from "react";
import { getUserRole } from "../utils/authHelper";
import Navbar from "./Navbar";

const AdminPage = () => {
  const role = getUserRole();

  if (role !== "ADMIN") {
    return <h3>Access Denied. Admins only.</h3>;
  }

  return (
    <div>
      <Navbar />
      <h2>Welcome Admin!</h2>
    </div>
  );
};

export default AdminPage;
