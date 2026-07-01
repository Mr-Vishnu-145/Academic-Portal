package com.academicportal.controller.student;

import com.academicportal.entity.*;
import com.academicportal.repository.CgpaSummaryRepository;
import com.academicportal.service.CgpaCalculationService;
import com.academicportal.service.MarksService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/student/marks")
public class StudentMarksController {

    private final MarksService marksService;
    private final CgpaCalculationService gpaService;
    private final CgpaSummaryRepository cgpaSummaryRepository;

    public StudentMarksController(MarksService marksService,
                                  CgpaCalculationService gpaService,
                                  CgpaSummaryRepository cgpaSummaryRepository) {
        this.marksService = marksService;
        this.gpaService = gpaService;
        this.cgpaSummaryRepository = cgpaSummaryRepository;
    }

    @GetMapping("/internal")
    public ResponseEntity<?> getInternalMarks(@AuthenticationPrincipal User student) {
        return ResponseEntity.ok(marksService.getStudentMarks(student.getId()));
    }

    @GetMapping("/gpa")
    public ResponseEntity<?> getGpaSummary(@AuthenticationPrincipal User student) {
        List<CgpaSummary> summaries = cgpaSummaryRepository.findByStudentId(student.getId());
        double overallCgpa = gpaService.calculateCGPA(student.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("semesters", summaries);
        response.put("overallCgpa", overallCgpa);
        return ResponseEntity.ok(response);
    }
}
