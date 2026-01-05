import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { getDecodedToken } from "../utils/authHelper";
import * as XLSX from "xlsx";

import "./../styles/PendingUsers.css";   // <-- IMPORTANT

import {
  getPendingUsersBySchool,
  getTeachersBySchool,
  getStudentsBySchool,
  approveUser,
  rejectUser,
  deleteUser,
  bulkRegister,
} from "../utils/api";

const PendingUsers = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [pendingUsers, setPendingUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [showBulk, setShowBulk] = useState(false);

  useEffect(() => {
    if (schoolId) fetchAll();
  }, [schoolId]);

  const fetchAll = async () => {
    const [p, t, s] = await Promise.all([
      getPendingUsersBySchool(schoolId),
      getTeachersBySchool(schoolId),
      getStudentsBySchool(schoolId),
    ]);

    setPendingUsers(p.data);
    setTeachers(t.data);
    setStudents(s.data);
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws);

      const formatted = json.map((r) => ({
        name: r.name || r.Name,
        email: r.email || r.Email,
        password: r.password || r.Password,
        role: r.role || r.Role,
        schoolId,
      }));

      setExcelData(formatted);
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkSubmit = async () => {
    await bulkRegister(excelData);
    alert("Bulk registered!");
    setExcelData([]);
    setShowBulk(false);
    fetchAll();
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="pending-page">
        <div className="wrapper">

          <h1 className="title">User Management</h1>

          {/* BULK REGISTER */}
          <div className="bulk-box">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h2 className="section-title">Bulk Register Users</h2>

              <button
                className="btn btn-blue"
                style={{ width: "180px" }}
                onClick={() => setShowBulk(!showBulk)}
              >
                {showBulk ? "Close" : "Upload Excel"}
              </button>
            </div>

            {showBulk && (
              <>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  style={{
                    marginTop: "15px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    width: "100%",
                  }}
                />

                {excelData.length > 0 && (
                  <>
                    <div className="bulk-preview">
                      {excelData.map((u, i) => (
                        <div key={i} className="bulk-item">
                          {u.name} — {u.email} — {u.role}
                        </div>
                      ))}
                    </div>

                    <button className="btn btn-green" onClick={handleBulkSubmit}>
                      Submit
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* PENDING USERS */}
          <h2 className="section-title">Pending Users</h2>

          <div className="user-grid">
            {pendingUsers.map((u) => (
              <div key={u.userId} className="user-card">
                <div className="user-name">{u.name}</div>
                <div className="user-role">{u.role}</div>

                <button
                  className="btn btn-green"
                  onClick={() => approveUser(u.userId, schoolId).then(fetchAll)}
                >
                  Approve
                </button>

                <button
                  className="btn btn-yellow"
                  onClick={() => rejectUser(u.userId, schoolId).then(fetchAll)}
                >
                  Reject
                </button>

                <button
                  className="btn btn-red"
                  onClick={() => deleteUser(u.userId).then(fetchAll)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          {/* TEACHERS */}
          <h2 className="section-title">Teachers</h2>
          <div className="table-box">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                </tr>
              </thead>

              <tbody>
                {teachers.map((t) => (
                  <tr key={t.userId}>
                    <td>{t.name}</td>
                    <td>{t.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* STUDENTS */}
          <h2 className="section-title">Students</h2>
          <div className="table-box">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                </tr>
              </thead>

              <tbody>
                {students.map((s) => (
                  <tr key={s.userId}>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PendingUsers;
