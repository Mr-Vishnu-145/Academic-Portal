package com.academicportal.controller.staff;

import com.academicportal.entity.AssessmentRecord;
import com.academicportal.entity.User;
import com.academicportal.service.MarksService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/staff/marks")
public class StaffMarksController {

    private final MarksService marksService;

    public StaffMarksController(MarksService marksService) {
        this.marksService = marksService;
    }

    @PreAuthorize("hasAnyRole('STAFF','HOD','ADMIN')")
    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            @AuthenticationPrincipal User staff,
            @RequestBody Map<String, Object> payload) {
        try {
            Integer studentId = com.academicportal.util.TypeParser.parseInt(payload.get("studentId"));
            Integer subjectId = com.academicportal.util.TypeParser.parseInt(payload.get("subjectId"));
            String assessmentType = (String) payload.get("assessmentType");
            Integer maxMarks = com.academicportal.util.TypeParser.parseInt(payload.get("maxMarks"));
            double scoredMarks = Double.parseDouble(payload.get("scoredMarks").toString());

            AssessmentRecord mark = marksService.saveInternalMark(
                    studentId, subjectId, assessmentType, maxMarks, scoredMarks, staff);
            return ResponseEntity.ok(mark);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
