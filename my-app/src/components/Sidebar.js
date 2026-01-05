import React, { useState } from "react";
import { FaBars } from "react-icons/fa";
import { Link } from "react-router-dom";
import { getDecodedToken } from "../utils/authHelper";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const decoded = getDecodedToken();

  const userRole = decoded?.role;
  const schoolName = decoded?.schoolName || "School Portal";

  const toggleSidebar = () => setIsOpen(!isOpen);

  const closeSidebar = () => setIsOpen(false);

  const linkStyle = {
    color: "white",
    textDecoration: "none",
    display: "block",
    padding: "10px",
    background: "#0c508a",
    borderRadius: "6px",
    textAlign: "center",
    fontSize: "14px",
    cursor: "pointer",
  };

  return (
    <>
      {/* Toggle button always visible */}
      <button
        onClick={toggleSidebar}
        style={{
          position: "fixed",
          top: 10,
          left: 10,
          zIndex: 2000,
          backgroundColor: "#0a4275",
          color: "white",
          border: "none",
          padding: "8px",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        <FaBars size={22} />
      </button>

      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: isOpen ? 0 : "-270px",
          width: "270px",
          height: "100%",
          backgroundColor: "#0a4275",
          color: "white",
          transition: "0.3s",
          paddingTop: "60px",
          zIndex: 1500,
          overflowY: "auto",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "25px",
            fontWeight: "bold",
            fontSize: "18px",
          }}
        >
          {schoolName}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            padding: "20px",
          }}
        >

          {/* COMMON */}
          <Link to="/" style={linkStyle} onClick={closeSidebar}>Dashboard</Link>

          {/* SCHOOL ADMIN */}
          {userRole === "SCHOOLADMIN" && (
            <>
              <Link to="/schooladmin/pending-users" style={linkStyle} onClick={closeSidebar}>Users</Link>
              <Link to="/schooladmin/classrooms" style={linkStyle} onClick={closeSidebar}>Classrooms</Link>
              <Link to="/schooladmin/assign-subject" style={linkStyle} onClick={closeSidebar}>Assign Subjects</Link>
              <Link to="/schooladmin/subjects" style={linkStyle} onClick={closeSidebar}>Subjects</Link>
              <Link to="/schooladmin/enrollments" style={linkStyle} onClick={closeSidebar}>Enrollments</Link>
              <Link to="/schooladmin/timetables" style={linkStyle} onClick={closeSidebar}>Timetables</Link>
              <Link to="/schooladmin/calendar" style={linkStyle} onClick={closeSidebar}>Calendar</Link>
              <Link to="/schooladmin/syllabus" style={linkStyle} onClick={closeSidebar}>Syllabus</Link>
              <Link to="/schooladmin/teaching-logs" style={linkStyle} onClick={closeSidebar}>Logs</Link>
              <Link to="/schooladmin/attendance" style={linkStyle} onClick={closeSidebar}>Attendance</Link>
              <Link to="/schooladmin/assignments" style={linkStyle} onClick={closeSidebar}>Assignments</Link>
              <Link to="/schooladmin/exams" style={linkStyle} onClick={closeSidebar}>Exams</Link>
              <Link to="/schooladmin/marks" style={linkStyle} onClick={closeSidebar}>Marks</Link>
            </>
          )}

          {/* TEACHER */}
          {userRole === "TEACHER" && (
            <>
              <Link to="/teacher" style={linkStyle} onClick={closeSidebar}>Dashboard</Link>
              <Link to="/teacher/exams" style={linkStyle} onClick={closeSidebar}>Exams</Link>
              <Link to="/teacher/marks" style={linkStyle} onClick={closeSidebar}>Marks</Link>
              <Link to="/teacher/attendance" style={linkStyle} onClick={closeSidebar}>Attendance</Link>
              <Link to="/teacher/assignments" style={linkStyle} onClick={closeSidebar}>Assignments</Link>
              <Link to="/teacher/syllabus" style={linkStyle} onClick={closeSidebar}>Syllabus</Link>
              <Link to="/teacher/teaching-logs" style={linkStyle} onClick={closeSidebar}>Logs</Link>
            </>
          )}

          {/* STUDENT */}
          {userRole === "STUDENT" && (
            <>
              <Link to="/student" style={linkStyle} onClick={closeSidebar}>Dashboard</Link>
              <Link to="/student/timetable" style={linkStyle} onClick={closeSidebar}>Timetable</Link>
              <Link to="/student/exams" style={linkStyle} onClick={closeSidebar}>Exams</Link>
              <Link to="/student/marks" style={linkStyle} onClick={closeSidebar}>Marks</Link>
              <Link to="/student/assignments" style={linkStyle} onClick={closeSidebar}>Assignments</Link>
              <Link to="/student/attendance" style={linkStyle} onClick={closeSidebar}>Attendance</Link>
            </>
          )}

        </div>
      </div>
    </>
  );
};

export default Sidebar;
