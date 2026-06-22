package com.academicportal.controller.staff;

import com.academicportal.entity.*;
import com.academicportal.service.AssignmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff/assignments")
public class StaffAssignmentController {

    private final AssignmentService assignmentService;

    public StaffAssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @PreAuthorize("hasAnyRole('STAFF','HOD','ADMIN')")
    @PostMapping("/create")
    public ResponseEntity<?> create(
            @AuthenticationPrincipal User staff,
            @RequestBody Map<String, Object> payload) {
        try {
            Integer subjectId = (Integer) payload.get("subjectId");
            String title = (String) payload.get("title");
            String description = (String) payload.get("description");
            LocalDate dueDate = LocalDate.parse((String) payload.get("dueDate"));
            Integer maxMarks = (Integer) payload.get("maxMarks");

            Assessment assignment = assignmentService.createAssignment(
                    subjectId, title, description, dueDate, maxMarks, staff);
            return ResponseEntity.ok(assignment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasAnyRole('STAFF','HOD','ADMIN')")
    @GetMapping("/{id}/submissions")
    public ResponseEntity<List<AssessmentRecord>> getSubmissions(@PathVariable Integer id) {
        return ResponseEntity.ok(assignmentService.getSubmissionsForAssignment(id));
    }

    @PreAuthorize("hasAnyRole('STAFF','HOD','ADMIN')")
    @PostMapping("/grade")
    public ResponseEntity<?> grade(
            @AuthenticationPrincipal User staff,
            @RequestBody Map<String, Object> payload) {
        try {
            Integer submissionId = (Integer) payload.get("submissionId");
            double marks = Double.parseDouble(payload.get("marks").toString());

            AssessmentRecord graded = assignmentService.gradeSubmission(submissionId, marks, staff);
            return ResponseEntity.ok(graded);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
