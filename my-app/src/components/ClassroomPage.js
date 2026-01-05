import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { getDecodedToken } from "../utils/authHelper";
import {
  getAllClassrooms,
  createClassroom,
  getTeachersBySchool,
  deleteClassroom,
} from "../utils/api";

import "./../styles/ClassroomPage.css";

const ClassroomPage = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [teacherId, setTeacherId] = useState("");

  const fetchClassrooms = async () => {
    try {
      const res = await getAllClassrooms(schoolId);
      setClassrooms(res.data.filter((c) => c.schoolId === schoolId));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await getTeachersBySchool(schoolId);
      setTeachers(res.data.filter((t) => t.approvalStatus === "APPROVED"));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (schoolId) {
      fetchClassrooms();
      fetchTeachers();
    }
  }, [schoolId]);

  const handleCreate = async () => {
    if (!name) return alert("Class name is required");

    try {
      await createClassroom({
        name,
        section,
        schoolId,
        classTeacherId: teacherId ? Number(teacherId) : null,
      });

      setName("");
      setSection("");
      setTeacherId("");

      fetchClassrooms();
    } catch (err) {
      console.error(err);
      alert("Failed to create classroom");
    }
  };

  const handleDelete = async (classId) => {
    if (!window.confirm("Are you sure you want to delete?")) return;

    try {
      await deleteClassroom(classId);
      fetchClassrooms();
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  return (
    <div className="page-container">
      <Sidebar />

      <div className="classroom-content">
        <h1 className="title">Manage Classrooms</h1>

        {/* CREATE FORM */}
        <div className="form-box">
          <h2>Create Classroom</h2>

          <div className="form-grid">
            <input
              type="text"
              placeholder="Class Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="text"
              placeholder="Section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            />

            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            >
              <option value="">Assign Teacher (optional)</option>
              {teachers.map((t) => (
                <option key={t.userId} value={t.userId}>
                  {t.name}
                </option>
              ))}
            </select>

            <button className="create-btn" onClick={handleCreate}>
              Create
            </button>
          </div>
        </div>

        {/* CLASSROOM LIST */}
        <h2 className="subtitle">Classroom List</h2>

        {classrooms.length === 0 ? (
          <p>No classrooms found.</p>
        ) : (
          <div className="classroom-grid">
            {classrooms.map((c) => (
              <div key={c.classId} className="classroom-card">
                <h3>
                  {c.name} {c.section && `- ${c.section}`}
                </h3>

                <p className="teacher">
                  Teacher: {c.classTeacherName || "Not Assigned"}
                </p>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(c.classId)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomPage;
