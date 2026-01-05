// src/components/StudentPage.js
import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { getDecodedToken } from "../utils/authHelper";

import {
  getAllAnnouncements,
  getAllClassSubjects,
  getTimetableByClass,
  getClassroomById,
  getCalendarBySchool,
} from "../utils/api";

const StudentPage = () => {
  const decoded = getDecodedToken();
  const role = decoded?.role;
  const schoolId = decoded?.schoolId;
  const classroomId = decoded?.classroomId;

  // UI states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelContent, setRightPanelContent] = useState(null);

  const toggleSidebar = () => setSidebarOpen((s) => !s);
  const closeSidebar = () => setSidebarOpen(false);

  const openRightPanel = (type) => {
    setRightPanelContent(type);
    if (type === "CALENDAR") loadCalendar();
    if (type === "TIMETABLE") loadTimetable();
    setRightPanelOpen(true);
  };

  const closeRightPanel = () => setRightPanelOpen(false);

  // ======================================
  // ANNOUNCEMENTS
  // ======================================
  const [announcements, setAnnouncements] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const load = async () => {
      const res = await getAllAnnouncements();
      let list = res.data || [];

      list = list.filter(
        (a) =>
          a.schoolId === schoolId &&
          (a.classroomId === null || a.classroomId === classroomId)
      );

      list.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

      setAnnouncements(list);
      setFiltered(list);
    };
    load();
  }, []);

  useEffect(() => {
    let arr = announcements;
    if (filter === "SCHOOL") arr = arr.filter((a) => a.classroomId === null);
    if (filter === "CLASS") arr = arr.filter((a) => a.classroomId === classroomId);
    setFiltered(arr);
  }, [filter, announcements]);

  // ======================================
  // TIMETABLE
  // ======================================
  const [timetable, setTimetable] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [myClass, setMyClass] = useState(null);

  const DAY_KEYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const FULL_DAY = {
    MON: "Monday",
    TUE: "Tuesday",
    WED: "Wednesday",
    THU: "Thursday",
    FRI: "Friday",
    SAT: "Saturday",
  };
  const MAX_PERIODS = 7;

  const loadTimetable = async () => {
    const cls = await getClassroomById(classroomId);
    setMyClass(cls.data);

    const tt = await getTimetableByClass(classroomId);
    setTimetable(tt.data || []);

    const cs = await getAllClassSubjects();
    setClassSubjects(cs.data.filter((s) => s.classroomId === classroomId));
  };

  const getSubject = (id) => {
    return classSubjects.find((s) => s.subjectId === id)?.subjectName || "-";
  };

  // ======================================
  // CALENDAR
  // ======================================
  const [calendar, setCalendar] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadCalendar = async () => {
    const res = await getCalendarBySchool(schoolId);
    setCalendar(res.data || []);
  };

  const changeMonth = (o) => {
    const d = new Date(currentMonth);
    d.setMonth(currentMonth.getMonth() + o);
    setCurrentMonth(d);
  };

  const startOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );
  const endOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  );

  const getCalendarDays = () => {
    const arr = [];
    const first = startOfMonth.getDay();
    for (let i = 0; i < first; i++) arr.push(null);
    for (let d = 1; d <= endOfMonth.getDate(); d++) {
      arr.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
    }
    return arr;
  };

  const getDayStatus = (date) => {
    if (!date) return null;
    const id = date.toISOString().split("T")[0];
    return calendar.find((c) => c.date === id)?.status || null;
  };

  const getColor = (status) => {
    switch (status) {
      case "HOLIDAY":
        return "#ffcccc";
      case "HALF_DAY":
        return "#fff4b3";
      case "SUNDAY":
        return "#d9d9d9";
      case "WORKING":
        return "#cce5ff";
      default:
        return "#ffffff";
    }
  };

  if (role !== "STUDENT") return <h2>Access Denied</h2>;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        position: "relative",
      }}
    >
      {/* INTERNAL CSS (same as TeacherDashboard) */}
      <style>{`
        .topbar { 
          max-width: 1200px; 
          margin: 0 auto; 
          padding: 14px 20px;
          display:flex; 
          justify-content:space-between; 
          align-items:center; 
        }

        .content { 
          max-width:1200px; 
          margin:0 auto; 
          padding:0 20px 40px 20px; 
        }

        .card { 
          background:white; 
          padding:18px; 
          border-radius:10px;
          box-shadow:0 6px 18px rgba(18,25,40,0.06); 
          margin-top:18px; 
        }

        .btn { padding:10px 14px; border:none; border-radius:8px; font-weight:600; cursor:pointer; }
        .btn-primary { background:#1e88e5; color:white; }
        .btn-green { background:#2ecc71; color:white; }
        .btn-orange { background:#ff9800; color:white; }

        .muted { color:#6b7280; font-size:13px; }

        .hamburger {
          width:44px; 
          height:44px; 
          border-radius:8px;
          display:flex; 
          align-items:center; 
          justify-content:center;
          background:white; 
          cursor:pointer;
          box-shadow:0 6px 18px rgba(18,25,40,0.04); 
        }

        .sidebar-overlay { position:fixed; inset:0; z-index:1200; display:flex; pointer-events:none; }
        .sidebar-backdrop { position:absolute; inset:0; background:rgba(0,0,0,0.4); pointer-events:auto; }
        .sidebar-panel { width:280px; max-width:85%; background:white;
          transform:translateX(-100%); transition:240ms; z-index:1210; pointer-events:auto; }
        .sidebar-panel.open { transform:translateX(0); }

        .right-panel { 
          position:fixed; 
          top:0; 
          right:0; 
          width:420px; 
          max-width:95%; 
          height:100vh;
          background:white; 
          transform:translateX(100%); 
          transition:260ms;
          box-shadow:-8px 0 30px rgba(0,0,0,0.12); 
          z-index:1400; 
          overflow-y:auto; 
        }
        .right-panel.open { transform:translateX(0); }

        .panel-header { 
          padding:14px 16px; 
          border-bottom:1px solid #f0f3f8;
          display:flex; 
          justify-content:space-between; 
          align-items:center;
          position:sticky; 
          top:0; 
          background:white; 
          z-index:2; 
        }

        .tt-table { 
          width:100%; 
          border-collapse:collapse; 
          min-width:720px; 
          margin-top:10px; 
        }
        .tt-table th { background:#fafafa; padding:10px; border-bottom:2px solid #eee; }
        .tt-table td { padding:12px; border-bottom:1px solid #f2f4f8; }
        .period-col { font-weight:700; width:80px; }

        .calendar-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:6px; }
        .calendar-cell { min-height:72px; padding:8px; border-radius:8px; text-align:center; }
      `}</style>

      {/* TOPBAR */}
      <div className="topbar" style={{ paddingTop: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="hamburger" onClick={toggleSidebar}>
            <svg width="20" height="14" viewBox="0 0 20 14">
              <rect width="20" height="2" rx="1" fill="#111" />
              <rect y="6" width="20" height="2" rx="1" fill="#111" />
              <rect y="12" width="20" height="2" rx="1" fill="#111" />
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0 }}>Student Dashboard</h2>
          </div>
        </div>

        {/* BUTTONS EXACTLY LIKE TEACHER */}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-green" onClick={() => openRightPanel("TIMETABLE")}>
            My Timetable
          </button>

          <button className="btn btn-primary" onClick={() => openRightPanel("CALENDAR")}>
            School Calendar
          </button>

        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="content">
        {/* ANNOUNCEMENTS */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>📢 Announcements</h3>

          <select
            className="btn"
            style={{
              background: "#e0f0ff",
              border: "1px solid #1e88e5",
              color: "#003366",
              fontWeight: "600",
              marginTop: 8,
            }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="SCHOOL">School</option>
            <option value="CLASS">Classroom</option>
          </select>

          {filtered.length === 0 ? (
            <p className="muted" style={{ marginTop: 10 }}>
              No announcements available.
            </p>
          ) : (
            filtered.map((a) => (
              <div className="card" key={a.announcementId}>
                <h4 style={{ marginTop: 0 }}>{a.title}</h4>
                <p>{a.message}</p>
                <div className="muted">{new Date(a.postedAt).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div className="sidebar-overlay">
          <div className="sidebar-backdrop" onClick={closeSidebar} />
          <div className="sidebar-panel open">
            <Sidebar />
          </div>
        </div>
      )}

      {/* RIGHT PANEL */}
      <div className={`right-panel ${rightPanelOpen ? "open" : ""}`}>
        <div className="panel-header">
          <h3 style={{ margin: 0 }}>
            {rightPanelContent === "TIMETABLE" ? "My Timetable" : "School Calendar"}
          </h3>

          <div>
            <button
              className="btn"
              style={{ background: "#f3f4f6" }}
              onClick={() =>
                rightPanelContent === "CALENDAR"
                  ? changeMonth(-1)
                  : setRightPanelContent("TIMETABLE")
              }
            >
              ◀
            </button>

            <button
              className="btn"
              style={{ background: "#f3f4f6", marginLeft: 6 }}
              onClick={() =>
                rightPanelContent === "CALENDAR"
                  ? changeMonth(1)
                  : setRightPanelContent("CALENDAR")
              }
            >
              ▶
            </button>

            <button
              className="btn"
              style={{ background: "#fff", marginLeft: 8 }}
              onClick={closeRightPanel}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ padding: 16 }}>
          {/* TIMETABLE PANEL */}
          {rightPanelContent === "TIMETABLE" && (
            <div>
              <div className="muted" style={{ marginBottom: 10 }}>
                P1–P7 × MON–SAT
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="tt-table">
                  <thead>
                    <tr>
                      <th className="period-col">PERIOD</th>
                      {DAY_KEYS.map((d) => (
                        <th key={d}>{d}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {Array.from({ length: MAX_PERIODS }, (_, i) => i + 1).map((p) => (
                      <tr key={p}>
                        <td className="period-col">P{p}</td>

                        {DAY_KEYS.map((d) => {
                          const slot = timetable.find(
                            (t) =>
                              t.dayOfWeek.toUpperCase().startsWith(d) &&
                              Number(t.periodNumber) === p
                          );
                          return (
                            <td key={`${d}_${p}`}>
                              {slot ? getSubject(slot.subjectId) : "-"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CALENDAR PANEL */}
          {rightPanelContent === "CALENDAR" && (
            <div>
              {/* Month Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                <button
                  className="btn"
                  style={{ background: "#f3f4f6" }}
                  onClick={() => changeMonth(-1)}
                >
                  ◀
                </button>

                <strong>
                  {currentMonth.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </strong>

                <button
                  className="btn"
                  style={{ background: "#f3f4f6" }}
                  onClick={() => changeMonth(1)}
                >
                  ▶
                </button>
              </div>

              {/* Days Header */}
              <div className="calendar-grid" style={{ fontWeight: 700 }}>
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                  <div key={d} style={{ textAlign: "center" }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Cells */}
              <div className="calendar-grid" style={{ marginTop: 6 }}>
                {getCalendarDays().map((date, i) => {
                  const status = getDayStatus(date);
                  return (
                    <div
                      key={i}
                      className="calendar-cell"
                      style={{ background: getColor(status) }}
                    >
                      <div style={{ fontWeight: 700 }}>
                        {date ? date.getDate() : ""}
                      </div>
                      {status && (
                        <div style={{ fontSize: 12, marginTop: 6, fontWeight: 700 }}>
                          {status}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPage;
