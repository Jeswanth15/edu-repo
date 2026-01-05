import React from "react";

const Navbar = () => {
  return (
    <nav style={styles.navbar}>
      <h2 style={styles.logo}>School Management</h2>
    </nav>
  );
};

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "center",  // center the title
    alignItems: "center",
    padding: "10px 20px",
    backgroundColor: "#0a4275",
    color: "white",
  },
  logo: {
    margin: 0,
  },
};

export default Navbar;
