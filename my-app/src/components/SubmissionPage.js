// src/components/SubmissionPage.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getSubmissionsByAssignment,
  getStudentSubmissions,
  createSubmission,
  updateGradeAndFeedback
} from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";
import {
  FaUpload, FaFileAlt, FaCheckCircle, FaUser, FaCalendarAlt,
  FaGraduationCap, FaSave, FaExclamationCircle, FaDownload
} from "react-icons/fa";

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
  const [pageLoading, setPageLoading] = useState(true);

  const loadSubmissions = async () => {
    try {
      setPageLoading(true);
      let res;
      if (role === "STUDENT") {
        res = await getStudentSubmissions(assignmentId, userId);
      } else {
        res = await getSubmissionsByAssignment(assignmentId);
      }
      setSubmissions(res.data || []);
    } catch (err) {
      console.error("Error loading submissions:", err);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (assignmentId) loadSubmissions();
  }, [assignmentId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file first");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assignmentId", assignmentId);
      formData.append("studentId", userId);

      await createSubmission(formData);
      alert("Submission uploaded successfully!");
      setFile(null);
      const fileInput = document.getElementById("submission-file-input");
      if (fileInput) fileInput.value = "";
      loadSubmissions();
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGrade = async (submissionId) => {
    const grade = gradeMap[submissionId];
    const feedback = feedbackMap[submissionId];

    if (!grade) return alert("Please enter a grade");

    try {
      await updateGradeAndFeedback(submissionId, grade, feedback || "");
      alert("Grade updated successfully");
      loadSubmissions();
    } catch (err) {
      console.error(err);
      alert("Failed to update grade");
    }
  };

  const getFullFileUrl = (url) => {
    if (!url) return "#";
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url}`;
  };

  if (pageLoading) return <div style={styles.loading}>Loading submissions...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Submissions</h1>
        <p style={styles.subtitle}>Track and manage student work for this assignment</p>
      </div>

      {/* STUDENT UPLOAD SECTION */}
      {role === "STUDENT" && (
        <div className="premium-card" style={styles.uploadCard}>
          <h3 style={styles.sectionTitle}><FaUpload size={14} /> Submit Your Work</h3>
          <form onSubmit={handleUpload} style={styles.uploadForm}>
            <div style={styles.fileBox}>
              <input
                type="file"
                id="submission-file-input"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files[0])}
              />
              <label htmlFor="submission-file-input" style={styles.fileLabel}>
                <FaFileAlt size={24} style={{ marginBottom: "8px", opacity: 0.5 }} />
                <span>{file ? file.name : "Click to select or drag your file here"}</span>
              </label>
            </div>
            <button
              type="submit"
              className="modern-btn btn-primary"
              disabled={loading || !file}
              style={{ width: "200px", alignSelf: "center" }}
            >
              {loading ? "Uploading..." : "Submit Assignment"}
            </button>
          </form>
        </div>
      )}

      {/* SUBMISSIONS LIST */}
      <div style={styles.listSection}>
        <h3 style={styles.listHeader}>
          <FaCheckCircle /> {submissions.length} Submissions
        </h3>

        {submissions.length === 0 ? (
          <div className="premium-card" style={styles.emptyState}>
            <FaExclamationCircle size={32} style={{ opacity: 0.2, marginBottom: "12px" }} />
            <p>No submissions found yet.</p>
          </div>
        ) : (
          <div style={styles.submissionsGrid}>
            {submissions.map((s) => (
              <div key={s.submissionId} className="premium-card" style={styles.subCard}>
                <div style={styles.subTop}>
                  <div style={styles.studentInfo}>
                    <div style={styles.avatar}><FaUser /></div>
                    <div>
                      <div style={styles.studentName}>Student ID: {s.studentId}</div>
                      <div style={styles.subDate}><FaCalendarAlt size={10} /> Submitted on: {new Date(s.submissionDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <a
                    href={getFullFileUrl(s.fileLink)}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.downloadBtn}
                  >
                    <FaDownload /> View Work
                  </a>
                </div>

                <div style={styles.subBottom}>
                  {role === "STUDENT" ? (
                    <div style={styles.resultBox}>
                      <div style={styles.gradeDisplay}>
                        <span style={styles.label}>Grade:</span>
                        <span style={styles.gradeValue}>{s.grade || "Pending"}</span>
                      </div>
                      <div style={styles.feedbackDisplay}>
                        <span style={styles.label}>Feedback:</span>
                        <p style={styles.feedbackText}>{s.feedback || "No feedback provided yet."}</p>
                      </div>
                    </div>
                  ) : (
                    <div style={styles.gradingForm}>
                      <div style={styles.formRow}>
                        <div style={{ flex: 1 }}>
                          <label style={styles.inputLabel}>Grade</label>
                          <input
                            type="text"
                            className="modern-input"
                            placeholder={s.grade || "Enter grade..."}
                            onChange={(e) => setGradeMap({ ...gradeMap, [s.submissionId]: e.target.value })}
                          />
                        </div>
                        <div style={{ flex: 3 }}>
                          <label style={styles.inputLabel}>Feedback</label>
                          <input
                            type="text"
                            className="modern-input"
                            placeholder={s.feedback || "Add feedback..."}
                            onChange={(e) => setFeedbackMap({ ...feedbackMap, [s.submissionId]: e.target.value })}
                          />
                        </div>
                        <button
                          className="modern-btn btn-primary"
                          style={styles.saveBtn}
                          onClick={() => handleUpdateGrade(s.submissionId)}
                        >
                          <FaSave /> Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
  uploadCard: {
    padding: "24px",
    marginBottom: "32px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "12px",
  },
  uploadForm: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  fileBox: {
    border: "2px dashed var(--border-color)",
    borderRadius: "var(--radius-md)",
    padding: "32px",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.02)",
    transition: "all 0.2s",
    cursor: "pointer",
  },
  fileLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "var(--text-muted)",
    fontSize: "14px",
    cursor: "pointer",
  },
  listSection: {
    marginTop: "40px",
  },
  listHeader: {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "var(--primary-color)",
  },
  submissionsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  subCard: {
    padding: "0",
    overflow: "hidden",
  },
  subTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    backgroundColor: "rgba(0,0,0,0.02)",
    borderBottom: "1px solid var(--border-color)",
  },
  studentInfo: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "var(--primary-color)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },
  studentName: {
    fontWeight: "700",
    fontSize: "15px",
  },
  subDate: {
    fontSize: "12px",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "2px",
  },
  downloadBtn: {
    color: "var(--primary-color)",
    fontSize: "13px",
    fontWeight: "700",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--primary-color)",
    transition: "all 0.2s",
  },
  subBottom: {
    padding: "20px 24px",
  },
  resultBox: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: "24px",
  },
  gradeDisplay: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "700",
    color: "var(--text-muted)",
    textTransform: "uppercase",
  },
  gradeValue: {
    fontSize: "24px",
    fontWeight: "800",
    color: "var(--primary-color)",
  },
  feedbackDisplay: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  feedbackText: {
    fontSize: "14px",
    color: "var(--text-primary)",
    lineHeight: "1.6",
    margin: 0,
    fontStyle: "italic",
  },
  gradingForm: {
    width: "100%",
  },
  formRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "16px",
  },
  inputLabel: {
    display: "block",
    fontSize: "12px",
    fontWeight: "700",
    color: "var(--text-muted)",
    marginBottom: "6px",
  },
  saveBtn: {
    padding: "10px 24px",
    height: "42px",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "var(--text-muted)",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "var(--text-muted)",
  }
};

export default SubmissionPage;
