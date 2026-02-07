// src/components/SubmissionPage.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getAssignmentCompliance,
  updateGradeAndFeedback
} from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";
import {
  FaCheckCircle, FaUser, FaCalendarAlt,
  FaGraduationCap, FaSave, FaExclamationCircle, FaDownload,
  FaClock, FaUsers
} from "react-icons/fa";

const SubmissionPage = () => {
  const { assignmentId } = useParams();
  const decoded = getDecodedToken();
  const role = decoded?.role;

  const [complianceData, setComplianceData] = useState(null);
  const [gradeMap, setGradeMap] = useState({});
  const [feedbackMap, setFeedbackMap] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("submitted"); // "submitted" or "pending"

  const loadCompliance = async () => {
    try {
      setPageLoading(true);
      const res = await getAssignmentCompliance(assignmentId);
      setComplianceData(res.data);
    } catch (err) {
      console.error("Error loading compliance data:", err);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (assignmentId) loadCompliance();
  }, [assignmentId]);

  const handleUpdateGrade = async (submissionId) => {
    const grade = gradeMap[submissionId];
    const feedback = feedbackMap[submissionId];

    if (!grade) return alert("Please enter a grade");

    try {
      await updateGradeAndFeedback(submissionId, grade, feedback || "");
      alert("Grade updated successfully");
      loadCompliance();
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

  if (pageLoading) return <div style={styles.loading}>Generating compliance report...</div>;
  if (!complianceData) return <div style={styles.emptyState}>No data found.</div>;

  const submittedStudents = complianceData.statuses.filter(s => s.submitted);
  const pendingStudents = complianceData.statuses.filter(s => !s.submitted);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <h1 style={styles.title}>{complianceData.assignmentTitle}</h1>
          <div style={styles.statsBadge}>
            <FaUsers /> {complianceData.totalStudents} Total Students
          </div>
        </div>
        <p style={styles.subtitle}>Track submissions and grade student work</p>
      </div>

      <div style={styles.tabContainer}>
        <button
          style={{ ...styles.tab, ...(activeTab === "submitted" ? styles.activeTab : {}) }}
          onClick={() => setActiveTab("submitted")}
        >
          Submitted ({submittedStudents.length})
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === "pending" ? styles.activeTab : {}) }}
          onClick={() => setActiveTab("pending")}
        >
          Pending ({pendingStudents.length})
        </button>
      </div>

      <div style={styles.listSection}>
        {activeTab === "submitted" ? (
          submittedStudents.length === 0 ? (
            <div className="premium-card" style={styles.emptyState}>
              <FaExclamationCircle size={32} style={{ opacity: 0.2, marginBottom: "12px" }} />
              <p>No submissions found yet.</p>
            </div>
          ) : (
            <div style={styles.submissionsGrid}>
              {submittedStudents.map((s) => (
                <div key={s.studentId} className="premium-card" style={styles.subCard}>
                  <div style={styles.subTop}>
                    <div style={styles.studentInfo}>
                      <div style={styles.avatar}><FaUser /></div>
                      <div>
                        <div style={styles.studentName}>{s.studentName}</div>
                        <div style={styles.subDate}>
                          <FaCalendarAlt size={10} /> Submitted on: {new Date(s.submission.submissionDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <a
                      href={getFullFileUrl(s.submission.fileLink)}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.downloadBtn}
                    >
                      <FaDownload /> View Work
                    </a>
                  </div>

                  <div style={styles.subBottom}>
                    <div style={styles.gradingForm}>
                      <div style={styles.formRow}>
                        <div style={{ flex: 1 }}>
                          <label style={styles.inputLabel}>Grade</label>
                          <input
                            type="text"
                            className="modern-input"
                            placeholder={s.submission.grade || "Enter grade..."}
                            onChange={(e) => setGradeMap({ ...gradeMap, [s.submission.submissionId]: e.target.value })}
                          />
                        </div>
                        <div style={{ flex: 3 }}>
                          <label style={styles.inputLabel}>Feedback</label>
                          <input
                            type="text"
                            className="modern-input"
                            placeholder={s.submission.feedback || "Add feedback..."}
                            onChange={(e) => setFeedbackMap({ ...feedbackMap, [s.submission.submissionId]: e.target.value })}
                          />
                        </div>
                        <button
                          className="modern-btn btn-primary"
                          style={styles.saveBtn}
                          onClick={() => handleUpdateGrade(s.submission.submissionId)}
                        >
                          <FaSave /> Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          pendingStudents.length === 0 ? (
            <div className="premium-card" style={styles.emptyState}>
              <FaCheckCircle size={32} style={{ color: "#10b981", opacity: 0.4, marginBottom: "12px" }} />
              <p>All students have submitted their work!</p>
            </div>
          ) : (
            <div style={styles.pendingGrid}>
              {pendingStudents.map((s) => (
                <div key={s.studentId} className="premium-card" style={styles.pendingCard}>
                  <div style={styles.pendingInfo}>
                    <div style={styles.pendingAvatar}><FaUser /></div>
                    <div>
                      <div style={styles.studentName}>{s.studentName}</div>
                      <div style={styles.subStatus}><FaClock size={10} /> Not Submitted</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
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
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
  statsBadge: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    color: "var(--primary-color)",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  tabContainer: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "16px",
  },
  tab: {
    padding: "10px 24px",
    borderRadius: "8px",
    border: "1px solid var(--border-color)",
    background: "white",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    color: "var(--text-muted)",
  },
  activeTab: {
    backgroundColor: "var(--primary-color)",
    color: "white",
    borderColor: "var(--primary-color)",
  },
  listSection: {
    marginTop: "0",
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
  pendingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "16px",
  },
  pendingCard: {
    padding: "16px",
  },
  pendingInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  pendingAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "var(--border-color)",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
  },
  subStatus: {
    fontSize: "11px",
    color: "#f59e0b",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "2px",
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
