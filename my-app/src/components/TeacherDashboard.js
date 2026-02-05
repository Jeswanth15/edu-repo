// src/components/TeacherDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDecodedToken } from "../utils/authHelper";
import {
  getAnnouncementsBySchool,
  getAllClassSubjects,
  createAnnouncement,
  getAllTimetables,
  getCalendarBySchool,
} from "../utils/api";
import { FaBullhorn, FaPlus, FaTable, FaCalendarAlt, FaClock, FaBook, FaBuilding } from "react-icons/fa";

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

  // Right Panel States
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelContent, setRightPanelContent] = useState(null);

  // Constants
  const DAY_KEYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const MAX_PERIODS = 7;

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
        setTimeout(() => setLoading(false), 600);
      }
    };

    if (teacherId && schoolId) loadEverything();
  }, [teacherId, schoolId]);

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

  const loadCalendar = async () => {
    try {
      const res = await getCalendarBySchool(schoolId);
      setCalendar(res.data || []);
    } catch (err) {
      console.error(err);
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
    const firstDayIndex = startOfMonth.getDay();
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
      const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      days.push(d);
    }
    return days;
  };

  const getDayStatus = (date) => {
    if (!date) return null;
    const dateStr = date.toISOString().split("T")[0];
    const entry = calendar.find((c) => c.date === dateStr);
    return entry?.status || null;
  };

  const getColor = (status) => {
    switch (status) {
      case "HOLIDAY": return "rgba(239, 68, 68, 0.1)";
      case "HALF_DAY": return "rgba(245, 158, 11, 0.1)";
      case "SUNDAY": return "rgba(107, 114, 128, 0.1)";
      case "WORKING": return "rgba(16, 185, 129, 0.1)";
      default: return "transparent";
    }
  };

  const getStatusBorder = (status) => {
    switch (status) {
      case "HOLIDAY": return "#ef4444";
      case "HALF_DAY": return "#f59e0b";
      case "SUNDAY": return "#6b7280";
      case "WORKING": return "#10b981";
      default: return "var(--border-color)";
    }
  };

  const openRightPanel = (content) => {
    setRightPanelContent(content);
    if (content === "CALENDAR") loadCalendar();
    setRightPanelOpen(true);
  };

  const closeRightPanel = () => setRightPanelOpen(false);

  const timetableMap = {};
  myTimetable.forEach((t) => {
    let day = t.dayOfWeek ? String(t.dayOfWeek).toUpperCase() : "";
    if (day.startsWith("MON")) day = "MON";
    else if (day.startsWith("TUE")) day = "TUE";
    else if (day.startsWith("WED")) day = "WED";
    else if (day.startsWith("THU")) day = "THU";
    else if (day.startsWith("FRI")) day = "FRI";
    else if (day.startsWith("SAT")) day = "SAT";

    const key = `${day}_${Number(t.periodNumber)}`;
    timetableMap[key] = t;
  });

  const getSubjectName = (entry) => {
    if (!entry) return "-";
    let sn = entry.subjectName || entry.subject || null;
    if (!sn) {
      const cls = myClasses.find(c => c.subjectId === entry.subjectId);
      sn = cls?.subjectName || `Subject ${entry.subjectId}`;
    }
    return sn;
  };

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div className="spinner"></div>
        <p style={{ marginTop: "20px", color: "var(--text-secondary)", fontWeight: "500" }}>
          Curating your academic workspace...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Teacher Workspace</h1>
          <div style={styles.schoolTag}>
            <FaBuilding style={{ marginRight: "8px" }} />
            {schoolName}
          </div>
        </div>
        <div style={styles.headerActions}>
          <button className="modern-btn btn-outline" onClick={() => openRightPanel("TIMETABLE")}>
            <FaTable /> Timetable
          </button>
          <button className="modern-btn btn-primary" onClick={() => openRightPanel("CALENDAR")}>
            <FaCalendarAlt /> Calendar
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.main}>
          <div className="premium-card" style={styles.formCard}>
            <h3 style={styles.cardSectionTitle}><FaPlus size={14} /> New Announcement</h3>
            <div style={styles.form}>
              <input
                className="modern-input"
                placeholder="Subject or Title"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              />
              <textarea
                className="modern-input"
                placeholder="Share an update with your students..."
                rows={3}
                style={{ resize: "none" }}
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
              />
              <div style={styles.formFooter}>
                <div style={{ flex: 1, position: "relative" }}>
                  <select
                    className="modern-input"
                    style={{ width: "100%", margin: 0, paddingRight: "30px" }}
                    value={newAnnouncement.classroomId}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, classroomId: e.target.value })}
                  >
                    <option value="">Broadcast to School</option>
                    {myClasses.map((cls) => (
                      <option key={cls.id} value={cls.classroomId}>
                        {cls.classroomName} - {cls.subjectName}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="modern-btn btn-primary" onClick={handleCreateAnnouncement}>
                  <FaBullhorn /> Post
                </button>
              </div>
            </div>
          </div>

          <div style={styles.feed}>
            <div style={styles.feedHeader}>
              <h3 style={styles.feedTitle}><FaBullhorn /> Recent Activity</h3>
              <span style={styles.feedCount}>{announcements.length} Posts</span>
            </div>
            {announcements.length === 0 ? (
              <div className="premium-card" style={styles.emptyFeed}>
                <FaBullhorn size={40} style={{ opacity: 0.1, marginBottom: "16px" }} />
                <p>No announcements yet. Start the conversation!</p>
              </div>
            ) : (
              announcements.map((a) => (
                <div className="premium-card" key={a.announcementId} style={styles.feedCard}>
                  <div style={styles.feedCardHeader}>
                    <h4 style={styles.feedCardTitle}>{a.title}</h4>
                    {a.classroomId ? (
                      <span style={styles.classBadge}>
                        {myClasses.find(c => c.classroomId === a.classroomId)?.classroomName || "Class"}
                      </span>
                    ) : (
                      <span style={styles.schoolBadge}>School Wide</span>
                    )}
                  </div>
                  <p style={styles.feedCardMsg}>{a.message}</p>
                  <div style={styles.feedCardFooter}>
                    <div style={styles.footerInfo}>
                      <FaClock size={12} />
                      {new Date(a.postedAt).toLocaleDateString()} at {new Date(a.postedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={styles.side}>
          <div className="premium-card" style={styles.classesCard}>
            <h3 style={styles.cardSectionTitle}><FaBook size={14} /> Academic Load</h3>
            <p style={styles.sideSubtitle}>Active Subjects & Classes</p>
            <div style={styles.classList}>
              {myClasses.length === 0 ? (
                <div style={styles.emptyState}>No classes assigned.</div>
              ) : (
                myClasses.map((cs) => (
                  <div
                    key={cs.id}
                    style={styles.classItem}
                    onClick={() => navigate(`/teacher/attendance/${cs.classroomId}/${cs.subjectId}`)}
                  >
                    <div style={styles.classIcon}>
                      {cs.subjectName.charAt(0)}
                    </div>
                    <div style={styles.classContent}>
                      <div style={styles.className}>{cs.classroomName}</div>
                      <div style={styles.subjectName}>{cs.subjectName}</div>
                    </div>
                    <div style={styles.classArrow}>→</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="premium-card" style={styles.quickAccessCard}>
            <h3 style={styles.cardSectionTitle}>Quick Actions</h3>
            <div style={styles.actionGrid}>
              <button style={styles.actionItem} onClick={() => navigate("/assignments")}>
                <div style={{ ...styles.actionIcon, background: "rgba(30, 136, 229, 0.1)", color: "var(--primary-color)" }}>A</div>
                <span>Assignments</span>
              </button>
              <button style={styles.actionItem} onClick={() => navigate("/marks")}>
                <div style={{ ...styles.actionIcon, background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>M</div>
                <span>Marks Entry</span>
              </button>
              <button style={styles.actionItem} onClick={() => navigate("/attendance")}>
                <div style={{ ...styles.actionIcon, background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>T</div>
                <span>Attendance</span>
              </button>
              <button style={styles.actionItem} onClick={() => navigate("/syllabus")}>
                <div style={{ ...styles.actionIcon, background: "rgba(124, 58, 237, 0.1)", color: "#7c3aed" }}>S</div>
                <span>Syllabus</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {rightPanelOpen && (
        <>
          <div style={styles.drawerBackdrop} onClick={closeRightPanel} />
          <div style={{
            ...styles.rightDrawer,
            transform: rightPanelOpen ? "translateX(0)" : "translateX(100%)",
            opacity: rightPanelOpen ? 1 : 0
          }}>
            <div style={styles.drawerHeader}>
              <h3 style={styles.drawerTitle}>
                {rightPanelContent === "TIMETABLE" ? "Academic Schedule" : "School Events"}
              </h3>
              <button className="modern-btn" style={styles.closeBtn} onClick={closeRightPanel}>✕</button>
            </div>

            <div style={styles.drawerBody}>
              {rightPanelContent === "TIMETABLE" && (
                <div style={styles.ttWrapper}>
                  <table style={styles.ttTable}>
                    <thead>
                      <tr>
                        <th style={styles.ttTh}>Slot</th>
                        {DAY_KEYS.map(d => <th key={d} style={styles.ttTh}>{d}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: MAX_PERIODS }, (_, i) => i + 1).map(p => (
                        <tr key={p}>
                          <td style={styles.ttTdPeriod}>P{p}</td>
                          {DAY_KEYS.map(d => (
                            <td key={`${d}_${p}`} style={styles.ttTd}>
                              <div style={styles.ttCellContent}>
                                {getSubjectName(timetableMap[`${d}_${p}`])}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {rightPanelContent === "CALENDAR" && (
                <div>
                  <div style={styles.calNav}>
                    <button className="modern-btn btn-outline" onClick={() => changeMonth(-1)}>◀</button>
                    <span style={styles.calMonthName}>
                      {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                    </span>
                    <button className="modern-btn btn-outline" onClick={() => changeMonth(1)}>▶</button>
                  </div>

                  <div style={styles.calGrid}>
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={i} style={styles.calDayHeader}>{d}</div>
                    ))}
                    {getCalendarDays().map((date, idx) => {
                      const status = getDayStatus(date);
                      return (
                        <div key={idx} style={{
                          ...styles.calCell,
                          background: getColor(status),
                          borderColor: getStatusBorder(status)
                        }}>
                          <span style={{
                            ...styles.calDateNum,
                            color: date?.getMonth() !== currentMonth.getMonth() ? "var(--text-muted)" : "var(--text-primary)"
                          }}>{date?.getDate()}</span>
                          {status && status !== "WORKING" && (
                            <span style={{ ...styles.calStatusLabel, color: getStatusBorder(status) }}>
                              {status.split("_")[0]}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    paddingBottom: "40px",
  },
  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    marginBottom: "8px",
    letterSpacing: "-0.5px",
  },
  schoolTag: {
    display: "flex",
    alignItems: "center",
    color: "var(--primary-color)",
    fontSize: "15px",
    fontWeight: "600",
    opacity: 0.9,
  },
  headerActions: {
    display: "flex",
    gap: "12px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: "32px",
  },
  cardSectionTitle: {
    fontSize: "14px",
    fontWeight: "700",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "12px",
  },
  formCard: {
    padding: "24px",
    marginBottom: "32px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formFooter: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  feedHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    padding: "0 4px",
  },
  feedTitle: {
    fontSize: "20px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "var(--text-primary)",
    margin: 0,
  },
  feedCount: {
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text-muted)",
    backgroundColor: "var(--background-color)",
    padding: "4px 10px",
    borderRadius: "20px",
  },
  feed: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  feedCard: {
    padding: "24px",
    border: "1px solid var(--border-color)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  feedCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  feedCardTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--text-primary)",
  },
  classBadge: {
    fontSize: "11px",
    fontWeight: "700",
    backgroundColor: "rgba(30, 136, 229, 0.1)",
    color: "var(--primary-color)",
    padding: "4px 10px",
    borderRadius: "12px",
  },
  schoolBadge: {
    fontSize: "11px",
    fontWeight: "700",
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    color: "var(--text-secondary)",
    padding: "4px 10px",
    borderRadius: "12px",
  },
  feedCardMsg: {
    fontSize: "15px",
    color: "var(--text-secondary)",
    lineHeight: "1.6",
    marginBottom: "20px",
  },
  feedCardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "16px",
    borderTop: "1px solid var(--border-color)",
  },
  footerInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "var(--text-muted)",
    fontWeight: "500",
  },
  sideSubtitle: {
    fontSize: "13px",
    color: "var(--text-muted)",
    marginTop: "-16px",
    marginBottom: "20px",
  },
  classesCard: {
    padding: "24px",
    marginBottom: "24px",
  },
  classList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  classItem: {
    display: "flex",
    alignItems: "center",
    padding: "12px",
    backgroundColor: "var(--background-color)",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid transparent",
  },
  classIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    backgroundColor: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--primary-color)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  classContent: {
    flex: 1,
    marginLeft: "16px",
  },
  className: {
    fontWeight: "700",
    fontSize: "14px",
    color: "var(--text-primary)",
  },
  subjectName: {
    fontSize: "12px",
    color: "var(--text-muted)",
  },
  classArrow: {
    color: "var(--text-muted)",
    opacity: 0.5,
    fontSize: "18px",
  },
  quickAccessCard: {
    padding: "24px",
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  actionItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "16px",
    borderRadius: "12px",
    background: "var(--background-color)",
    border: "none",
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  actionIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "800",
  },
  emptyFeed: {
    padding: "60px 40px",
    textAlign: "center",
    color: "var(--text-muted)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  emptyState: {
    textAlign: "center",
    color: "var(--text-muted)",
    padding: "20px",
    fontSize: "14px",
  },
  drawerBackdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(4px)",
    zIndex: 1400,
  },
  rightDrawer: {
    position: "fixed",
    top: 0,
    right: 0,
    width: "600px",
    height: "100vh",
    backgroundColor: "var(--surface-color)",
    boxShadow: "-15px 0 45px rgba(0,0,0,0.15)",
    zIndex: 1500,
    padding: "40px",
    overflowY: "auto",
    transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s",
  },
  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "20px",
  },
  drawerTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
  },
  closeBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "var(--background-color)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    cursor: "pointer",
  },
  ttTable: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "4px",
  },
  ttTh: {
    textAlign: "center",
    padding: "16px 8px",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    letterSpacing: "1px",
  },
  ttTd: {
    padding: "4px",
    width: "14%",
  },
  ttCellContent: {
    padding: "12px 8px",
    backgroundColor: "var(--background-color)",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    textAlign: "center",
    minHeight: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-secondary)",
  },
  ttTdPeriod: {
    fontWeight: "800",
    color: "var(--primary-color)",
    padding: "16px 8px",
    fontSize: "14px",
    textAlign: "center",
  },
  calNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "32px",
    marginBottom: "32px",
  },
  calMonthName: {
    fontSize: "20px",
    fontWeight: "700",
    minWidth: "180px",
    textAlign: "center",
  },
  calGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "10px",
  },
  calDayHeader: {
    textAlign: "center",
    padding: "12px",
    fontSize: "12px",
    fontWeight: "800",
    color: "var(--text-muted)",
  },
  calCell: {
    height: "90px",
    padding: "10px",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    border: "2px solid transparent",
    transition: "transform 0.2s",
  },
  calDateNum: {
    fontWeight: "800",
    fontSize: "16px",
  },
  calStatusLabel: {
    fontSize: "10px",
    fontWeight: "800",
    textAlign: "right",
    textTransform: "uppercase",
  }
};

export default TeacherDashboard;
