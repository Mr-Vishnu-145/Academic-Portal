package com.academicportal.controller.student;

import com.academicportal.entity.*;
import com.academicportal.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/student/dashboard")
public class StudentDashboardController {

    private final AttendanceRepository attendanceRepository;
    private final CgpaSummaryRepository cgpaSummaryRepository;
    private final AssessmentRepository assessmentRepository;

    public StudentDashboardController(AttendanceRepository attendanceRepository,
                                      CgpaSummaryRepository cgpaSummaryRepository,
                                      AssessmentRepository assessmentRepository) {
        this.attendanceRepository = attendanceRepository;
        this.cgpaSummaryRepository = cgpaSummaryRepository;
        this.assessmentRepository = assessmentRepository;
    }

    @GetMapping
    public ResponseEntity<?> getDashboard(@AuthenticationPrincipal User student) {
        if (student.getRole() != Role.STUDENT) {
            return ResponseEntity.status(403).body(Map.of("error", "Access Denied"));
        }

        // Calculate attendance percentage
        List<Attendance> attendanceList = attendanceRepository.findByStudentId(student.getId());
        double attendancePercent = 100.0;
        if (!attendanceList.isEmpty()) {
            long presentCount = attendanceList.stream()
                    .filter(a -> a.getStatus() == AttendanceStatus.PRESENT || a.getStatus() == AttendanceStatus.OD)
                    .count();
            attendancePercent = (double) presentCount * 100.0 / attendanceList.size();
        }

        // Fetch latest CGPA
        List<CgpaSummary> cgpaList = cgpaSummaryRepository.findByStudentId(student.getId());
        double cgpa = 0.0;
        if (!cgpaList.isEmpty()) {
            cgpa = cgpaList.get(cgpaList.size() - 1).getCgpa().doubleValue();
        }

        // Fetch pending assignments count
        List<Assessment> assignments = assessmentRepository.findByDepartmentIdAndStudyYearAndType(
                student.getDepartment().getId(), student.getYear() != null ? student.getYear() : 1, AssessmentType.ASSIGNMENT);
        long pendingAssignments = assignments.size(); // Simplified count

        // Fetch next exam
        List<Assessment> exams = assessmentRepository.findByDepartmentIdAndStudyYearAndType(
                student.getDepartment().getId(), student.getYear() != null ? student.getYear() : 1, AssessmentType.EXAM);
        Assessment nextExam = exams.isEmpty() ? null : exams.get(0);

        Map<String, Object> stats = new HashMap<>();
        stats.put("attendancePercentage", Math.round(attendancePercent * 10.0) / 10.0);
        stats.put("cgpa", cgpa);
        stats.put("pendingAssignmentsCount", pendingAssignments);
        stats.put("nextExam", nextExam != null ? nextExam.getSubject().getName() + " on " + nextExam.getDueDate() : "None");

        return ResponseEntity.ok(stats);
    }
}
