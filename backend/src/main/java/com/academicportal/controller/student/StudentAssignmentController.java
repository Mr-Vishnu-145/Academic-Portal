package com.academicportal.controller.student;

import com.academicportal.entity.*;
import com.academicportal.service.AssignmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student/assignments")
public class StudentAssignmentController {

    private final AssignmentService assignmentService;

    public StudentAssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @GetMapping
    public ResponseEntity<?> getAssignments(@AuthenticationPrincipal User student) {
        if (student.getDepartment() == null || student.getYear() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Student has no department/year"));
        }
        
        List<Assessment> list = assignmentService.getAssignmentsForClass(
                student.getDepartment().getId(), student.getYear());
        return ResponseEntity.ok(list);
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submit(@AuthenticationPrincipal User student, @RequestBody Map<String, Object> payload) {
        try {
            Integer assignmentId = (Integer) payload.get("assignmentId");
            String fileUrl = (String) payload.get("fileUrl");
            
            AssessmentRecord submission = assignmentService.submitAssignment(assignmentId, student, fileUrl);
            return ResponseEntity.ok(submission);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
