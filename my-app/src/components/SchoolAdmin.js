import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { Link } from "react-router-dom";
import { getDecodedToken } from "../utils/authHelper";
import "./../styles/SchoolAdmin.css";

import {
  getTeachersBySchool,
  getStudentsBySchool,
  getAllAnnouncements,
  getAllClassrooms,
  createAnnouncement,
  deleteAnnouncement
} from "../utils/api";

const SchoolAdmin = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;
  const schoolName = decoded?.schoolName || "Your School";

  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    classroomId: "",
  });

  /**==================================================
   * LOAD DATA
   ==================================================**/
  useEffect(() => {
    if (!schoolId) return;

    const fetchData = async () => {
      try {
        const [teacherRes, studentRes, announcementRes, classroomRes] =
          await Promise.all([
            getTeachersBySchool(schoolId),
            getStudentsBySchool(schoolId),
            getAllAnnouncements(),
            getAllClassrooms(schoolId),
          ]);

        setTeachers(teacherRes.data);
        setStudents(studentRes.data);
        setAnnouncements(
          announcementRes.data.sort(
            (a, b) => new Date(b.postedAt) - new Date(a.postedAt)
          )
        );
        setClassrooms(classroomRes.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [schoolId]);

  const approvedTeachers = teachers.filter(t => t.approvalStatus === "APPROVED");
  const approvedStudents = students.filter(s => s.approvalStatus === "APPROVED");

  /**==================================================
   * CREATE ANNOUNCEMENT
   ==================================================**/
  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      alert("Title and message are required!");
      return;
    }

    try {
      await createAnnouncement({
        ...newAnnouncement,
        userId: decoded.userId,
        schoolId: decoded.schoolId,
        classroomId: newAnnouncement.classroomId || null,
      });

      alert("Announcement created!");

      setNewAnnouncement({ title: "", message: "", classroomId: "" });

      const res = await getAllAnnouncements();
      setAnnouncements(
        res.data.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
      );

    } catch (err) {
      console.error(err);
      alert("Failed to create announcement!");
    }
  };

  /**==================================================
   * DELETE ANNOUNCEMENT
   ==================================================**/
  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      await deleteAnnouncement(announcementId);
      alert("Announcement deleted!");

      const res = await getAllAnnouncements();
      setAnnouncements(
        res.data.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to delete announcement!");
    }
  };

  /**==================================================
   * UI
   ==================================================**/
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div className="school-admin-container" style={{ marginLeft: "250px", width: "100%" }}>
        <h2 className="school-admin-title">{schoolName} - Admin Dashboard</h2>

        {/* SUMMARY CARDS */}
        <div className="summary-container">
          <div className="summary-card">
            <h3>Teachers</h3>
            <p>Total: {teachers.length}</p>
            <p className="summary-approved">Approved: {approvedTeachers.length}</p>
          </div>

          <div className="summary-card">
            <h3>Students</h3>
            <p>Total: {students.length}</p>
            <p className="summary-approved">Approved: {approvedStudents.length}</p>
          </div>
        </div>

        {/* CREATE ANNOUNCEMENT */}
        <div className="announcement-box">
          <h3>📢 Create Announcement</h3>

          <div className="input-group">
            <label>Title:</label>
            <input
              type="text"
              value={newAnnouncement.title}
              onChange={(e) =>
                setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
              }
            />
          </div>

          <div className="input-group">
            <label>Message:</label>
            <textarea
              value={newAnnouncement.message}
              onChange={(e) =>
                setNewAnnouncement({ ...newAnnouncement, message: e.target.value })
              }
            ></textarea>
          </div>

          <div className="input-group">
            <label>Audience:</label>
            <select
              value={newAnnouncement.classroomId}
              onChange={(e) =>
                setNewAnnouncement({ ...newAnnouncement, classroomId: e.target.value })
              }
            >
              <option value="">School-wide Announcement</option>
              {classrooms.map((cls) => (
                <option key={cls.classId} value={cls.classId}>
                  {cls.name} - {cls.section}
                </option>
              ))}
            </select>
          </div>

          <button onClick={handleCreateAnnouncement} className="post-btn">
            Post Announcement
          </button>
        </div>

        {/* ANNOUNCEMENT LIST */}
        <div className="announcement-list">
          <h3>📢 Latest Announcements</h3>

          {announcements.length === 0 ? (
            <p>No announcements yet.</p>
          ) : (
            announcements.map((a) => (
              <div key={a.announcementId} className="announcement-item">
                <h4>{a.title}</h4>
                <p>{a.message}</p>

                <small className="announcement-meta">
                  Posted on: {new Date(a.postedAt).toLocaleString()}
                </small>

                <p className="announcement-audience">
                  {a.classroomId
                    ? `Classroom: ${a.classroomId}`
                    : "School-wide announcement"}
                </p>

                {/* BUTTONS */}
                <div className="announcement-buttons">
                  <button className="btn-view">View</button>

                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteAnnouncement(a.announcementId)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SchoolAdmin;
