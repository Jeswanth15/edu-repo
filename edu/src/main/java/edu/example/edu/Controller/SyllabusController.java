package edu.example.edu.Controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.example.edu.DTO.SyllabusDTO;
import edu.example.edu.Service.SyllabusService;

@RestController
@RequestMapping("/api/syllabus")
public class SyllabusController {

    private final SyllabusService syllabusService;

    public SyllabusController(SyllabusService syllabusService) {
        this.syllabusService = syllabusService;
    }

    // Create or update
    @PostMapping
    @PreAuthorize("hasAnyAuthority('TEACHER','SCHOOLADMIN','PRINCIPAL')")
    public SyllabusDTO createOrUpdate(@RequestBody SyllabusDTO dto) {
        return syllabusService.saveSyllabus(dto);
    }

    // Get all syllabuses
    @GetMapping
    @PreAuthorize("hasAnyAuthority('STUDENT','TEACHER','SCHOOLADMIN','PRINCIPAL')")
    public List<SyllabusDTO> getAll() {
        return syllabusService.getAllSyllabuses();
    }

    // Get by classSubjectId
    @GetMapping("/classSubject/{id}")
    @PreAuthorize("hasAnyAuthority('STUDENT','TEACHER','SCHOOLADMIN','PRINCIPAL')")
    public List<SyllabusDTO> getByClassSubject(@PathVariable Long id) {
        return syllabusService.getByClassSubject(id);
    }

    // Delete
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SCHOOLADMIN','PRINCIPAL','ADMIN')")
    public String delete(@PathVariable Long id) {
        syllabusService.deleteSyllabus(id);
        return "Syllabus deleted successfully";
    }
}
