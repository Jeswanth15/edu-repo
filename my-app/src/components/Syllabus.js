// src/components/Syllabus.js
import React, { useEffect, useState } from "react";
import {
  getAllClassSubjects,
  getSyllabusByClassSubject,
  createOrUpdateSyllabus,
  deleteSyllabus,
} from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";
import {
  FaFileUpload, FaBook, FaTrash, FaExternalLinkAlt, FaClock,
  FaFilePdf, FaFilePowerpoint, FaFileWord, FaLink, FaFolderOpen
} from "react-icons/fa";

const Syllabus = () => {
  const decoded = getDecodedToken();
  const role = decoded?.role;
  const userId = decoded?.userId;
  const classroomId = decoded?.classroomId;

  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [syllabusList, setSyllabusList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    moduleName: "",
    fileLink: "",
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchClassSubjects();
  }, []);

  const fetchClassSubjects = async () => {
    try {
      setLoading(true);
      const res = await getAllClassSubjects();
      let all = res.data || [];

      if (role === "TEACHER") {
        all = all.filter((cs) => cs.teacherId === userId);
      } else if (role === "STUDENT") {
        all = all.filter((cs) => cs.classroomId === classroomId);
      }

      setClassSubjects(all);
    } catch (err) {
      console.error("Error fetching class-subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSyllabus = async (id) => {
    try {
      const res = await getSyllabusByClassSubject(id);
      setSyllabusList(res.data || []);
      setSelectedId(id);
    } catch (err) {
      console.error("Error fetching syllabus:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return alert("Select a class & subject first");

    const data = new FormData();
    data.append("classSubjectId", selectedId);
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("moduleName", formData.moduleName || "General Resources");
    data.append("uploadedById", userId);

    if (file) {
      data.append("file", file);
    }

    try {
      await createOrUpdateSyllabus(data);
      fetchSyllabus(selectedId);
      setFormData({ title: "", description: "", moduleName: "", fileLink: "" });
      setFile(null);
      const fileInput = document.getElementById("syllabus-file-input");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      console.error(err);
      alert("Failed to upload syllabus");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this syllabus?")) return;
    try {
      await deleteSyllabus(id);
      fetchSyllabus(selectedId);
    } catch (err) {
      console.error(err);
    }
  };

  const groupedSyllabus = syllabusList.reduce((acc, current) => {
    const module = current.moduleName || "General Resources";
    if (!acc[module]) acc[module] = [];
    acc[module].push(current);
    return acc;
  }, {});

  const getFileIcon = (url) => {
    if (!url) return <FaLink />;
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.endsWith(".pdf")) return <FaFilePdf style={{ color: "#ef4444" }} />;
    if (lowerUrl.endsWith(".ppt") || lowerUrl.endsWith(".pptx")) return <FaFilePowerpoint style={{ color: "#f59e0b" }} />;
    if (lowerUrl.endsWith(".doc") || lowerUrl.endsWith(".docx")) return <FaFileWord style={{ color: "#3b82f6" }} />;
    return <FaLink style={{ color: "var(--accent-color)" }} />;
  };

  const getFullFileUrl = (url) => {
    if (!url) return "#";
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url}`;
  };

  if (loading && classSubjects.length === 0) {
    return (
      <div style={styles.loaderContainer}>
        <div className="spinner"></div>
        <p style={{ marginTop: "20px", color: "var(--text-secondary)", fontWeight: "500" }}>
          Indexing curriculum resources...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Syllabus & Resources</h1>
        <p style={styles.subtitle}>Curated learning materials for your active classes</p>
      </div>

      {/* CLASS SELECTOR */}
      <div style={styles.selectorWrapper}>
        {classSubjects.length === 0 ? (
          <div className="premium-card" style={styles.empty}>No classes assigned to you.</div>
        ) : (
          <div style={styles.chipGrid}>
            {classSubjects.map((cs) => (
              <div
                key={cs.id}
                style={{
                  ...styles.chip,
                  borderColor: selectedId === cs.id ? "var(--primary-color)" : "var(--border-color)",
                  backgroundColor: selectedId === cs.id ? "rgba(30, 136, 229, 0.05)" : "var(--surface-color)",
                }}
                onClick={() => fetchSyllabus(cs.id)}
              >
                <div style={styles.chipIcon}><FaBook /></div>
                <div style={styles.chipText}>
                  <div style={{ fontWeight: "700", color: selectedId === cs.id ? "var(--primary-color)" : "var(--text-primary)" }}>
                    {cs.classroomName || cs.classroom?.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {cs.subjectName || cs.subject?.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.mainGrid}>
        {/* UPLOAD FORM (TEACHER/ADMIN ONLY) */}
        {selectedId && role !== "STUDENT" && (
          <div className="premium-card" style={styles.formCard}>
            <h3 style={styles.sectionTitle}><FaFileUpload size={14} /> Add New Material</h3>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formRow}>
                <input
                  className="modern-input"
                  placeholder="Module Name (e.g. Unit 1: Physics Intro)"
                  value={formData.moduleName}
                  onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
                />
                <input
                  className="modern-input"
                  placeholder="Resource Title"
                  value={formData.title}
                  required
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <textarea
                className="modern-input"
                placeholder="Instructions or description for students..."
                rows={3}
                style={{ resize: "none" }}
                value={formData.description}
                required
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div style={styles.formFooter}>
                <div style={styles.fileUpload}>
                  <input
                    type="file"
                    id="syllabus-file-input"
                    style={{ display: "none" }}
                    onChange={(e) => setFile(e.target.files[0])}
                    accept=".pdf,.ppt,.pptx,.doc,.docx"
                  />
                  <label htmlFor="syllabus-file-input" className="modern-btn btn-outline" style={{ margin: 0, cursor: "pointer" }}>
                    {file ? `Selected: ${file.name.substring(0, 15)}...` : "Choose File (PDF/PPT)"}
                  </label>
                </div>
                <button type="submit" className="modern-btn btn-primary">
                  Upload & Post
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MATERIALS LIST */}
        <div style={styles.materialsList}>
          {Object.keys(groupedSyllabus).length > 0 ? (
            Object.keys(groupedSyllabus).map((module) => (
              <div key={module} style={styles.moduleSection}>
                <div style={styles.moduleHeader}>
                  <FaFolderOpen />
                  <span>{module}</span>
                </div>
                <div style={styles.itemsGrid}>
                  {groupedSyllabus[module].map((s) => (
                    <div key={s.syllabusId} className="premium-card" style={styles.itemCard}>
                      <div style={styles.itemTag}>
                        <div style={styles.fileIcon}>{getFileIcon(s.fileLink)}</div>
                      </div>
                      <div style={styles.itemContent}>
                        <div style={styles.itemTop}>
                          <h4 style={styles.itemTitle}>{s.title}</h4>
                          {role !== "STUDENT" && (
                            <button
                              style={styles.deleteBtn}
                              onClick={() => handleDelete(s.syllabusId)}
                            >
                              <FaTrash size={12} />
                            </button>
                          )}
                        </div>
                        <p style={styles.itemDesc}>{s.description}</p>
                        <div style={styles.itemFooter}>
                          <a href={getFullFileUrl(s.fileLink)} target="_blank" rel="noreferrer" style={styles.downloadLink}>
                            <FaExternalLinkAlt size={10} /> View Material
                          </a>
                          <div style={styles.itemDate}>
                            <FaClock size={10} /> {new Date(s.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            selectedId && (
              <div className="premium-card" style={styles.empty}>
                <FaFolderOpen size={30} style={{ opacity: 0.3, marginBottom: "12px" }} />
                <p>No materials posted for this class yet.</p>
              </div>
            )
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
  selectorWrapper: {
    marginBottom: "32px",
  },
  chipGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "12px",
  },
  chip: {
    padding: "12px 16px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "all 0.2s",
  },
  chipIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "rgba(0,0,0,0.03)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-muted)",
    fontSize: "14px",
  },
  chipText: {
    flex: 1,
  },
  mainGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },
  sectionTitle: {
    fontSize: "18px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "12px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  formFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  moduleSection: {
    marginBottom: "32px",
  },
  moduleHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "16px",
    fontWeight: "700",
    color: "var(--primary-color)",
    marginBottom: "16px",
    paddingBottom: "8px",
    borderBottom: "2px solid rgba(30, 136, 229, 0.1)",
  },
  itemsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
  },
  itemCard: {
    padding: "0",
    display: "flex",
    border: "1px solid var(--border-color)",
    boxShadow: "none",
    overflow: "hidden",
  },
  itemTag: {
    width: "60px",
    backgroundColor: "rgba(0,0,0,0.02)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRight: "1px solid var(--border-color)",
  },
  fileIcon: {
    fontSize: "24px",
  },
  itemContent: {
    flex: 1,
    padding: "16px 20px",
  },
  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "8px",
  },
  itemTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
  },
  itemDesc: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: "1.5",
    marginBottom: "16px",
  },
  itemFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  downloadLink: {
    fontSize: "13px",
    fontWeight: "700",
    color: "var(--primary-color)",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  itemDate: {
    fontSize: "12px",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  empty: {
    textAlign: "center",
    padding: "40px",
    color: "var(--text-muted)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "var(--text-muted)",
  },
  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
  },
};

export default Syllabus;
