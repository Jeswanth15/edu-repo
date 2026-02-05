package edu.example.edu.DTO;

import lombok.Data;
@Data
public class ClassSubjectDTO {
    private Long id;

    private Long classroomId;
    private String classroomName;  // new
    private String classroomSection; // new

    private Long subjectId;
    private String subjectName;  // new

    private Long teacherId;
    private String teacherName; // new
}
