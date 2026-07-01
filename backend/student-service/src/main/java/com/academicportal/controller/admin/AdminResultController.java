package com.academicportal.controller.admin;

import com.academicportal.service.ResultPublishService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/results")
@PreAuthorize("hasAnyRole('ADMIN','HOD')")
public class AdminResultController {

    private final ResultPublishService resultPublishService;

    public AdminResultController(ResultPublishService resultPublishService) {
        this.resultPublishService = resultPublishService;
    }

    @PostMapping("/publish")
    public ResponseEntity<?> publishResults(@RequestBody Map<String, Object> payload) {
        try {
            Integer departmentId = com.academicportal.util.TypeParser.parseInt(payload.get("departmentId"));
            Integer semester = com.academicportal.util.TypeParser.parseInt(payload.get("semester"));

            resultPublishService.publishSemesterResults(departmentId, semester);
            return ResponseEntity.ok(Map.of("message", "Semester results published and GPAs calculated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/draft-count")
    public ResponseEntity<?> getDraftCount(@RequestParam("departmentId") String departmentId, @RequestParam("semester") String semester) {
        try {
            Integer deptId = com.academicportal.util.TypeParser.parseInt(departmentId);
            Integer sem = com.academicportal.util.TypeParser.parseInt(semester);
            long count = resultPublishService.getDraftCount(deptId, sem);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
