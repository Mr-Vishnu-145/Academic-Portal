package com.academicportal.controller.staff;

import com.academicportal.entity.Attendance;
import com.academicportal.entity.User;
import com.academicportal.service.AttendanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff/attendance")
public class StaffAttendanceController {

    private final AttendanceService attendanceService;

    public StaffAttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PreAuthorize("hasAnyRole('STAFF','HOD','ADMIN')")
    @PostMapping("/mark")
    public ResponseEntity<?> markAttendance(
            @AuthenticationPrincipal User staff,
            @RequestBody Map<String, Object> payload) {
        try {
            Integer subjectId = (Integer) payload.get("subjectId");
            LocalDate date = LocalDate.parse((String) payload.get("classDate"));
            
            // Extract map of studentId -> status
            @SuppressWarnings("unchecked")
            Map<String, String> rawMap = (Map<String, String>) payload.get("statuses");
            Map<Integer, String> statuses = new HashMap<>();
            for (Map.Entry<String, String> entry : rawMap.entrySet()) {
                statuses.put(Integer.parseInt(entry.getKey()), entry.getValue());
            }

            List<Attendance> list = attendanceService.markBulkAttendance(subjectId, date, statuses, staff);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
