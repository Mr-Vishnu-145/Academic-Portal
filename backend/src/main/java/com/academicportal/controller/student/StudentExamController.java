package com.academicportal.controller.student;

import com.academicportal.entity.*;
import com.academicportal.service.ArrearService;
import com.academicportal.service.ExamScheduleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student/exams")
public class StudentExamController {

    private final ExamScheduleService examScheduleService;
    private final ArrearService arrearService;

    public StudentExamController(ExamScheduleService examScheduleService, ArrearService arrearService) {
        this.examScheduleService = examScheduleService;
        this.arrearService = arrearService;
    }

    @GetMapping("/schedule")
    public ResponseEntity<?> getExamSchedule(@AuthenticationPrincipal User student) {
        if (student.getDepartment() == null || student.getYear() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Student has no department/year"));
        }
        
        List<Assessment> schedule = examScheduleService.getExamScheduleForClass(
                student.getDepartment().getId(), student.getYear());
        return ResponseEntity.ok(schedule);
    }

    @GetMapping("/arrears")
    public ResponseEntity<?> getArrears(@AuthenticationPrincipal User student) {
        List<SemesterResult> arrears = arrearService.getStudentArrears(student.getId());
        return ResponseEntity.ok(arrears);
    }
}
