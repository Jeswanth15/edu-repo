import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import {
  getAllClassSubjects,
  getSyllabusByClassSubject,
  createOrUpdateSyllabus,
  deleteSyllabus,
} from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

const Syllabus = () => {
  const decoded = getDecodedToken();
  const role = decoded?.role;
  const userId = decoded?.userId;
  const classroomId = decoded?.classroomId;

  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [syllabusList, setSyllabusList] = useState([]);
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
    } else if (formData.fileLink) {
      // If no file but link is provided, we can still send it if backend supports it, 
      // but the current backend expects a file or uses existing link.
      // For now, let's just use file upload for "my device" requirement.
    }

    try {
      await createOrUpdateSyllabus(data);
      fetchSyllabus(selectedId);
      setFormData({ title: "", description: "", moduleName: "", fileLink: "" });
      setFile(null);
      // Reset file input manually
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

  // Group syllabus by modules
  const groupedSyllabus = syllabusList.reduce((acc, current) => {
    const module = current.moduleName || "General Resources";
    if (!acc[module]) acc[module] = [];
    acc[module].push(current);
    return acc;
  }, {});

  const getFileIcon = (url) => {
    if (!url) return "📄";
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.endsWith(".pdf")) return "📕";
    if (lowerUrl.endsWith(".ppt") || lowerUrl.endsWith(".pptx")) return "📙";
    if (lowerUrl.endsWith(".doc") || lowerUrl.endsWith(".docx")) return "📘";
    if (lowerUrl.includes("drive.google.com")) return "📁";
    return "🔗";
  };

  const getFullFileUrl = (url) => {
    if (!url) return "#";
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url}`;
  };

  return (
    <div className="page-layout">
      <Sidebar />

      <div className="content-area">
        <Navbar />

        <div className="content-wrapper">
          <div className="classroom-header">
            <h2 className="page-title">Syllabus & Resources</h2>
            <p className="subtitle">Course materials and modules for your classes</p>
          </div>

          {/* CLASS-SUBJECT SELECT */}
          <div className="class-selector">
            {classSubjects.length === 0 ? (
              <p className="empty-text">No classes assigned.</p>
            ) : (
              <div className="chip-container">
                {classSubjects.map((cs) => (
                  <button
                    key={cs.id}
                    className={`classroom-chip ${selectedId === cs.id ? "active" : ""}`}
                    onClick={() => fetchSyllabus(cs.id)}
                  >
                    <span className="room-icon">🏫</span>
                    <div className="room-info">
                      <strong>{cs.classroomName || cs.classroom?.name}</strong>
                      <span>{cs.subjectName || cs.subject?.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* UPLOAD FORM - Classroom Style Fab/Modal or collapsing section */}
          {selectedId && role !== "STUDENT" && (
            <div className="card upload-section">
              <div className="card-header">
                <h3>Add Material</h3>
                <span className="info-badge">Teacher Mode</span>
              </div>

              <form onSubmit={handleSubmit} className="classroom-form">
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Module / Topic Name (e.g. Unit 1: Introduction)"
                    value={formData.moduleName}
                    onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
                    className="classroom-input full-width"
                  />
                </div>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Material Title"
                    value={formData.title}
                    required
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="classroom-input"
                  />
                  <div className="file-upload-wrapper">
                    <input
                      type="file"
                      id="syllabus-file-input"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="classroom-file-input"
                      accept=".pdf,.ppt,.pptx,.doc,.docx"
                    />
                    <label htmlFor="syllabus-file-input" className="file-input-label">
                      {file ? `📄 ${file.name}` : "📁 Upload File (PDF/PPT)"}
                    </label>
                  </div>
                </div>
                <div className="form-row">
                  <textarea
                    placeholder="Add a description or instructions..."
                    value={formData.description}
                    required
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="classroom-textarea"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="classroom-btn primary">
                    Post Material
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SYLLABUS LIST - Grouped by Module */}
          <div className="stream-container">
            {Object.keys(groupedSyllabus).length > 0 ? (
              Object.keys(groupedSyllabus).map((module) => (
                <div key={module} className="module-group">
                  <div className="module-header">
                    <h4>{module}</h4>
                    <span className="item-count">{groupedSyllabus[module].length} items</span>
                  </div>
                  <div className="module-items">
                    {groupedSyllabus[module].map((s) => (
                      <div key={s.syllabusId} className="classroom-item">
                        <div className="item-icon-circle">
                          {getFileIcon(s.fileLink)}
                        </div>
                        <div className="item-content">
                          <div className="item-main">
                            <strong className="item-title">{s.title}</strong>
                            <span className="item-date">
                              {new Date(s.uploadedAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="item-description">{s.description}</p>
                          <div className="item-attachment">
                            <a href={getFullFileUrl(s.fileLink)} target="_blank" rel="noreferrer" className="attachment-pill">
                              <span className="pill-icon">📎</span>
                              View Attachment
                            </a>
                          </div>
                        </div>
                        {role !== "STUDENT" && (
                          <button
                            className="item-delete-btn"
                            onClick={() => handleDelete(s.syllabusId)}
                            title="Delete material"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              selectedId && <div className="empty-state">
                <div className="empty-icon">📂</div>
                <p>No materials have been posted yet for this class.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .page-layout { display: flex; background: #f8f9fa; min-height: 100vh; }
        .content-area { flex: 1; }
        .content-wrapper { padding: 30px; max-width: 1000px; margin: auto; }

        .classroom-header { margin-bottom: 30px; border-bottom: 1px solid #e0e0e0; padding-bottom: 15px; }
        .page-title { font-size: 32px; color: #1a73e8; margin-bottom: 5px; font-weight: 500; }
        .subtitle { color: #5f6368; font-size: 16px; }

        /* Class Selector */
        .class-selector { margin-bottom: 30px; }
        .chip-container { display: flex; flex-wrap: wrap; gap: 15px; }
        .classroom-chip { 
          display: flex; align-items: center; gap: 12px; padding: 12px 20px; 
          border-radius: 8px; border: 1px solid #dadce0; background: white;
          cursor: pointer; transition: all 0.2s; text-align: left;
        }
        .classroom-chip:hover { background: #f1f3f4; }
        .classroom-chip.active { border-color: #1a73e8; background: #e8f0fe; color: #1a73e8; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        .room-icon { font-size: 24px; }
        .room-info strong { display: block; font-size: 15px; }
        .room-info span { font-size: 13px; color: #5f6368; }
        .active .room-info span { color: #1967d2; }

        /* Upload Section */
        .upload-section { 
          background: white; border-radius: 8px; border: 1px solid #dadce0; 
          padding: 24px; margin-bottom: 40px; box-shadow: 0 1px 2px 0 rgba(60,64,67,0.302), 0 1px 3px 1px rgba(60,64,67,0.149);
        }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .card-header h3 { font-size: 18px; color: #3c4043; font-weight: 500; }
        .info-badge { background: #e8f0fe; color: #1967d2; font-size: 12px; padding: 4px 12px; border-radius: 16px; font-weight: 500; }

        .classroom-form { display: flex; flex-direction: column; gap: 15px; }
        .form-row { display: flex; gap: 15px; }
        .classroom-input { 
          flex: 1; padding: 12px 16px; border-radius: 4px; border: 1px solid #dadce0; 
          background: #f1f3f4; font-size: 15px; transition: border 0.2s;
        }
        .classroom-input:focus { outline: none; border-bottom: 2px solid #1a73e8; background: #fff; }
        .full-width { width: 100%; }

        .file-upload-wrapper { flex: 1; position: relative; }
        .classroom-file-input { width: 0.1px; height: 0.1px; opacity: 0; overflow: hidden; position: absolute; z-index: -1; }
        .file-input-label {
          display: block; padding: 12px 16px; border-radius: 4px; border: 1px dashed #dadce0;
          background: #f8f9fa; color: #5f6368; cursor: pointer; text-align: center;
          transition: all 0.2s; font-size: 14px;
        }
        .file-input-label:hover { background: #e8f0fe; border-color: #1a73e8; color: #1a73e8; }

        .classroom-textarea { 
          width: 100%; min-height: 100px; padding: 12px 16px; border-radius: 4px; 
          border: 1px solid #dadce0; background: #f1f3f4; font-size: 15px; resize: vertical;
        }
        .classroom-textarea:focus { outline: none; border-bottom: 2px solid #1a73e8; background: #fff; }
        .form-actions { display: flex; justify-content: flex-end; }
        .classroom-btn { 
          padding: 10px 24px; border-radius: 4px; font-weight: 500; cursor: pointer; border: none; transition: background 0.2s;
        }
        .classroom-btn.primary { background: #1a73e8; color: white; }
        .classroom-btn.primary:hover { background: #185abc; box-shadow: 0 1px 2px 0 rgba(66,133,244,0.3), 0 1px 3px 1px rgba(66,133,244,0.15); }

        /* Stream / Module View */
        .module-group { margin-bottom: 35px; }
        .module-header { 
          display: flex; align-items: baseline; gap: 15px; 
          border-bottom: 1px solid #1a73e8; margin-bottom: 15px; padding-bottom: 8px;
        }
        .module-header h4 { font-size: 20px; color: #1a73e8; font-weight: 400; margin: 0; }
        .item-count { font-size: 13px; color: #70757a; }

        .module-items { display: flex; flex-direction: column; gap: 12px; }
        .classroom-item { 
          display: flex; gap: 16px; padding: 16px; background: white; 
          border: 1px solid #dadce0; border-radius: 8px; transition: box-shadow 0.2s;
          position: relative;
        }
        .classroom-item:hover { box-shadow: 0 1px 2px 0 rgba(60,64,67,0.302), 0 1px 3px 1px rgba(60,64,67,0.149); }
        
        .item-icon-circle { 
          width: 40px; height: 40px; border-radius: 50%; background: #e8f0fe; 
          display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
        }
        .item-content { flex: 1; }
        .item-main { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
        .item-title { font-size: 16px; color: #3c4043; font-weight: 500; }
        .item-date { font-size: 12px; color: #70757a; }
        .item-description { font-size: 14px; color: #5f6368; margin-bottom: 12px; white-space: pre-wrap; }
        
        .attachment-pill { 
          display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; 
          border: 1px solid #dadce0; border-radius: 4px; font-size: 13px; color: #3c4043; 
          text-decoration: none; transition: background 0.2s;
        }
        .attachment-pill:hover { background: #f8f9fa; border-color: #bdc1c6; }
        .pill-icon { color: #5f6368; }

        .item-delete-btn { 
          position: absolute; top: 12px; right: 12px; background: none; border: none; 
          font-size: 20px; color: #dadce0; cursor: pointer; line-height: 1; transition: color 0.1s;
        }
        .item-delete-btn:hover { color: #d93025; }

        .empty-state { text-align: center; padding: 60px 20px; color: #70757a; }
        .empty-icon { font-size: 48px; margin-bottom: 15px; opacity: 0.5; }

        @media (max-width: 600px) {
          .form-row { flex-direction: column; }
          .content-wrapper { padding: 15px; }
          .classroom-item { flex-direction: row; }
          .item-main { flex-direction: column; }
        }
      `}</style>
    </div>
  );
};

export default Syllabus;
