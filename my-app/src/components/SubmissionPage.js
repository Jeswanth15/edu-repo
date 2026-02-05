// src/components/SubmissionPage.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { getDecodedToken } from "../utils/authHelper";

const API_BASE = "http://localhost:8080";

const config = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const SubmissionPage = () => {
  const { assignmentId } = useParams();
  const decoded = getDecodedToken();

  const role = decoded?.role;
  const userId = decoded?.userId;

  const [submissions, setSubmissions] = useState([]);
  const [file, setFile] = useState(null);
  const [gradeMap, setGradeMap] = useState({});
  const [feedbackMap, setFeedbackMap] = useState({});
  const [loading, setLoading] = useState(false);

  // Load submissions
  const loadSubmissions = async () => {
    try {
      let res;
      if (role === "STUDENT") {
        res = await axios.get(
          `${API_BASE}/api/submissions/assignment/${assignmentId}/student/${userId}`,
          config()
        );
      } else {
        res = await axios.get(
          `${API_BASE}/api/submissions/assignment/${assignmentId}`,
          config()
        );
      }
      setSubmissions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (assignmentId) loadSubmissions();
  }, [assignmentId]);

  // Upload submission
  const handleUpload = async () => {
    if (!file) return alert("Please select a file");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assignmentId", assignmentId);
      formData.append("studentId", userId);

      await axios.post(`${API_BASE}/api/submissions`, formData, {
        ...config(),
        headers: {
          ...config().headers,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Uploaded successfully");
      loadSubmissions();
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  // Grade + Feedback update
  const handleGradeSubmit = async (submissionId) => {
    const grade = gradeMap[submissionId];
    const feedback = feedbackMap[submissionId];

    try {
      await axios.put(
        `${API_BASE}/api/submissions/grade-feedback/${submissionId}?grade=${grade}&feedback=${feedback}`,
        null,
        config()
      );

      alert("Updated successfully");
      loadSubmissions();
    } catch (err) {
      console.error(err);
      alert("Failed to update grade/feedback");
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Submissions</h1>

         
            <div className="mb-6">
              <h2 className="font-semibold mb-2">Upload Your Submission</h2>

              <input type="file" onChange={(e) => setFile(e.target.files[0])} />

              <button
                onClick={handleUpload}
                className="ml-3 bg-blue-600 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                {loading ? "Uploading..." : "Upload"}
              </button>
            </div>

          <table className="w-full border">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Student</th>
                <th className="p-2">Date</th>
                <th className="p-2">File</th>
                <th className="p-2">Grade</th>
                <th className="p-2">Feedback</th>
                {role !== "STUDENT" && <th className="p-2">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {submissions.map((s) => (
                <tr key={s.submissionId} className="border-t">
                  <td className="p-2">{s.studentId}</td>
                  <td className="p-2">{s.submissionDate}</td>
                  <td className="p-2">
                    <a
                      href={`${API_BASE}${s.fileLink}`}
                      target="_blank"
                      className="text-blue-600 underline"
                    >
                      View File
                    </a>
                  </td>
                  <td className="p-2">{s.grade || "-"}</td>
                  <td className="p-2">{s.feedback || "-"}</td>

                  {role !== "STUDENT" && (
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Grade"
                        onChange={(e) =>
                          setGradeMap({
                            ...gradeMap,
                            [s.submissionId]: e.target.value,
                          })
                        }
                        className="border px-2 mr-2"
                      />

                      <input
                        type="text"
                        placeholder="Feedback"
                        onChange={(e) =>
                          setFeedbackMap({
                            ...feedbackMap,
                            [s.submissionId]: e.target.value,
                          })
                        }
                        className="border px-2 mr-2"
                      />

                      <button
                        onClick={() => handleGradeSubmit(s.submissionId)}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Save
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {submissions.length === 0 && <p>No submissions yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default SubmissionPage;
