package edu.example.edu.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "classrooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Classroom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long classId;

    @Column(nullable = false)
    private String name;

    private String section;

    @ManyToOne
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @ManyToOne
    @JoinColumn(name = "class_teacher_id")
    private User classTeacher;

    @OneToMany(mappedBy = "classroom")
    private List<ClassSubject> classSubjects;

    @OneToMany(mappedBy = "classroom")
    private List<Timetable> timetableEntries;

    @OneToMany(mappedBy = "classroom")
    private List<Enrollment> enrollments;
}
