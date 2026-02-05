import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { getDecodedToken } from "../utils/authHelper";
import { getMarksByStudent } from "../utils/api";

const StudentMarksPage = () => {
  const decoded = getDecodedToken();
  const studentId = decoded?.userId;

  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("DATE_DESC");

  useEffect(() => {
    if (!studentId) return;

    const loadMarks = async () => {
      try {
        setLoading(true);
        const res = await getMarksByStudent(studentId);
        setMarks(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadMarks();
  }, [studentId]);

  const sortData = (list) => {
    switch (sortBy) {
      case "SUBJECT_ASC":
        return [...list].sort((a, b) => a.subjectName.localeCompare(b.subjectName));

      case "SUBJECT_DESC":
        return [...list].sort((a, b) => b.subjectName.localeCompare(a.subjectName));

      case "MARKS_ASC":
        return [...list].sort((a, b) => a.marksObtained - b.marksObtained);

      case "MARKS_DESC":
        return [...list].sort((a, b) => b.marksObtained - a.marksObtained);

      case "DATE_ASC":
        return [...list].sort((a, b) => new Date(a.examDate) - new Date(b.examDate));

      case "DATE_DESC":
      default:
        return [...list].sort((a, b) => new Date(b.examDate) - new Date(a.examDate));
    }
  };

  const sortedMarks = sortData(marks);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div style={{ marginLeft: 260, padding: 20, width: "100%" }}>
        <Navbar />

        <h2>📊 My Marks</h2>

        {/* SORT DROPDOWN */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: 8, marginBottom: 15 }}
        >
          <option value="DATE_DESC">Latest First</option>
          <option value="DATE_ASC">Oldest First</option>

          <option value="SUBJECT_ASC">Subject A → Z</option>
          <option value="SUBJECT_DESC">Subject Z → A</option>

          <option value="MARKS_DESC">Marks High → Low</option>
          <option value="MARKS_ASC">Marks Low → High</option>
        </select>

        {loading && <p>Loading marks...</p>}

        {!loading && sortedMarks.length === 0 && <p>No marks found.</p>}

        {!loading && sortedMarks.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#e5f7ff" }}>
                <th>Subject</th>
                <th>Exam Type</th>
                <th>Marks Obtained</th>
                <th>Total Marks</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {sortedMarks.map((m) => (
                <tr key={m.marksId}>
                  <td>{m.subjectName}</td>
                  <td>{m.examType}</td>
                  <td>{m.marksObtained}</td>
                  <td>{m.totalMarks}</td>
                  <td>{m.examDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentMarksPage;
