// src/components/MarksEntryPage.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
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

  // load exams on mount
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

  // restore last selected exam (optional)
  useEffect(() => {
    if (!exams.length) return;
    const last = localStorage.getItem("selectedExamId");
    if (last) handleExamSelect(last);
  }, [exams]);

  // select exam and load students + existing marks
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
      // students of the class
      const studentRes = await getStudentsBySchool(schoolId);
      const classStudents = (studentRes.data || []).filter(
        (s) => s.classroomId === examObj.classroomId && s.approvalStatus === "APPROVED"
      );

      // existing marks for this subject
      const marksRes = await getMarksBySubject(examObj.subjectId);
      const subjectMarks = marksRes.data || [];

      // filter only marks for this examScheduleId (if backend stores examScheduleId)
      const existingMarks = subjectMarks.filter(
        (m) => String(m.examScheduleId) === String(examObj.examScheduleId)
      );

      // build marksData aligned to students
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
      alert("Failed to load students/marks. See console.");
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
    if (!marksData.length) return alert("No students to save marks for.");

    // basic validation: ensure numeric or blank
    for (const m of marksData) {
      if (m.marksObtained !== "" && isNaN(Number(m.marksObtained)))
        return alert(`Marks for ${m.studentName} must be numeric or empty.`);
      if (m.totalMarks !== "" && isNaN(Number(m.totalMarks)))
        return alert(`Total marks for ${m.studentName} must be numeric or empty.`);
    }

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
      // refresh local data
      handleExamSelect(selectedExam.examScheduleId);
    } catch (err) {
      console.error(err);
      alert("Error saving marks. Check console.");
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
      alert("Deleted successfully");
      // refresh list if open
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

  // small helper to show badges
  const badge = (txt) => <span style={{ background: "#eef6ff", color: "#0a4275", padding: "4px 8px", borderRadius: 6, fontSize: 12 }}>{txt}</span>;

  return (
    <div className="marks-page">
      <Sidebar />
      <div className="marks-main">
        <Navbar />
        <div className="marks-wrapper">

          <header className="marks-header">
            <h2>Marks Entry</h2>
            <div className="marks-actions">
              <button className="small" onClick={loadAllMarks} disabled={loading}>
                {loading ? "Loading..." : "Get All Marks"}
              </button>
              <button
                className="small secondary"
                onClick={() => {
                  setShowAllMarks((s) => !s);
                  if (!showAllMarks && !allMarks.length) loadAllMarks();
                }}
              >
                {showAllMarks ? "Hide All" : "Show All"}
              </button>
            </div>
          </header>

          {/* SELECT EXAM */}
          <section className="card select-card">
            <label style={{ fontWeight: 600 }}>Select Exam</label>
            <select
              value={selectedExam?.examScheduleId || ""}
              onChange={(e) => handleExamSelect(e.target.value)}
              className="full-input"
            >
              <option value="">-- Select Exam --</option>
              {exams.map((ex) => (
                <option key={ex.examScheduleId} value={ex.examScheduleId}>
                  {ex.subjectName} • {ex.classroomName} • {ex.examDate}
                </option>
              ))}
            </select>

            {selectedExam && (
              <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {badge(selectedExam.subjectName)}
                {badge(selectedExam.classroomName)}
                {badge(selectedExam.examDate)}
                {selectedExam.roomNo && <span style={{ fontSize: 13, color: "#666" }}>Room: {selectedExam.roomNo}</span>}
              </div>
            )}
          </section>

          {/* MARKS TABLE */}
          {selectedExam && (
            <section className="card marks-card">
              <h3>Students — {selectedExam.classroomName} • {selectedExam.subjectName}</h3>

              {loading ? (
                <div style={{ padding: 20 }}>Loading students/marks…</div>
              ) : students.length === 0 ? (
                <div style={{ padding: 20, color: "#666" }}>No students found for this class.</div>
              ) : (
                <div className="table-wrap">
                  <table className="styled-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Student</th>
                        <th style={{ width: 120 }}>Marks</th>
                        <th style={{ width: 120 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marksData.map((m, i) => (
                        <tr key={m.studentId}>
                          <td style={{ textAlign: "center" }}>{i + 1}</td>
                          <td>{m.studentName}</td>
                          <td>
                            <input
                              type="number"
                              value={m.marksObtained}
                              onChange={(e) => updateMarksState(i, "marksObtained", e.target.value)}
                              className="small-input"
                              placeholder="e.g., 45"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={m.totalMarks}
                              onChange={(e) => updateMarksState(i, "totalMarks", e.target.value)}
                              className="small-input"
                              placeholder="e.g., 50"
                            />
                          </td>
                          
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <button className="btn primary" onClick={submitMarks} disabled={loading || !students.length}>
                  {loading ? "Saving…" : "Save Marks"}
                </button>
                <button
                  className="btn outline"
                  onClick={() => {
                    // reset form (keep selected exam)
                    handleExamSelect(selectedExam.examScheduleId);
                  }}
                >
                  Reset
                </button>
              </div>
            </section>
          )}

          {/* ALL MARKS PANEL */}
          {showAllMarks && (
            <section className="card all-marks-card">
              <h3>All Marks</h3>
              {allMarks.length === 0 ? (
                <div style={{ padding: 12, color: "#666" }}>No marks available.</div>
              ) : (
                <div className="table-wrap">
                  <table className="styled-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Student</th>
                        <th>Subject</th>
                        <th>Exam ID</th>
                        <th>Marks</th>
                        <th>Total</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allMarks.map((m) => (
                        <tr key={m.marksId}>
                          <td>{m.marksId}</td>
                          <td>{m.studentName}</td>
                          <td>{m.subjectName}</td>
                          <td>{m.examScheduleId}</td>
                          <td>{m.marksObtained}</td>
                          <td>{m.totalMarks}</td>
                          <td>{m.examDate}</td>
                          <td>
                            <button className="small red" onClick={() => handleDelete(m.marksId)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <button className="btn outline" onClick={() => setShowAllMarks(false)}>Close</button>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Inline styles (component-scoped) */}
      <style>{`
        :root {
          --primary: #0a4275;
          --accent: #007bff;
          --success: #28a745;
          --danger: #dc3545;
          --surface: #f3f6f9;
          --card: #fff;
          --muted: #7a7a7a;
        }

        .marks-page { display: flex; }
        .marks-main { flex: 1; background: var(--surface); min-height: 100vh; }
        .marks-wrapper { max-width: 1100px; margin: 22px auto; padding: 0 18px 60px; }

        .marks-header { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 18px; }
        .marks-header h2 { margin: 0; color: var(--primary); }
        .marks-actions { display: flex; gap: 8px; }

        .card { background: var(--card); border-radius: 12px; padding: 16px; box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04); }

        .select-card { margin-bottom: 16px; }
        .marks-card { margin-bottom: 18px; }

        label { display: block; font-weight: 600; margin-bottom: 6px; color: #222; }

        .full-input { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd; background: white; }

        .table-wrap { overflow-x: auto; margin-top: 12px; }
        .styled-table { width: 100%; border-collapse: collapse; min-width: 720px; }
        .styled-table thead tr { background: #f4f6fb; color: #111; }
        .styled-table th, .styled-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #eee; }
        .styled-table tbody tr:hover { background: #fbfcff; }

        .small-input { width: 90px; padding: 8px; border-radius: 6px; border: 1px solid #ddd; }

        .btn { padding: 10px 14px; border-radius: 8px; border: none; cursor: pointer; font-weight: 700; }
        .btn.primary { background: var(--accent); color: white; }
        .btn.outline { background: transparent; border: 1px solid #ccc; color: #333; }

        .small { padding: 8px 10px; border-radius: 8px; border: none; background: var(--primary); color: white; cursor: pointer; font-weight: 600; }
        .small.secondary { background: #5a98d6; }
        .small.red { background: var(--danger); color: white; padding: 6px 10px; border-radius: 8px; border: none; cursor: pointer; }

        .muted { color: var(--muted); }

        /* responsive */
        @media (max-width: 980px) {
          .styled-table { min-width: 680px; }
        }
        @media (max-width: 720px) {
          .marks-wrapper { padding: 0 12px 60px; }
          .styled-table { min-width: 560px; font-size: 13px; }
          .small-input { width: 72px; }
        }
        @media (max-width: 480px) {
          .styled-table { min-width: 480px; font-size: 13px; }
          .marks-header { flex-direction: column; align-items: flex-start; gap: 12px; }
        }
      `}</style>
    </div>
  );
};

export default MarksEntryPage;
