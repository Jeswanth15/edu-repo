// src/components/StudentSubmissionPage.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getStudentSubmissions,
  createSubmission,
} from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";
import {
  FaUpload, FaFileAlt, FaCheckCircle, FaCalendarAlt,
  FaExclamationCircle, FaDownload, FaHistory
} from "react-icons/fa";

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
        const res = await getStudentSubmissions(assignmentId);
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

      const res = await createSubmission(formData);
      alert("Submitted successfully!");
      setSubmission(res.data);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const getFullFileUrl = (url) => {
    if (!url) return "#";
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url}`;
  };

  if (loading) return <div style={styles.loading}>Curating your submission...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Submission</h1>
        <p style={styles.subtitle}>Track your work and academic feedback</p>
      </div>

      <div style={styles.mainGrid}>
        {/* STATUS & FEEDBACK CARD */}
        {submission && (
          <div style={styles.statusCol}>
            <div className="premium-card" style={styles.resultCard}>
              <h3 style={styles.sectionTitle}><FaCheckCircle /> Academic Result</h3>
              <div style={styles.gradeBox}>
                <label style={styles.label}>Awarded Grade</label>
                <div style={styles.gradeValue}>{submission.grade || "PENDING"}</div>
              </div>
              <div style={styles.feedbackBox}>
                <label style={styles.label}>Tutor Feedback</label>
                <p style={styles.feedbackText}>{submission.feedback || "Awaiting review from your subject teacher."}</p>
              </div>
            </div>

            <div className="premium-card" style={styles.fileCard}>
              <h3 style={styles.sectionTitle}><FaHistory /> Submission Details</h3>
              <div style={styles.detailRow}>
                <FaCalendarAlt style={styles.icon} />
                <div>
                  <label style={styles.label}>Date Submitted</label>
                  <p style={styles.value}>{new Date(submission.submissionDate).toLocaleString()}</p>
                </div>
              </div>
              <div style={styles.detailRow}>
                <FaFileAlt style={styles.icon} />
                <div>
                  <label style={styles.label}>Attached Resource</label>
                  <a href={getFullFileUrl(submission.fileLink)} target="_blank" rel="noreferrer" style={styles.downloadLink}>
                    <FaDownload size={12} /> View/Download File
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UPLOAD / RE-UPLOAD CARD */}
        <div style={styles.uploadCol}>
          <div className="premium-card" style={styles.uploadCard}>
            <h3 style={styles.sectionTitle}>
              <FaUpload size={14} /> {submission ? "Update Submission" : "Submit Your Work"}
            </h3>
            <p style={styles.uploadDesc}>
              {submission
                ? "You can update your submission by uploading a new file. Note: This will replace your previous attempt."
                : "Please upload your assignment file here. Accepted formats: PDF, DOCX, ZIP."}
            </p>

            <div style={styles.fileDropZone}>
              <input
                type="file"
                id="student-submission-file"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files[0])}
              />
              <label htmlFor="student-submission-file" style={styles.dropZoneLabel}>
                {file ? (
                  <div style={styles.selectedFile}>
                    <FaFileAlt size={32} color="var(--primary-color)" />
                    <span>{file.name}</span>
                  </div>
                ) : (
                  <>
                    <FaUpload size={32} style={{ opacity: 0.3 }} />
                    <span>{submission ? "Select new file to replace" : "Click to browse or drag file here"}</span>
                  </>
                )}
              </label>
            </div>

            <button
              className={`modern-btn ${submission ? "btn-outline" : "btn-primary"}`}
              onClick={handleUpload}
              disabled={uploading || !file}
              style={styles.submitBtn}
            >
              {uploading ? "Processing..." : submission ? "Update Submission" : "Post Submission"}
            </button>
          </div>

          {!submission && (
            <div className="premium-card" style={styles.emptyHint}>
              <FaExclamationCircle size={24} style={{ opacity: 0.2, marginBottom: "12px" }} />
              <p>No submission has been recorded for this task yet.</p>
            </div>
          )}
        </div>
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
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "32px",
    alignItems: "start",
  },
  statusCol: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "var(--text-primary)",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "12px",
  },
  resultCard: {
    padding: "24px",
  },
  gradeBox: {
    marginBottom: "20px",
  },
  gradeValue: {
    fontSize: "32px",
    fontWeight: "800",
    color: "var(--primary-color)",
    letterSpacing: "-0.5px",
  },
  feedbackBox: {
    backgroundColor: "var(--background-color)",
    padding: "16px",
    borderRadius: "8px",
    borderLeft: "4px solid var(--accent-color)",
  },
  feedbackText: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: "1.6",
    margin: 0,
  },
  fileCard: {
    padding: "24px",
  },
  detailRow: {
    display: "flex",
    gap: "16px",
    marginBottom: "16px",
  },
  icon: {
    color: "var(--text-muted)",
    fontSize: "18px",
    marginTop: "4px",
  },
  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    letterSpacing: "0.5px",
    marginBottom: "2px",
  },
  value: {
    fontSize: "14px",
    fontWeight: "500",
    margin: 0,
  },
  downloadLink: {
    fontSize: "14px",
    color: "var(--primary-color)",
    fontWeight: "600",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  uploadCol: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  uploadCard: {
    padding: "32px",
  },
  uploadDesc: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    marginBottom: "24px",
    lineHeight: "1.5",
  },
  fileDropZone: {
    border: "2px dashed var(--border-color)",
    borderRadius: "12px",
    padding: "40px 20px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    marginBottom: "24px",
    backgroundColor: "var(--background-color)",
  },
  dropZoneLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    fontSize: "14px",
    color: "var(--text-muted)",
  },
  selectedFile: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    color: "var(--text-primary)",
    fontWeight: "600",
  },
  submitBtn: {
    width: "100%",
  },
  emptyHint: {
    padding: "24px",
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: "13px",
  },
  loading: {
    textAlign: "center",
    padding: "100px",
    color: "var(--text-muted)",
  }
};

export default StudentSubmissionPage;
