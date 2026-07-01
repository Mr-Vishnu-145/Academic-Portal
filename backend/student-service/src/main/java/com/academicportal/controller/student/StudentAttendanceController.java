package com.academicportal.controller.student;

import com.academicportal.entity.User;
import com.academicportal.service.AttendanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student/attendance")
public class StudentAttendanceController {

    private final AttendanceService attendanceService;

    public StudentAttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping
    public ResponseEntity<?> getAttendance(@AuthenticationPrincipal User student) {
        return ResponseEntity.ok(attendanceService.getStudentAttendance(student.getId()));
    }
}
