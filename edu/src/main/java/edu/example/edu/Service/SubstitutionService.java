package edu.example.edu.Service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import edu.example.edu.DTO.SubstitutionDTO;
import edu.example.edu.Entity.Substitution;
import edu.example.edu.Entity.Timetable;
import edu.example.edu.Entity.User;
import edu.example.edu.Repository.SubstitutionRepository;
import edu.example.edu.Repository.TimetableRepository;
import edu.example.edu.Repository.UserRepository;

@Service
public class SubstitutionService {

    @Autowired
    private SubstitutionRepository substitutionRepository;

    @Autowired
    private TimetableRepository timetableRepository;

    @Autowired
    private UserRepository userRepository;

    // ➕ Create or Update Substitution
    public SubstitutionDTO saveSubstitution(SubstitutionDTO dto) {
        Timetable timetable = timetableRepository.findById(dto.getTimetableId())
                .orElseThrow(() -> new RuntimeException("Timetable not found"));
        User originalTeacher = userRepository.findById(dto.getOriginalTeacherId())
                .orElseThrow(() -> new RuntimeException("Original teacher not found"));
        User substituteTeacher = userRepository.findById(dto.getSubstituteTeacherId())
                .orElseThrow(() -> new RuntimeException("Substitute teacher not found"));

        Substitution substitution = new Substitution();
        substitution.setSubstitutionId(dto.getSubstitutionId());
        substitution.setTimetable(timetable);
        substitution.setDate(dto.getDate());
        substitution.setOriginalTeacher(originalTeacher);
        substitution.setSubstituteTeacher(substituteTeacher);
        substitution.setReason(dto.getReason());

        Substitution saved = substitutionRepository.save(substitution);
        return convertToDTO(saved);
    }

    // 📜 Get all
    public List<SubstitutionDTO> getAllSubstitutions() {
        return substitutionRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // 📅 Get by date
    public List<SubstitutionDTO> getSubstitutionsByDate(java.time.LocalDate date) {
        return substitutionRepository.findByDate(date).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // 👨‍🏫 Get by substitute teacher
    public List<SubstitutionDTO> getBySubstituteTeacher(Long teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        return substitutionRepository.findBySubstituteTeacher(teacher).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ❌ Delete
    public void deleteSubstitution(Long id) {
        substitutionRepository.deleteById(id);
    }

    // 🔄 Convert Entity → DTO
    private SubstitutionDTO convertToDTO(Substitution substitution) {
        SubstitutionDTO dto = new SubstitutionDTO();
        dto.setSubstitutionId(substitution.getSubstitutionId());
        dto.setTimetableId(substitution.getTimetable().getTimetableId());
        dto.setDate(substitution.getDate());
        dto.setOriginalTeacherId(substitution.getOriginalTeacher().getUserId());
        dto.setSubstituteTeacherId(substitution.getSubstituteTeacher().getUserId());
        dto.setReason(substitution.getReason());
        return dto;
    }
}
