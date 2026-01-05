// src/components/StudentAssignmentsPage.js
import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import {
  getAssignmentsByClassroom,
  getAllClassSubjects,
} from "../utils/api";
import { useNavigate } from "react-router-dom";
import { getDecodedToken } from "../utils/authHelper";

const StudentAssignmentsPage = () => {
  const decoded = getDecodedToken();
  const classroomId = decoded?.classroomId;
  const role = decoded?.role;
  const studentId = decoded?.userId;

  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classroomId || role !== "STUDENT") return;

    const loadData = async () => {
      try {
        setLoading(true);

        const [assRes, csRes] = await Promise.all([
          getAssignmentsByClassroom(classroomId),
          getAllClassSubjects(),
        ]);

        setAssignments(assRes.data || []);

        const cs = (csRes.data || []).filter(
          (c) => c.classroomId === classroomId
        );
        setClassSubjects(cs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [classroomId, role]);

  const getSubjectName = (subjectId) => {
    const sub = classSubjects.find((s) => s.subjectId === subjectId);
    return sub ? sub.subjectName : "Unknown Subject";
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: "250px", flex: 1 }}>
        <Navbar />

        <div style={{ padding: 20 }}>
          <h2>📘 My Assignments</h2>

          {loading && <p>Loading assignments...</p>}

          {!loading && assignments.length === 0 && (
            <p>No assignments available.</p>
          )}

          {!loading && assignments.length > 0 && (
            <div style={{ marginTop: 20 }}>
              {assignments.map((a) => (
                <div
                  key={a.assignmentId}
                  onClick={() =>
                    navigate(`/student/assignments/${a.assignmentId}/submission`)
                  }
                  style={{
                    background: "#ffffff",
                    padding: 15,
                    marginBottom: 12,
                    borderRadius: 10,
                    boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                    cursor: "pointer",
                  }}
                >
                  <h3 style={{ margin: 0 }}>{a.title}</h3>
                  <p style={{ marginTop: 8 }}>{a.description}</p>

                  <p style={{ fontSize: 14, color: "#444" }}>
                    <strong>Subject: </strong>
                    {getSubjectName(a.subjectId)}
                  </p>

                  <p style={{ fontSize: 14 }}>
                    <strong>Due Date:</strong> {a.dueDate}
                  </p>

                 
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAssignmentsPage;
