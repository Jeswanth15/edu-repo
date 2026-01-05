// src/components/AssignmentsPage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getAllClassSubjects,
  getAllClassrooms,
  createAssignment,
  getAssignmentsBySubject,
} from "../utils/api";

import { getDecodedToken } from "../utils/authHelper";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const AssignmentsPage = () => {
  const decoded = getDecodedToken();
  const userId = decoded?.userId;
  const schoolId = decoded?.schoolId;
  const role = decoded?.role;

  const navigate = useNavigate();

  const [classrooms, setClassrooms] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [filteredClassSubjects, setFilteredClassSubjects] = useState([]);

  const [assignments, setAssignments] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  const [filtersOpen, setFiltersOpen] = useState(true);

  // Load initial
  useEffect(() => {
    getAllClassrooms(schoolId).then((res) => setClassrooms(res.data || []));
    getAllClassSubjects().then((res) => {
      const all = res.data || [];
      setClassSubjects(all);

      if (role === "TEACHER") {
        setFilteredClassSubjects(all.filter((cs) => cs.teacherId === userId));
      } else {
        setFilteredClassSubjects(all);
      }
    });
  }, [schoolId, role, userId]);

  // Load assignments
  useEffect(() => {
    if (selectedSubject) {
      getAssignmentsBySubject(selectedSubject).then((res) =>
        setAssignments(res.data || [])
      );
    }
  }, [selectedSubject]);

  const subjectsForClass = filteredClassSubjects
    .filter((cs) => cs.classroomId === Number(selectedClass))
    .map((cs) => ({
      id: cs.subjectId,
      name: cs.subjectName,
    }));

  const handleCreateAssignment = async () => {
    if (!selectedClass || !selectedSubject || !newAssignment.title) {
      alert("Fill all fields");
      return;
    }

    try {
      await createAssignment({
        classroomId: Number(selectedClass),
        subjectId: Number(selectedSubject),
        teacherId: userId,
        ...newAssignment,
      });

      alert("Assignment created");
      setNewAssignment({ title: "", description: "", dueDate: "" });

      const res = await getAssignmentsBySubject(selectedSubject);
      setAssignments(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Create failed");
    }
  };

  return (
    <div className="assign-page">
      <Sidebar />
      <div className="assign-main">
        <Navbar />

        <div className="assign-wrapper">
          <h2 className="assign-title">📚 Assignments</h2>

          <div className="assign-grid">
            {/* FILTERS */}
            <aside className={`assign-filters ${filtersOpen ? "open" : "closed"}`}>
              <div className="filters-header">
                <strong>Filters</strong>
                <button
                  className="filters-toggle"
                  onClick={() => setFiltersOpen((p) => !p)}
                >
                  {filtersOpen ? "Hide" : "Show"}
                </button>
              </div>

              <div className="filter-row">
                <label>Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedSubject("");
                    setAssignments([]);
                  }}
                >
                  <option value="">-- Select --</option>

                  {[
                    ...new Set(filteredClassSubjects.map((cs) => cs.classroomId)),
                  ]
                    .map((cid) => classrooms.find((c) => c.classId === cid))
                    .filter(Boolean)
                    .map((cls) => (
                      <option key={cls.classId} value={cls.classId}>
                        {cls.name} {cls.section}
                      </option>
                    ))}
                </select>
              </div>

              <div className="filter-row">
                <label>Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={!selectedClass}
                >
                  <option value="">-- Select --</option>
                  {subjectsForClass.map((subj) => (
                    <option key={subj.id} value={subj.id}>
                      {subj.name}
                    </option>
                  ))}
                </select>
              </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="assign-content">
              {/* CREATE ASSIGNMENT */}
              {selectedSubject && (
                <div className="assign-create-card">
                  <h3>➕ Create Assignment</h3>

                  <input
                    type="text"
                    placeholder="Title"
                    value={newAssignment.title}
                    onChange={(e) =>
                      setNewAssignment({ ...newAssignment, title: e.target.value })
                    }
                  />
                  <textarea
                    placeholder="Description"
                    value={newAssignment.description}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        description: e.target.value,
                      })
                    }
                  />

                  <label className="due-label">Due Date</label>
                  <input
                    type="date"
                    value={newAssignment.dueDate}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        dueDate: e.target.value,
                      })
                    }
                  />

                  <button className="btn-primary" onClick={handleCreateAssignment}>
                    Create
                  </button>
                </div>
              )}

              {/* ASSIGNMENT LIST */}
              <div className="assign-list">
                <h3>📑 Assignment List</h3>

                {assignments.length === 0 && (
                  <p className="muted">No assignments yet.</p>
                )}

                {assignments.map((a) => (
                  <div key={a.assignmentId} className="assign-card">
                    <h4>{a.title}</h4>
                    <p>{a.description}</p>

                    <div className="assign-footer">
                      <span className="due-date">Due: {a.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* STYLES */}
      <style>{`
        :root {
          --primary: #0a4275;
          --surface: #f3f5f9;
          --card: #fff;
          --muted: #666;
        }

        .assign-page {
          display: flex;
        }

        .assign-main {
          flex: 1;
          background: var(--surface);
          min-height: 100vh;
        }

        .assign-wrapper {
          max-width: 1100px;
          margin: 20px auto;
          padding: 20px;
        }

        .assign-title {
          text-align: center;
          font-size: 26px;
          color: var(--primary);
          margin-bottom: 20px;
        }

        .assign-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 20px;
        }

        .assign-filters {
          background: var(--card);
          padding: 15px;
          border-radius: 10px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.06);
          position: sticky;
          top: 20px;
          height: fit-content;
        }

        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .filters-toggle {
          background: none;
          border: none;
          color: var(--primary);
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }

        .filter-row {
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
        }

        .filter-row label {
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 4px;
        }

        select, input[type="text"], textarea, input[type="date"] {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 14px;
          width: 100%;
        }

        textarea {
          min-height: 70px;
        }

        .assign-create-card {
          background: var(--card);
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 25px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }

        .assign-create-card h3 {
          margin-bottom: 12px;
        }

        .due-label {
          margin-top: 10px;
          font-size: 13px;
          color: var(--muted);
        }

        .btn-primary {
          background: var(--primary);
          color: #fff;
          border: none;
          padding: 10px 14px;
          border-radius: 6px;
          margin-top: 12px;
          cursor: pointer;
          width: 100%;
          font-weight: bold;
        }

        .assign-list h3 {
          margin-bottom: 10px;
        }

        .assign-card {
          background: var(--card);
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 12px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.05);
        }

        .assign-footer {
          margin-top: 10px;
          font-size: 13px;
          color: var(--muted);
          display: flex;
          justify-content: space-between;
        }

        .muted {
          color: var(--muted);
        }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .assign-grid {
            grid-template-columns: 1fr;
          }
          .assign-filters {
            position: relative;
            top: 0;
          }
        }

        @media (max-width: 500px) {
          .assign-wrapper { padding: 12px; }
          .assign-title { font-size: 22px; }
        }
      `}</style>
    </div>
  );
};

export default AssignmentsPage;
