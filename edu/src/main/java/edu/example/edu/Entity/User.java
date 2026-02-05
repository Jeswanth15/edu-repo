package edu.example.edu.Entity;

import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    public enum Role {
        STUDENT, TEACHER, PRINCIPAL, SCHOOLADMIN, ADMIN
    }

    public enum ApprovalStatus {
        PENDING, APPROVED, REJECTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Enumerated(EnumType.STRING)
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    @ManyToOne
    @JoinColumn(name = "school_id", nullable = true)
    private School school;

    @OneToMany(mappedBy = "teacher")
    private List<ClassSubject> teachingSubjects;

    @OneToMany(mappedBy = "teacher")
    private List<Timetable> timetableEntries;

    @OneToMany(mappedBy = "originalTeacher")
    private List<Substitution> substitutionsAsOriginal;

    @OneToMany(mappedBy = "substituteTeacher")
    private List<Substitution> substitutionsAsSubstitute;

    @OneToMany(mappedBy = "student")
    private List<Enrollment> enrollments;

    @ManyToOne
    @JoinColumn(name = "classroom_id")
    private Classroom classroom;

}
