import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { getDecodedToken } from "../utils/authHelper";
import {
  getAnnouncementsBySchool,
  getAllClassSubjects,
  createAnnouncement,
  getAllTimetables,
  getCalendarBySchool,
} from "../utils/api";

const TeacherDashboard = () => {
  const decoded = getDecodedToken();
  const navigate = useNavigate();

  const teacherId = decoded?.userId;
  const schoolId = decoded?.schoolId;
  const schoolName = decoded?.schoolName;

  // Data states
  const [announcements, setAnnouncements] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [myTimetable, setMyTimetable] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    classroomId: "",
  });

  const [calendar, setCalendar] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // UI states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelContent, setRightPanelContent] = useState(null); // 'TIMETABLE' | 'CALENDAR' | null
  const [calLoading, setCalLoading] = useState(false);

  // Constants
  const DAY_KEYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const MAX_PERIODS = 7; // fixed per your request

  // Load data
  useEffect(() => {
    const loadEverything = async () => {
      try {
        setLoading(true);

        const ann = await getAnnouncementsBySchool(schoolId);
        setAnnouncements(ann.data || []);

        const cs = await getAllClassSubjects();
        setMyClasses(cs.data || []);

        const tt = await getAllTimetables();
        setMyTimetable((tt.data || []).filter((t) => t.teacherId === teacherId));
      } catch (err) {
        console.error("Dashboard load error", err);
      } finally {
        setLoading(false);
      }
    };

    if (teacherId && schoolId) loadEverything();
  }, [teacherId, schoolId]);

  // Announcement creation
  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      alert("Title and message are required!");
      return;
    }
    try {
      await createAnnouncement({
        ...newAnnouncement,
        userId: teacherId,
        schoolId,
        classroomId: newAnnouncement.classroomId || null,
      });
      alert("Announcement created!");
      setNewAnnouncement({ title: "", message: "", classroomId: "" });
      const a = await getAnnouncementsBySchool(schoolId);
      setAnnouncements(a.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to create announcement");
    }
  };

  // Calendar load & helpers
  const loadCalendar = async () => {
    try {
      setCalLoading(true);
      const res = await getCalendarBySchool(schoolId);
      setCalendar(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCalLoading(false);
    }
  };

  const changeMonth = (offset) => {
    const updated = new Date(currentMonth);
    updated.setMonth(currentMonth.getMonth() + offset);
    setCurrentMonth(updated);
  };

  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const getCalendarDays = () => {
    const days = [];
    const firstDayIndex = startOfMonth.getDay(); // 0 Sun - 6 Sat
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }
    return days;
  };

  const days = getCalendarDays();

  const getDayStatus = (date) => {
    if (!date) return null;
    const dateStr = date.toISOString().split("T")[0];
    const entry = calendar.find((c) => c.date === dateStr);
    return entry?.status || null;
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

  // Panel controls
  const openRightPanel = (content) => {
    setRightPanelContent(content);
    if (content === "CALENDAR") loadCalendar();
    setRightPanelOpen(true);
  };

  const closeRightPanel = () => {
    setRightPanelOpen(false);
  };

  // Sidebar controls
  const toggleSidebar = () => setSidebarOpen((s) => !s);
  const closeSidebar = () => setSidebarOpen(false);

  // Timetable map creation (normalize days to 3-letter uppercase)
  const timetableMap = {};
  myTimetable.forEach((t) => {
    let day = t.dayOfWeek ? String(t.dayOfWeek).toUpperCase() : "";
    if (day.length > 3) {
      if (day.startsWith("MON")) day = "MON";
      else if (day.startsWith("TUE")) day = "TUE";
      else if (day.startsWith("WED")) day = "WED";
      else if (day.startsWith("THU")) day = "THU";
      else if (day.startsWith("FRI")) day = "FRI";
      else if (day.startsWith("SAT")) day = "SAT";
      else if (day.startsWith("SUN")) day = "SUN";
    }
    const p = Number(t.periodNumber) || 0;
    const key = `${day}_${p}`;
    timetableMap[key] = t;
  });

  // Render cell: SUBJECT only (user chose A)
  const renderCellSubjectOnly = (day, period) => {
    const key = `${day}_${period}`;
    const entry = timetableMap[key];
    if (!entry) return <div style={{ color: "#777" }}>-</div>;

    // try subject name sources: entry.subjectName, entry.subject, find in myClasses
    let subjectName = entry.subjectName || entry.subject || null;
    if (!subjectName) {
      const cls = myClasses.find((c) =>
        (c.subjectId && c.subjectId === entry.subjectId) ||
        (c.classroomId && c.classroomId === entry.classroomId)
      );
      subjectName = cls?.subjectName || null;
    }
    if (!subjectName) subjectName = `Subject ${entry.subjectId || ""}`;

    return (
      <div style={{ textAlign: "center", fontWeight: 700 }}>
        {subjectName}
      </div>
    );
  };

  if (loading) return <h2 style={{ padding: 30 }}>Loading...</h2>;

  return (
    <div style={{ minHeight: "100vh", position: "relative", background: "#f5f7fb" }}>
      {/* Internal CSS */}
      <style>{`
        /* Layout */
        .topbar { max-width: 1200px; margin: 0 auto; padding: 14px 20px; display:flex; justify-content:space-between; align-items:center; }
        .content { max-width: 1200px; margin: 0 auto; padding: 0 20px 40px 20px; width:100%; }
        .card { background:white; padding:18px; border-radius:10px; box-shadow: 0 6px 18px rgba(18,25,40,0.06); margin-top:18px; }
        .input, select, textarea { width:100%; padding:10px 12px; margin-top:10px; border-radius:8px; border:1px solid #e0e6ef; font-size:14px; resize:vertical; }
        .btn { display:inline-block; padding:10px 14px; border-radius:8px; border:none; cursor:pointer; font-weight:600; margin-top:12px; }
        .btn-primary { background:#1e88e5; color:white; }
        .btn-green { background:#2ecc71; color:white; }
        .btn-red { background:#d9534f; color:white; }
        table { width:100%; border-collapse:collapse; margin-top:10px; }
        th, td { padding:10px 8px; border-bottom:1px solid #f0f3f8; text-align:left; }
        /* Sidebar overlay */
        .sidebar-overlay { position:fixed; inset:0; z-index:1200; display:flex; pointer-events:none; }
        .sidebar-backdrop { position:absolute; inset:0; background: rgba(6,10,20,0.45); backdrop-filter: blur(2px); pointer-events:auto; }
        .sidebar-panel { width:280px; max-width:85%; background:white; transform:translateX(-100%); transition:transform 240ms ease; box-shadow:0 10px 30px rgba(8,12,30,0.12); pointer-events:auto; z-index:1210; }
        .sidebar-panel.open { transform:translateX(0); }
        /* Right panel overlay */
        .right-panel { position:fixed; top:0; right:0; height:100vh; width:420px; max-width:95%; background:white; box-shadow:-8px 0 30px rgba(8,12,30,0.12); transform:translateX(100%); transition:transform 260ms ease; z-index:1205; overflow-y:auto; }
        .right-panel.open { transform:translateX(0); }
        @media (max-width: 880px) { .right-panel { width:100%; } }
        .right-panel .panel-header { display:flex; justify-content:space-between; align-items:center; padding:14px 16px; border-bottom:1px solid #f0f3f8; position:sticky; top:0; background:white; z-index:2; }
        .calendar-grid { display:grid; grid-template-columns: repeat(7, 1fr); gap:8px; margin-top:12px; }
        .calendar-cell { min-height:72px; padding:8px; border-radius:8px; text-align:center; }
        .muted { color:#6b7280; font-size:13px; }
        .hamburger { width:44px; height:44px; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; background:white; box-shadow: 0 6px 18px rgba(18,25,40,0.04); }
        /* Timetable table styles inside panel */
        .tt-table { width:100%; border-collapse:collapse; margin-top:8px; min-width:720px; }
        .tt-table th { padding:10px; border-bottom:2px solid #eee; text-align:center; background:#fafafa; font-weight:700; }
        .tt-table td { padding:12px; border-bottom:1px solid #f2f4f8; text-align:center; vertical-align:top; min-height:56px; }
        .period-col { text-align:left; font-weight:700; width:86px; padding-left:14px; }
      `}</style>

      {/* Header / topbar */}
      <div className="topbar" style={{ paddingTop: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="hamburger" onClick={toggleSidebar} aria-label="Open sidebar">
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="20" height="2" rx="1" fill="#111827" />
              <rect y="6" width="20" height="2" rx="1" fill="#111827" />
              <rect y="12" width="20" height="2" rx="1" fill="#111827" />
            </svg>
          </div>

          <div>
            <h2 style={{ margin: 0 }}>Teacher Dashboard</h2>
            <div className="muted" style={{ marginTop: 4 }}>{schoolName ? `School: ${schoolName}` : "No school selected"}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button className="btn btn-red" onClick={() => { localStorage.removeItem("token"); alert("Logged out successfully"); navigate("/login"); }}>Logout</button>
        </div>
      </div>

      {/* Main content */}
      <div className="content">
        {/* Announcement card */}
        <div className="card">
          <h3 style={{ margin: 0, marginBottom: 8 }}>📢 Create Announcement</h3>

          <input
            className="input"
            type="text"
            placeholder="Title"
            value={newAnnouncement.title}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
          />

          <textarea
            className="input"
            placeholder="Message"
            rows={4}
            value={newAnnouncement.message}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
          />

          <select
            className="input"
            value={newAnnouncement.classroomId}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, classroomId: e.target.value })}
          >
            <option value="">School-wide</option>
            {myClasses.map((cls) => (
              <option key={cls.id} value={cls.classroomId}>
                {cls.classroomName} - {cls.classroomSection} ({cls.subjectName})
              </option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleCreateAnnouncement} className="btn btn-primary">Post Announcement</button>

            <button onClick={() => openRightPanel("TIMETABLE")} className="btn btn-green">View My Timetable</button>

            <button onClick={() => openRightPanel("CALENDAR")} className="btn btn-primary">View School Calendar</button>
          </div>
        </div>

        {/* Latest announcements */}
        <div style={{ marginTop: 22 }}>
          <h3 style={{ marginBottom: 8 }}>📢 Latest Announcements</h3>
          {announcements.length === 0 ? (
            <div className="card"><p className="muted">No announcements posted yet.</p></div>
          ) : (
            announcements.map((a) => (
              <div className="card" key={a.announcementId}>
                <h4 style={{ marginTop: 0 }}>{a.title}</h4>
                <p style={{ marginBottom: 8 }}>{a.message}</p>
                <div className="muted">{new Date(a.postedAt).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>

        {/* Classes */}
        <div className="card" style={{ background: "#fffaf0" }}>
          <h3 style={{ marginTop: 0 }}>My Classes & Subjects</h3>
          {myClasses.length === 0 ? (
            <p className="muted">You are not assigned to any class.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Subject</th>
                </tr>
              </thead>
              <tbody>
                {myClasses.map((cs) => (
                  <tr key={cs.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/teacher/attendance/${cs.classroomId}/${cs.subjectId}`)}>
                    <td>{cs.classroomName}</td>
                    <td>{cs.classroomSection}</td>
                    <td>{cs.subjectName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" role="dialog" aria-modal="true">
          <div className="sidebar-backdrop" onClick={closeSidebar} />
          <div className="sidebar-panel open" style={{ padding: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderBottom: "1px solid #f0f3f8" }}>
              <strong style={{ fontSize: 16 }}>Menu</strong>
              <button onClick={closeSidebar} aria-label="Close sidebar" style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18, padding: 6 }}>✕</button>
            </div>
            <div style={{ overflowY: "auto", height: "calc(100vh - 56px)" }}>
              <Sidebar />
            </div>
          </div>
        </div>
      )}

      {/* Right panel overlay */}
      <div className={`right-panel ${rightPanelOpen ? "open" : ""}`} aria-hidden={!rightPanelOpen}>
        <div className="panel-header">
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>{rightPanelContent === "TIMETABLE" ? "My Timetable" : "School Calendar"}</h3>
            <div className="muted" style={{ fontSize: 13 }}>
              {rightPanelContent === "TIMETABLE" ? `${myTimetable.length} items` : ""}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => { if (rightPanelContent === "CALENDAR") changeMonth(-1); else setRightPanelContent("TIMETABLE"); }} className="btn" style={{ background: "#f3f4f6", color: "#111827" }} aria-label="Previous">◀</button>

            <button onClick={() => { if (rightPanelContent === "CALENDAR") changeMonth(1); else setRightPanelContent("CALENDAR"); }} className="btn" style={{ background: "#f3f4f6", color: "#111827" }} aria-label="Next">▶</button>

            <button onClick={closeRightPanel} className="btn" style={{ background: "#fff", fontSize: 18 }}>✕</button>
          </div>
        </div>

        <div style={{ padding: 16 }}>
          {/* TIMETABLE in right panel */}
          {rightPanelContent === "TIMETABLE" && (
            <>
              <div style={{ marginBottom: 10 }}>
                <strong className="muted">School-style grid (P1–P7 × MON–SAT)</strong>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="tt-table" role="table" aria-label="Timetable">
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
                        {DAY_KEYS.map((d) => (
                          <td key={`${d}_${p}`}>
                            {renderCellSubjectOnly(d, p)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* CALENDAR in right panel */}
          {rightPanelContent === "CALENDAR" && (
            <>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center", marginBottom: 10 }}>
                <button className="btn" onClick={() => changeMonth(-1)} style={{ background: "#f3f4f6" }}>◀</button>
                <div style={{ fontWeight: 700 }}>{currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}</div>
                <button className="btn" onClick={() => changeMonth(1)} style={{ background: "#f3f4f6" }}>▶</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                  <div key={d} style={{ textAlign: "center", fontWeight: 700 }}>{d}</div>
                ))}
              </div>

              <div className="calendar-grid">
                {days.map((date, idx) => {
                  const status = getDayStatus(date);
                  return (
                    <div key={idx} className="calendar-cell" style={{ background: getColor(status), boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.02)" }}>
                      <div style={{ fontWeight: 700 }}>{date ? date.getDate() : ""}</div>
                      {status && (
                        <div style={{ fontSize: 12, marginTop: 6, fontWeight: 700 }}>{status}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {!rightPanelContent && (
            <div className="muted">Open Timetable or Calendar using the buttons on the main page.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
