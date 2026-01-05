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

  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [syllabusList, setSyllabusList] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fileLink: "",
  });

  useEffect(() => {
    fetchClassSubjects();
  }, []);

  const fetchClassSubjects = async () => {
    try {
      const res = await getAllClassSubjects();
      let all = res.data || [];

      if (role === "TEACHER") {
        all = all.filter((cs) => cs.teacherId === userId);
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

    const dto = {
      classSubjectId: selectedId,
      title: formData.title,
      description: formData.description,
      fileLink: formData.fileLink,
      uploadedById: userId,
    };

    try {
      await createOrUpdateSyllabus(dto);
      fetchSyllabus(selectedId);
      setFormData({ title: "", description: "", fileLink: "" });
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

  return (
    <div className="page-layout">
      <Sidebar />

      <div className="content-area">
        <Navbar />

        <div className="content-wrapper">

          <h2 className="page-title">📘 Manage Syllabus</h2>

          {/* CLASS-SUBJECT SELECT */}
          <div className="card">
            <h3>Select Class & Subject</h3>

            {classSubjects.length === 0 ? (
              <p className="empty-text">No classes assigned.</p>
            ) : (
              <div className="chip-scroll">
                {classSubjects.map((cs) => (
                  <button
                    key={cs.id}
                    className={`chip ${selectedId === cs.id ? "chip-active" : ""}`}
                    onClick={() => fetchSyllabus(cs.id)}
                  >
                    {cs.classroomName || cs.classroom?.name} —{" "}
                    {cs.subjectName || cs.subject?.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* UPLOAD FORM */}
          {selectedId && (
            <div className="card">
              <h3>Upload Syllabus</h3>

              <form onSubmit={handleSubmit} className="form-grid">
                <input
                  type="text"
                  placeholder="Syllabus Title"
                  value={formData.title}
                  required
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />

                <textarea
                  placeholder="Description"
                  value={formData.description}
                  required
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />

                <input
                  type="text"
                  placeholder="File Link"
                  value={formData.fileLink}
                  required
                  onChange={(e) => setFormData({ ...formData, fileLink: e.target.value })}
                />

                <button type="submit" className="btn-primary">
                  Upload
                </button>
              </form>
            </div>
          )}

          {/* SYLLABUS LIST */}
          {syllabusList.length > 0 && (
            <div className="card">
              <h3>Existing Syllabus</h3>

              <div className="syllabus-list">
                {syllabusList.map((s) => (
                  <div key={s.syllabusId} className="syllabus-card">
                    <div className="syllabus-info">
                      <strong className="syllabus-title">{s.title}</strong>
                      <p className="syllabus-desc">{s.description}</p>

                      <a href={s.fileLink} target="_blank" rel="noreferrer" className="file-link">
                        📂 Open File
                      </a>
                    </div>

                    <button className="delete-btn" onClick={() => handleDelete(s.syllabusId)}>
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedId && syllabusList.length === 0 && (
            <p className="empty-text">No syllabus found for this class-subject.</p>
          )}
        </div>
      </div>

      {/* ------------------ CSS ------------------ */}
      <style>{`
        .page-layout { display: flex; }

        .content-area {
          flex: 1;
          background: #f3f5f9;
          min-height: 100vh;
        }

        .content-wrapper {
          padding: 25px;
          max-width: 900px;
          margin: auto;
        }

        .page-title {
          font-size: 28px;
          font-weight: 700;
          color: #0a4275;
          text-align: center;
          margin-bottom: 25px;
        }

        .card {
          background: #fff;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
          margin-bottom: 25px;
        }

        .chip-scroll {
          display: flex;
          overflow-x: auto;
          gap: 10px;
          padding: 10px 0;
        }

        .chip {
          padding: 8px 14px;
          border-radius: 20px;
          background: #e6e9ef;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          font-weight: 500;
        }

        .chip-active {
          background: #0a4275;
          color: white;
        }

        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        input, textarea {
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #ccc;
          font-size: 15px;
        }

        textarea {
          height: 80px;
        }

        .btn-primary {
          background: #0a4275;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          margin-top: 10px;
        }

        .syllabus-list {
          display: grid;
          gap: 15px;
        }

        .syllabus-card {
          background: #f7f9fc;
          padding: 14px;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .file-link {
          color: #0a4275;
          font-size: 14px;
        }

        .delete-btn {
          background: #d9534f;
          border: none;
          color: white;
          padding: 8px 10px;
          border-radius: 6px;
          cursor: pointer;
        }

        .empty-text {
          color: gray;
          font-style: italic;
        }

        /* MOBILE FIXES */
        @media (max-width: 600px) {
          .content-wrapper { padding: 15px; }
          .syllabus-card { flex-direction: column; align-items: flex-start; gap: 10px; }
          .chip { font-size: 13px; }
        }
      `}</style>
    </div>
  );
};

export default Syllabus;
