import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { getDecodedToken } from "../utils/authHelper";
import { getExamsForStudent } from "../utils/api";

const StudentExamPage = () => {
  const decoded = getDecodedToken();
  const classroomId = decoded?.classroomId;

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classroomId) return;

    const load = async () => {
      try {
        setLoading(true);

        const res = await getExamsForStudent(classroomId);
        setExams(res.data || []);
      } catch (err) {
        console.error("Exam load error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [classroomId]);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div style={{ marginLeft: 260, padding: 20, width: "100%" }}>
        <Navbar />
        <h2>📘 My Exams</h2>

        {loading && <p>Loading exams...</p>}

        {!loading && exams.length === 0 && (
          <p>No exams scheduled.</p>
        )}

        {!loading &&
          exams.length > 0 &&
          exams.map((exam) => (
            <div
              key={exam.examScheduleId}
              style={{
                background: "#fff",
                padding: 15,
                marginBottom: 12,
                borderRadius: 10,
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              }}
            >
              <h3>{exam.subjectName || "Subject"}</h3>
              <p>
                <strong>Date:</strong> {exam.examDate}
              </p>
              <p>
                <strong>Time:</strong> {exam.startTime} - {exam.endTime}
              </p>
              <p>
                <strong>Room:</strong> {exam.roomNo}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default StudentExamPage;
