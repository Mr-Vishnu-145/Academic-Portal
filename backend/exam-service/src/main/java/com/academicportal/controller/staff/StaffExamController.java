package com.academicportal.controller.staff;

import com.academicportal.entity.Assessment;
import com.academicportal.entity.User;
import com.academicportal.service.ExamScheduleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;

@RestController
@RequestMapping("/api/staff/exams")
public class StaffExamController {

    private final ExamScheduleService examScheduleService;

    public StaffExamController(ExamScheduleService examScheduleService) {
        this.examScheduleService = examScheduleService;
    }

    @PreAuthorize("hasAnyRole('STAFF','HOD','ADMIN')")
    @PostMapping("/create")
    public ResponseEntity<?> create(
            @AuthenticationPrincipal User staff,
            @RequestBody Map<String, Object> payload) {
        try {
            Integer subjectId = com.academicportal.util.TypeParser.parseInt(payload.get("subjectId"));
            String examType = (String) payload.get("examType");
            LocalDate examDate = LocalDate.parse((String) payload.get("examDate"));
            LocalTime examTime = LocalTime.parse((String) payload.get("examTime"));
            String hallNumber = (String) payload.get("hallNumber");

            Assessment schedule = examScheduleService.createExamSchedule(
                    subjectId, examType, examDate, examTime, hallNumber, staff);
            return ResponseEntity.ok(schedule);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
