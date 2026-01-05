package edu.example.edu.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.example.edu.Entity.Attendance;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByStudent_UserId(Long studentId);

    Optional<Attendance> findByAttendanceId(Long attendanceId);

    void deleteByAttendanceId(Long attendanceId);

    // ⭐ MOST IMPORTANT (correct filtering)
    List<Attendance> findByClassroom_ClassIdAndSubject_SubjectIdAndDateAndPeriodNumber(
            Long classId,
            Long subjectId,
            LocalDate date,
            int periodNumber
    );
}
