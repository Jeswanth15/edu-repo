import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import {
  getAllClassrooms,
  getAllTimetables,
  getAllEnrollments,
  getAllClassSubjects,
  getCalendarBySchool,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceByClassDatePeriod,
} from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

const Attendance = ({ isTeacher = false }) => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  // params pre-selection logic kept in your original version if needed (you can pass in props)
  const [classrooms, setClassrooms] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);

  const [selectedClassId, setSelectedClassId] = useState(isTeacher ? null : null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(isTeacher ? null : null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  const [calendarStatus, setCalendarStatus] = useState(null);
  const [calendarEntryId, setCalendarEntryId] = useState(null);

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [alreadyMarked, setAlreadyMarked] = useState({});
  const [loading, setLoading] = useState(false);
  const [studentFetchError, setStudentFetchError] = useState("");

  // small UI state
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [selectAll, setSelectAll] = useState(false);

  // helpers: day short
  const getDayShort = (date) => {
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return days[new Date(date).getDay()];
  };

  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      setLoading(true);
      try {
        const [cRes, tRes, csRes] = await Promise.all([
          getAllClassrooms(schoolId),
          getAllTimetables(),
          getAllClassSubjects(),
        ]);
        setClassrooms(cRes.data || []);
        setTimetables(tRes.data || []);
        setClassSubjects(csRes.data || []);
      } catch (err) {
        console.error("Initial load error", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [schoolId]);

  // derived: classSubjects for selected class
  const classSubjectsForClass = () =>
    classSubjects.filter((cs) => cs.classroomId === selectedClassId);

  // available periods for subject based on timetable/day
  const availablePeriodsForSubject = () => {
    if (!selectedClassId || !selectedSubjectId || !selectedDate) return [];

    const day = getDayShort(selectedDate);

    return timetables
      .filter(
        (t) =>
          t.classroomId === selectedClassId &&
          t.subjectId === selectedSubjectId &&
          t.dayOfWeek.substring(0, 3).toUpperCase() === day
      )
      .map((t) => t.periodNumber)
      .sort((a, b) => a - b);
  };

  useEffect(() => {
    const p = availablePeriodsForSubject();
    setSelectedPeriod(p.length > 0 ? p[0] : null);
  }, [selectedSubjectId, selectedDate, timetables]);

  // check calendar
  const checkCalendarForDate = async (date) => {
    if (!date) {
      setCalendarStatus(null);
      setCalendarEntryId(null);
      return;
    }
    try {
      const res = await getCalendarBySchool(schoolId);
      const entries = res.data || [];
      const found = entries.find((e) => e.date.split("T")[0] === date);
      if (found) {
        setCalendarStatus(found.status);
        setCalendarEntryId(found.calendarId);
      } else {
        setCalendarStatus("WORKING");
        setCalendarEntryId(null);
      }
    } catch (err) {
      console.error("Calendar check error", err);
      setCalendarStatus(null);
      setCalendarEntryId(null);
    }
  };

  // fetch attendance & students
  const fetchAttendanceForPeriod = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedDate || !selectedPeriod) {
      setStudents([]);
      setAttendanceMap({});
      setAlreadyMarked({});
      return;
    }

    setLoading(true);
    setStudentFetchError("");
    try {
      await checkCalendarForDate(selectedDate);

      const enrollRes = await getAllEnrollments();
      const filtered = (enrollRes.data || []).filter(
        (en) => en.classroomId === selectedClassId
      );

      // Map students
      const studentList = filtered.map((s) => ({
        studentId: s.studentId,
        name: s.studentName,
      }));

      setStudents(studentList);

      // Attendance fetch
      const attRes = await getAttendanceByClassDatePeriod(
        selectedClassId,
        selectedSubjectId,
        selectedDate,
        selectedPeriod
      );

      const existing = attRes.data || [];

      const map = {};
      const markers = {};

      studentList.forEach((stu) => {
        const match = existing.find((a) => a.studentId === stu.studentId);
        if (match) {
          map[stu.studentId] = {
            status: match.status === "ABSENT" ? "ABSENT" : "PRESENT",
            attendanceId: match.attendanceId,
          };
          markers[stu.studentId] = true;
        } else {
          map[stu.studentId] = { status: "PRESENT", attendanceId: null };
        }
      });

      setAttendanceMap(map);
      setAlreadyMarked(markers);
      setSelectAll(studentList.length > 0 && studentList.every(s => map[s.studentId].status === "PRESENT"));
    } catch (err) {
      console.error("Fetch attendance error", err);
      setStudentFetchError("Failed to fetch students/attendance");
      setStudents([]);
      setAttendanceMap({});
      setAlreadyMarked({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceForPeriod();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, selectedSubjectId, selectedDate, selectedPeriod]);

  // set single student's status
  const setStudentStatus = (studentId, status) => {
    setAttendanceMap((prev) => {
      const next = {
        ...prev,
        [studentId]: { ...(prev[studentId] || {}), status },
      };
      setSelectAll(
        students.length > 0 && students.every(s => next[s.studentId]?.status === "PRESENT")
      );
      return next;
    });
  };

  // select/unselect all (toggle)
  const toggleSelectAll = () => {
    const newVal = !selectAll;
    setSelectAll(newVal);
    setAttendanceMap((prev) => {
      const copy = { ...prev };
      students.forEach((s) => {
        copy[s.studentId] = { ...(copy[s.studentId] || {}), status: newVal ? "PRESENT" : "ABSENT" };
      });
      return copy;
    });
  };

  // save attendance (create or update)
  const submitAttendanceHandler = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedDate || !selectedPeriod) {
      alert("Please select Class, Subject, Date and Period");
      return;
    }

    setLoading(true);
    try {
      const ops = students.map((stu) => {
        const info = attendanceMap[stu.studentId] || { status: "PRESENT", attendanceId: null };
        const payload = {
          studentId: stu.studentId,
          classroomId: selectedClassId,
          subjectId: selectedSubjectId,
          calendarId: calendarEntryId,
          date: selectedDate,
          periodNumber: selectedPeriod,
          status: info.status,
        };
        return info.attendanceId
          ? updateAttendance(info.attendanceId, payload)
          : createAttendance(payload);
      });

      await Promise.all(ops);
      await fetchAttendanceForPeriod();
      alert("Attendance saved successfully");
    } catch (err) {
      console.error("Save attendance error", err);
      alert("Failed to save attendance");
    } finally {
      setLoading(false);
    }
  };

  // delete single attendance record
  const handleDelete = async (studentId) => {
    const info = attendanceMap[studentId];
    if (!info?.attendanceId) return;

    if (!window.confirm("Delete this attendance record?")) return;

    setLoading(true);
    try {
      await deleteAttendance(info.attendanceId);
      await fetchAttendanceForPeriod();
    } catch (err) {
      console.error("Delete attendance error", err);
      alert("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  // summary counts
  const presentCount = students.filter((s) => attendanceMap[s.studentId]?.status === "PRESENT").length;
  const absentCount = students.filter((s) => attendanceMap[s.studentId]?.status === "ABSENT").length;

  // color for row
  const rowColor = (studentId) => {
    const info = attendanceMap[studentId] || {};
    if (info.status === "ABSENT") return "#fff1f0";
    if (alreadyMarked[studentId]) return "#f7fff7";
    return "white";
  };

  // small helper to display subject name from id
  const subjectNameFromId = (id) => {
    const cs = classSubjects.find((c) => c.subjectId === id);
    return cs?.subjectName || "";
  };

  return (
    <div className="att-page">
      <Sidebar />

      <div className="att-content">
        <Navbar />

        <div className="att-wrapper">
          <h2 className="att-title">Attendance</h2>

          <div className="att-grid">
            {/* LEFT FILTER PANE */}
            <aside className={`att-filters ${filtersOpen ? "open" : "closed"}`}>
              <div className="filters-header">
                <strong>Filters</strong>
                <button className="filters-toggle" onClick={() => setFiltersOpen(p => !p)}>
                  {filtersOpen ? "Close" : "Open"}
                </button>
              </div>

              <div className="filter-row">
                <label>Class</label>
                <select
                  value={selectedClassId || ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setSelectedClassId(val);
                    // reset dependant fields
                    setSelectedSubjectId(null);
                    setSelectedDate("");
                    setSelectedPeriod(null);
                    setStudents([]);
                    setAttendanceMap({});
                    setAlreadyMarked({});
                  }}
                >
                  <option value="">-- Select class --</option>
                  {classrooms.map((c) => (
                    <option key={c.classId} value={c.classId}>
                      {c.name} {c.section ? `- ${c.section}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-row">
                <label>Subject</label>
                <select
                  value={selectedSubjectId || ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setSelectedSubjectId(val);
                    setSelectedPeriod(null);
                  }}
                  disabled={!selectedClassId}
                >
                  <option value="">-- Select subject --</option>
                  {classSubjectsForClass().map((cs) => (
                    <option key={cs.id} value={cs.subjectId}>
                      {cs.subjectName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-row">
                <label>Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedPeriod(null);
                    // also re-check calendar when date changes
                    if (e.target.value) checkCalendarForDate(e.target.value);
                  }}
                />
              </div>

              <div className="filter-row">
                <label>Period</label>
                <select
                  value={selectedPeriod || ""}
                  onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                  disabled={!selectedSubjectId || !selectedDate}
                >
                  <option value="">-- Select period --</option>
                  {availablePeriodsForSubject().map((p) => (
                    <option key={p} value={p}>
                      Period {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-row small-info">
                <div>
                  <strong>Calendar:</strong> <span className="muted">{calendarStatus || "-"}</span>
                </div>
              </div>

              <div className="filter-actions">
                <button
                  className="btn save"
                  onClick={submitAttendanceHandler}
                  disabled={!students.length || loading}
                >
                  {loading ? "Saving..." : "Save Attendance"}
                </button>

                <button
                  className="btn reset"
                  onClick={() => {
                    setSelectedClassId(null);
                    setSelectedSubjectId(null);
                    setSelectedDate("");
                    setSelectedPeriod(null);
                    setStudents([]);
                    setAttendanceMap({});
                    setAlreadyMarked({});
                    setSelectAll(false);
                  }}
                >
                  Reset
                </button>
              </div>
            </aside>

            {/* RIGHT MAIN */}
            <main className="att-main">
              <div className="att-controls">
                <div>
                  <strong>Class: </strong>
                  <span>{classrooms.find(c => c.classId === selectedClassId)?.name || "-"}</span>
                  {" • "}
                  <strong>Subject: </strong>
                  <span>{subjectNameFromId(selectedSubjectId) || "-"}</span>
                </div>

                <div className="selectall-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      disabled={!students.length}
                    />{" "}
                    Mark all Present
                  </label>
                </div>
              </div>

              <div className="students-card">
                {loading && <div className="info">Loading...</div>}
                {!loading && studentFetchError && <div className="error">{studentFetchError}</div>}

                {!loading && !students.length && !studentFetchError && (
                  <div className="info">No students to display — choose class/subject/date/period.</div>
                )}

                {!loading && students.length > 0 && (
                  <>
                    <div className="table-wrap">
                      <table className="styled-table">
                        <thead>
                          <tr>
                            <th style={{ width: 40 }}>#</th>
                            <th>Name</th>
                            <th style={{ width: 160 }}>Status</th>
                            <th style={{ width: 90 }}>Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((stu, idx) => {
                            const info = attendanceMap[stu.studentId] || { status: "PRESENT", attendanceId: null };
                            return (
                              <tr key={stu.studentId} style={{ background: rowColor(stu.studentId) }}>
                                <td>{idx + 1}</td>
                                <td>{stu.name}</td>
                                <td>
                                  <select
                                    value={info.status}
                                    onChange={(e) => setStudentStatus(stu.studentId, e.target.value)}
                                  >
                                    <option value="PRESENT">Present</option>
                                    <option value="ABSENT">Absent</option>
                                  </select>
                                </td>
                                <td>
                                  <button
                                    className="btn delete-small"
                                    disabled={!info.attendanceId}
                                    onClick={() => handleDelete(stu.studentId)}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* summary */}
                    <div className="summary">
                      <div>Present: <strong>{presentCount}</strong></div>
                      <div>Absent: <strong>{absentCount}</strong></div>
                      <div>Total: <strong>{students.length}</strong></div>
                    </div>
                  </>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* INLINE STYLES */}
      <style>{`
        :root {
          --primary: #0a4275;
          --muted: #666;
          --card-bg: #fff;
          --surface: #f3f5f9;
        }

        .att-page {
          display:flex;
          width:100%;
        }

        .att-content {
          flex:1;
          background: var(--surface);
          min-height:100vh;
        }

        .att-wrapper {
          max-width:1100px;
          margin: 18px auto;
          padding: 18px;
        }

        .att-title {
          text-align:center;
          color: var(--primary);
          font-size: 26px;
          margin-bottom: 16px;
          font-weight:700;
        }

        .att-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 18px;
          align-items: start;
        }

        /* Filters pane */
        .att-filters {
          background: var(--card-bg);
          border-radius: 10px;
          padding: 14px;
          box-shadow: 0 6px 18px rgba(10,66,117,0.06);
          position: sticky;
          top: 18px;
          height: fit-content;
        }

        .att-filters.closed { display:block; } /* toggle only hides via CSS below on mobile */

        .filters-header {
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:10px;
        }

        .filters-toggle {
          background: transparent;
          border: none;
          color: var(--primary);
          font-weight:600;
          cursor:pointer;
        }

        .filter-row { margin-bottom: 10px; display:flex; flex-direction:column; gap:6px; }
        .filter-row label { font-size: 13px; color:var(--muted); }
        .filter-row input[type="date"], .filter-row select {
          padding:8px 10px;
          border-radius:6px;
          border:1px solid #ddd;
          font-size:14px;
        }

        .filter-actions { display:flex; gap:8px; margin-top:8px; }
        .btn { padding:10px 12px; border-radius:8px; border:none; cursor:pointer; font-weight:600; }
        .btn.save { background: var(--primary); color:white; flex:1; }
        .btn.reset { background:#eee; color:#333; }

        /* main area */
        .att-main {  }

        .att-controls {
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:12px;
          gap:12px;
          flex-wrap:wrap;
        }

        .selectall-row { font-size:14px; color:var(--muted); }

        .students-card {
          background: var(--card-bg);
          border-radius:10px;
          padding:12px;
          box-shadow: 0 6px 18px rgba(10,66,117,0.04);
        }

        .table-wrap { overflow-x:auto; margin-bottom:12px; }

        .styled-table { width:100%; border-collapse:collapse; }
        .styled-table th { text-align:left; background:#f1f6fb; padding:10px; font-weight:700; color:#222; }
        .styled-table td { padding:10px; border-top:1px solid #f0f0f0; vertical-align:middle; }

        .btn.delete-small { background:#e53935; color:white; padding:6px 8px; border-radius:6px; border:none; cursor:pointer; }
        .btn.delete-small:disabled { opacity:0.5; cursor:not-allowed; background:#ccc; }

        .summary {
          display:flex;
          gap:18px;
          margin-top:8px;
          font-size:14px;
          color:var(--muted);
        }

        .info { padding:12px; color:var(--muted); }
        .error { padding:12px; color:#b00020; }

        /* responsive */
        @media (max-width: 1000px) {
          .att-grid { grid-template-columns: 1fr; }
          .att-filters { position:relative; top:0; order:2; }
          .att-main { order:1; }
        }

        @media (max-width: 640px) {
          .att-wrapper { padding:12px; max-width: 96%; }
          .filter-row label { font-size:12px; }
          .filters-toggle { font-size:13px; }
          .filters-header strong { font-size:14px; }
          .att-filters { display: ${filtersOpen ? "block" : "none"}; } /* dynamic fallback */
        }
      `}</style>
    </div>
  );
};

export default Attendance;
