// src/components/StudentSubmissionPage.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import {
  getSubmissionsByAssignmentAndStudent,
  uploadSubmission,
} from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

const StudentSubmissionPage = () => {
  const { assignmentId } = useParams();
  const decoded = getDecodedToken();
  const studentId = decoded?.userId;

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Load existing submission
  useEffect(() => {
    const loadSubmission = async () => {
      try {
        setLoading(true);

        const res = await getSubmissionsByAssignmentAndStudent(
          assignmentId,
          studentId
        );

        setSubmission(res.data.length > 0 ? res.data[0] : null);
      } catch (err) {
        console.error("Load submission error", err);
      } finally {
        setLoading(false);
      }
    };

    loadSubmission();
  }, [assignmentId, studentId]);

  // Upload submission
  const handleUpload = async () => {
    if (!file) {
      alert("Select a file first!");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("assignmentId", assignmentId);
      formData.append("studentId", studentId);

      const res = await uploadSubmission(formData);
      alert("Submitted successfully!");

      setSubmission(res.data); // Update UI immediately
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: 250, flex: 1 }}>
        <Navbar />

        <div style={{ padding: 20 }}>
          <h2>📄 My Submission</h2>

          {loading && <p>Loading...</p>}

          {/* ------------------- If NOT submitted ------------------- */}
          {!loading && !submission && (
            <div
              style={{
                marginTop: 20,
                background: "#fff",
                padding: 20,
                borderRadius: 10,
                boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
              }}
            >
              <h3>No submission yet</h3>

              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ marginTop: 10 }}
              />

              <button
                onClick={handleUpload}
                disabled={uploading}
                style={{
                  marginTop: 15,
                  padding: "10px 15px",
                  background: "#0a4275",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                {uploading ? "Uploading..." : "Submit Assignment"}
              </button>
            </div>
          )}

          {/* ------------------- If submitted ------------------- */}
          {!loading && submission && (
            <div
              style={{
                background: "#fff",
                padding: 20,
                borderRadius: 10,
                boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                marginTop: 20,
              }}
            >
              <p>
                <strong>Submitted on:</strong> {submission.submissionDate}
              </p>

              <p>
                <strong>File:</strong>{" "}
                <a href={`http://localhost:8080${submission.fileLink}`} target="_blank" rel="noreferrer">
                  View / Download
                </a>
              </p>

              <p>
                <strong>Grade:</strong>{" "}
                {submission.grade ? submission.grade : "Not graded yet"}
              </p>

              <p>
                <strong>Feedback:</strong>{" "}
                {submission.feedback ? submission.feedback : "No feedback yet"}
              </p>

              {/* ----- Allow resubmission ----- */}
              <div style={{ marginTop: 20 }}>
                <h4>Resubmit (optional):</h4>

                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                />

                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  style={{
                    marginTop: 10,
                    padding: "10px 15px",
                    background: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  {uploading ? "Uploading..." : "Re-submit Assignment"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentSubmissionPage;
