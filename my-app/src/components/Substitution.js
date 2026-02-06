import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { getDecodedToken } from "../utils/authHelper";
import {
    getAllClassrooms,
    getAllTimetables,
    getSubstitutionsByDate,
    createSubstitution,
    deleteSubstitution,
    getFreeTeachers,
} from "../utils/api";

const Substitution = () => {
    const decoded = getDecodedToken();
    const schoolId = decoded?.schoolId;

    const [classrooms, setClassrooms] = useState([]);
    const [timetables, setTimetables] = useState([]);
    const [substitutions, setSubstitutions] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedPeriod, setSelectedPeriod] = useState("");
    const [freeTeachers, setFreeTeachers] = useState([]);
    const [selectedSubstituteId, setSelectedSubstituteId] = useState("");
    const [reason, setReason] = useState("");

    const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const periods = [1, 2, 3, 4, 5, 6, 7];

    useEffect(() => {
        if (!schoolId) return;
        const fetchData = async () => {
            try {
                const [clsRes, ttRes, subRes] = await Promise.all([
                    getAllClassrooms(schoolId),
                    getAllTimetables(),
                    getSubstitutionsByDate(selectedDate),
                ]);
                setClassrooms(clsRes.data);
                setTimetables(ttRes.data);
                setSubstitutions(subRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [schoolId, selectedDate]);

    const handleDateChange = (e) => setSelectedDate(e.target.value);

    const findFreeTeachersForPeriod = async () => {
        if (!selectedDate || !selectedPeriod) {
            alert("Please select date and period");
            return;
        }
        const dayName = daysOfWeek[new Date(selectedDate).getDay()];
        if (dayName === "SUN") {
            alert("Sunday is a holiday");
            return;
        }

        try {
            const res = await getFreeTeachers(selectedDate, Number(selectedPeriod));
            setFreeTeachers(res.data);
        } catch (err) {
            console.error(err);
            alert("Error fetching free teachers");
        }
    };

    const handleAddSubstitution = async () => {
        if (!selectedClassId || !selectedPeriod || !selectedSubstituteId) {
            alert("Fill all fields");
            return;
        }

        const dayName = daysOfWeek[new Date(selectedDate).getDay()];
        const ttEntry = timetables.find(t =>
            t.classroomId === Number(selectedClassId) &&
            t.dayOfWeek === dayName &&
            t.periodNumber === Number(selectedPeriod)
        );

        if (!ttEntry) {
            alert("No class scheduled for this classroom at this period");
            return;
        }

        const payload = {
            timetableId: ttEntry.timetableId,
            date: selectedDate,
            originalTeacherId: ttEntry.teacherId,
            substituteTeacherId: Number(selectedSubstituteId),
            reason: reason || "Absent"
        };

        try {
            await createSubstitution(payload);
            alert("Substitution added");
            const res = await getSubstitutionsByDate(selectedDate);
            setSubstitutions(res.data);
            // Reset
            setSelectedSubstituteId("");
            setReason("");
        } catch (err) {
            console.error(err);
            alert("Error saving substitution");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this substitution?")) return;
        try {
            await deleteSubstitution(id);
            setSubstitutions(substitutions.filter(s => s.substitutionId !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ display: "flex" }}>
            <Sidebar />
            <div style={{ marginLeft: "250px", flex: 1 }}>
                <Navbar />
                <div style={{ padding: "20px" }}>
                    <h2>Manage Daily Substitutions</h2>

                    <div style={styles.card}>
                        <h3>Add New Substitution</h3>
                        <div style={styles.formGroup}>
                            <label>Date: </label>
                            <input type="date" value={selectedDate} onChange={handleDateChange} />
                        </div>

                        <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                                <label>Classroom: </label>
                                <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                                    <option value="">Select Class</option>
                                    {classrooms.map(c => (
                                        <option key={c.classId} value={c.classId}>{c.name} {c.section}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label>Period: </label>
                                <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
                                    <option value="">Select Period</option>
                                    {periods.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>

                            <button onClick={findFreeTeachersForPeriod} style={styles.btnAction}>Find Free Teachers</button>
                        </div>

                        {freeTeachers.length > 0 && (
                            <div style={styles.formGrid}>
                                <div style={styles.formGroup}>
                                    <label>Substitute Teacher: </label>
                                    <select value={selectedSubstituteId} onChange={e => setSelectedSubstituteId(e.target.value)}>
                                        <option value="">Select Teacher</option>
                                        {freeTeachers.map(t => <option key={t.userId} value={t.userId}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label>Reason: </label>
                                    <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason (Optional)" />
                                </div>
                                <button onClick={handleAddSubstitution} style={styles.btnSuccess}>Assign Substitution</button>
                            </div>
                        )}
                    </div>

                    <div style={styles.card}>
                        <h3>Active Substitutions for {selectedDate}</h3>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>Class</th>
                                    <th>Period</th>
                                    <th>Substitute</th>
                                    <th>Reason</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {substitutions.map(s => {
                                    const tt = timetables.find(t => t.timetableId === s.timetableId);
                                    const clsName = classrooms.find(c => c.classId === tt?.classroomId)?.name || "N/A";
                                    const teacherName = freeTeachers.find(t => t.userId === s.substituteTeacherId)?.name || "Teacher ID: " + s.substituteTeacherId;
                                    return (
                                        <tr key={s.substitutionId}>
                                            <td>{clsName}</td>
                                            <td>{tt?.periodNumber}</td>
                                            <td>{teacherName}</td>
                                            <td>{s.reason}</td>
                                            <td>
                                                <button onClick={() => handleDelete(s.substitutionId)} style={styles.btnDanger}>Remove</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {substitutions.length === 0 && <tr><td colSpan="5">No substitutions found for this date</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    card: {
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        marginBottom: "20px",
    },
    formGroup: {
        marginBottom: "15px",
        display: "flex",
        flexDirection: "column",
        gap: "5px"
    },
    formGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr auto",
        gap: "20px",
        alignItems: "end",
        marginBottom: "20px"
    },
    btnAction: {
        padding: "10px 15px",
        backgroundColor: "#2196F3",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer"
    },
    btnSuccess: {
        padding: "10px 15px",
        backgroundColor: "#4CAF50",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer"
    },
    btnDanger: {
        padding: "5px 10px",
        backgroundColor: "#f44336",
        color: "white",
        border: "none",
        borderRadius: "3px",
        cursor: "pointer"
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "10px",
        textAlign: "left"
    }
};

export default Substitution;
