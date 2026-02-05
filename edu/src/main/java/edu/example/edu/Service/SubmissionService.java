package edu.example.edu.Service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import edu.example.edu.DTO.SubmissionDTO;
import edu.example.edu.Entity.Assignment;
import edu.example.edu.Entity.Submission;
import edu.example.edu.Entity.User;
import edu.example.edu.Repository.AssignmentRepository;
import edu.example.edu.Repository.SubmissionRepository;
import edu.example.edu.Repository.UserRepository;

@Service
public class SubmissionService {

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private UserRepository userRepository;

    private SubmissionDTO toDTO(Submission submission) {
        SubmissionDTO dto = new SubmissionDTO();
        dto.setSubmissionId(submission.getSubmissionId());
        dto.setAssignmentId(submission.getAssignment().getAssignmentId());
        dto.setStudentId(submission.getStudent().getUserId());
        dto.setSubmissionDate(submission.getSubmissionDate());
        dto.setFileLink(submission.getFileLink());
        dto.setGrade(submission.getGrade());
        dto.setFeedback(submission.getFeedback());
        return dto;
    }

    private Submission toEntity(SubmissionDTO dto) {
        Submission submission = new Submission();
        submission.setSubmissionId(dto.getSubmissionId());

        Assignment assignment = assignmentRepository.findById(dto.getAssignmentId())
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        User student = userRepository.findById(dto.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setSubmissionDate(dto.getSubmissionDate());
        submission.setFileLink(dto.getFileLink());
        submission.setGrade(dto.getGrade());
        submission.setFeedback(dto.getFeedback());

        return submission;
    }

    public SubmissionDTO saveSubmission(SubmissionDTO dto) {
        Submission submission = toEntity(dto);
        Submission saved = submissionRepository.save(submission);
        return toDTO(saved);
    }

    public List<SubmissionDTO> getAllSubmissions() {
        return submissionRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<SubmissionDTO> getSubmissionsByAssignment(Long assignmentId) {
        return submissionRepository.findByAssignment_AssignmentId(assignmentId).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    public List<SubmissionDTO> getSubmissionsByStudent(Long studentId) {
        return submissionRepository.findByStudent_UserId(studentId).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    public void deleteSubmission(Long submissionId) {
        submissionRepository.deleteById(submissionId);
    }

    public SubmissionDTO gradeSubmission(Long submissionId, String grade) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));
        submission.setGrade(grade);
        Submission saved = submissionRepository.save(submission);
        return toDTO(saved);
    }
    public List<SubmissionDTO> getSubmissionsByAssignmentAndStudent(Long assignmentId, Long studentId) {
        return submissionRepository
                .findByAssignment_AssignmentIdAndStudent_UserId(assignmentId, studentId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    public SubmissionDTO updateGradeAndFeedback(Long submissionId, String grade, String feedback) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));
        submission.setGrade(grade);
        submission.setFeedback(feedback);
        Submission saved = submissionRepository.save(submission);
        return toDTO(saved);
    }

}
