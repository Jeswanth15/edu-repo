// src/components/MarksEntryPage.jsx
import React, { useEffect, useState } from "react";
import {
  getAllExamSchedules,
  getStudentsBySchool,
  createMarks,
  getMarksBySubject,
  getAllMarks,
  updateMarks,
  deleteMarks,
} from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";
import {
  FaDatabase, FaEye, FaEyeSlash, FaEdit, FaSync,
  FaTrash, FaBook, FaUsers, FaCalendarAlt, FaBuilding
} from "react-icons/fa";

const MarksEntryPage = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [marksData, setMarksData] = useState([]);

  const [allMarks, setAllMarks] = useState([]);
  const [showAllMarks, setShowAllMarks] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAllExamSchedules();
        setExams(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!exams.length) return;
    const last = localStorage.getItem("selectedExamId");
    if (last) handleExamSelect(last);
  }, [exams]);

  const handleExamSelect = async (examId) => {
    if (!examId) {
      setSelectedExam(null);
      setStudents([]);
      setMarksData([]);
      localStorage.removeItem("selectedExamId");
      return;
    }

    localStorage.setItem("selectedExamId", examId);
    const examObj = exams.find((e) => String(e.examScheduleId) === String(examId));
    setSelectedExam(examObj || null);

    if (!examObj) return;

    setLoading(true);
    try {
      const studentRes = await getStudentsBySchool(schoolId);
      const classStudents = (studentRes.data || []).filter(
        (s) => s.classroomId === examObj.classroomId && s.approvalStatus === "APPROVED"
      );

      const marksRes = await getMarksBySubject(examObj.subjectId);
      const subjectMarks = marksRes.data || [];

      const existingMarks = subjectMarks.filter(
        (m) => String(m.examScheduleId) === String(examObj.examScheduleId)
      );

      const initial = classStudents.map((stu) => {
        const found = existingMarks.find((m) => String(m.studentId) === String(stu.userId));
        return {
          studentId: stu.userId,
          studentName: stu.name,
          marksId: found ? found.marksId : null,
          marksObtained: found ? String(found.marksObtained) : "",
          totalMarks: found ? String(found.totalMarks) : "",
        };
      });

      setStudents(classStudents);
      setMarksData(initial);
    } catch (err) {
      console.error(err);
      alert("Failed to load students/marks");
    }
    setLoading(false);
  };

  const updateMarksState = (index, field, value) => {
    setMarksData((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const submitMarks = async () => {
    if (!selectedExam) return alert("Select an exam first.");
    if (!marksData.length) return alert("No students found.");

    setLoading(true);
    try {
      const tasks = marksData.map((entry) => {
        const payload = {
          studentId: Number(entry.studentId),
          subjectId: selectedExam.subjectId,
          examScheduleId: selectedExam.examScheduleId,
          examType: selectedExam.examType || "Exam",
          marksObtained: entry.marksObtained === "" ? null : Number(entry.marksObtained),
          totalMarks: entry.totalMarks === "" ? null : Number(entry.totalMarks),
          examDate: selectedExam.examDate,
        };

        if (entry.marksId) return updateMarks(entry.marksId, payload);
        return createMarks(payload);
      });

      await Promise.all(tasks);
      alert("Marks saved successfully!");
      handleExamSelect(selectedExam.examScheduleId);
    } catch (err) {
      console.error(err);
      alert("Error saving marks");
    }
    setLoading(false);
  };

  const loadAllMarks = async () => {
    setLoading(true);
    try {
      const res = await getAllMarks();
      setAllMarks(res.data || []);
      setShowAllMarks(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load all marks");
    }
    setLoading(false);
  };

  const handleDelete = async (marksId) => {
    if (!marksId) return;
    if (!window.confirm("Delete this mark?")) return;

    setLoading(true);
    try {
      await deleteMarks(marksId);
      if (showAllMarks) {
        const res = await getAllMarks();
        setAllMarks(res.data || []);
      }
      if (selectedExam) handleExamSelect(selectedExam.examScheduleId);
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Marks & Results Entry</h1>
        <p style={styles.subtitle}>Enter and manage student performance data</p>
      </div>

      <div style={styles.actionHeader}>
        <div style={styles.badgeGroup}>
          <button className="modern-btn btn-outline" onClick={loadAllMarks} disabled={loading}>
            <FaDatabase /> Fetch All Records
          </button>
          <button
            className="modern-btn btn-outline"
            onClick={() => {
              setShowAllMarks((s) => !s);
              if (!showAllMarks && !allMarks.length) loadAllMarks();
            }}
          >
            {showAllMarks ? <FaEyeSlash /> : <FaEye />} {showAllMarks ? "Hide Global Entry" : "Show Global Entry"}
          </button>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div className="premium-card" style={styles.selectCard}>
          <h3 style={styles.sectionTitle}><FaEdit size={14} /> Subject Examination</h3>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Select Scheduled Exam</label>
            <select
              className="modern-input"
              value={selectedExam?.examScheduleId || ""}
              onChange={(e) => handleExamSelect(e.target.value)}
            >
              <option value="">-- Choose Exam Period --</option>
              {exams.map((ex) => (
                <option key={ex.examScheduleId} value={ex.examScheduleId}>
                  {ex.subjectName} • {ex.classroomName} • {new Date(ex.examDate).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {selectedExam && (
            <div style={styles.examBadgeGrid}>
              <div style={styles.examInfoItem}>
                <FaBook style={styles.infoIcon} />
                <span>{selectedExam.subjectName}</span>
              </div>
              <div style={styles.examInfoItem}>
                <FaUsers style={styles.infoIcon} />
                <span>{selectedExam.classroomName}</span>
              </div>
              <div style={styles.examInfoItem}>
                <FaCalendarAlt style={styles.infoIcon} />
                <span>{new Date(selectedExam.examDate).toLocaleDateString()}</span>
              </div>
              {selectedExam.roomNo && (
                <div style={styles.examInfoItem}>
                  <FaBuilding style={styles.infoIcon} />
                  <span>Room {selectedExam.roomNo}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedExam && (
          <div className="premium-card" style={styles.tableCard}>
            <div style={styles.cardHeader}>
              <h3 style={styles.tableTitle}>Student Performance List</h3>
              <div style={styles.headerButtons}>
                <button className="modern-btn btn-primary" onClick={submitMarks} disabled={loading || !students.length}>
                  {loading ? "Saving..." : "Commit Marks"}
                </button>
                <button className="modern-btn btn-outline" onClick={() => handleExamSelect(selectedExam.examScheduleId)}>
                  <FaSync />
                </button>
              </div>
            </div>

            {loading ? (
              <div style={styles.loading}>Synchronizing records...</div>
            ) : students.length === 0 ? (
              <div style={styles.empty}>No approved students found for this classroom.</div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Student Name</th>
                      <th style={styles.th}>Obtained</th>
                      <th style={styles.th}>Total Base</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marksData.map((m, i) => (
                      <tr key={m.studentId} style={styles.tr}>
                        <td style={styles.tdNum}>{i + 1}</td>
                        <td style={styles.td}>
                          <div style={styles.studentCell}>
                            <div style={styles.avatarMini}>{m.studentName.charAt(0)}</div>
                            <span style={styles.studentNameText}>{m.studentName}</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            className="modern-input"
                            style={styles.marksInput}
                            value={m.marksObtained}
                            onChange={(e) => updateMarksState(i, "marksObtained", e.target.value)}
                            placeholder="Marks"
                          />
                        </td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            className="modern-input"
                            style={styles.marksInput}
                            value={m.totalMarks}
                            onChange={(e) => updateMarksState(i, "totalMarks", e.target.value)}
                            placeholder="Total"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {showAllMarks && (
          <div className="premium-card" style={styles.allMarksCard}>
            <div style={styles.cardHeader}>
              <h3 style={styles.tableTitle}>Global Examination Records</h3>
              <button className="modern-btn btn-outline" onClick={() => setShowAllMarks(false)}>Dismiss</button>
            </div>
            {allMarks.length === 0 ? (
              <div style={styles.empty}>No marks indexed in the global database.</div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Ref</th>
                      <th style={styles.th}>Student</th>
                      <th style={styles.th}>Subject</th>
                      <th style={styles.th}>Score</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMarks.map((m) => (
                      <tr key={m.marksId} style={styles.tr}>
                        <td style={styles.tdMuted}>#{m.marksId}</td>
                        <td style={styles.tdStrong}>{m.studentName}</td>
                        <td style={styles.td}>{m.subjectName}</td>
                        <td style={styles.td}>{m.marksObtained} / {m.totalMarks}</td>
                        <td style={styles.td}>{new Date(m.examDate).toLocaleDateString()}</td>
                        <td style={styles.td}>
                          <button style={styles.deleteBtn} onClick={() => handleDelete(m.marksId)}>
                            <FaTrash size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
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
    marginBottom: "32px",
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
  actionHeader: {
    marginBottom: "32px",
    display: "flex",
    justifyContent: "flex-end",
  },
  badgeGroup: {
    display: "flex",
    gap: "12px",
  },
  mainGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },
  selectCard: {
    padding: "32px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "var(--text-primary)",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "12px",
  },
  inputGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    letterSpacing: "0.5px",
    marginBottom: "8px",
  },
  examBadgeGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "12px",
  },
  examInfoItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "var(--background-color)",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--primary-color)",
    border: "1px solid var(--border-color)",
  },
  infoIcon: {
    fontSize: "14px",
    opacity: 0.7,
  },
  tableCard: {
    padding: "0",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "24px",
    backgroundColor: "rgba(0,0,0,0.01)",
    borderBottom: "1px solid var(--border-color)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tableTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
  },
  headerButtons: {
    display: "flex",
    gap: "12px",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "16px 24px",
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-muted)",
    borderBottom: "1px solid var(--border-color)",
    backgroundColor: "var(--background-color)",
  },
  tr: {
    borderBottom: "1px solid var(--border-color)",
    transition: "background-color 0.2s",
  },
  td: {
    padding: "16px 24px",
    fontSize: "14px",
    verticalAlign: "middle",
  },
  tdNum: {
    padding: "16px 24px",
    fontSize: "13px",
    color: "var(--text-muted)",
    textAlign: "center",
  },
  studentCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatarMini: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "var(--border-color)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
    color: "var(--text-secondary)",
  },
  studentNameText: {
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  marksInput: {
    width: "100px",
    textAlign: "center",
    backgroundColor: "white",
  },
  allMarksCard: {
    padding: "0",
  },
  tdStrong: {
    padding: "16px 24px",
    fontWeight: "600",
    color: "var(--primary-color)",
  },
  tdMuted: {
    padding: "16px 24px",
    fontSize: "12px",
    color: "var(--text-muted)",
  },
  deleteBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "var(--error-color)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  loading: {
    padding: "40px",
    textAlign: "center",
    color: "var(--text-muted)",
  },
  empty: {
    padding: "40px",
    textAlign: "center",
    color: "var(--text-muted)",
  }
};

export default MarksEntryPage;
