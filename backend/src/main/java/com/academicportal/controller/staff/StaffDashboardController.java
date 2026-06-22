package com.academicportal.controller.staff;

import com.academicportal.entity.*;
import com.academicportal.repository.AssessmentRepository;
import com.academicportal.repository.StaffAssignmentRepository;
import com.academicportal.service.AccessScopeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/staff/dashboard")
public class StaffDashboardController {

    private final StaffAssignmentRepository staffAssignmentRepository;
    private final AssessmentRepository assessmentRepository;
    private final AccessScopeService accessScopeService;

    public StaffDashboardController(StaffAssignmentRepository staffAssignmentRepository,
                                    AssessmentRepository assessmentRepository,
                                    AccessScopeService accessScopeService) {
        this.staffAssignmentRepository = staffAssignmentRepository;
        this.assessmentRepository = assessmentRepository;
        this.accessScopeService = accessScopeService;
    }

    @GetMapping
    public ResponseEntity<?> getDashboard(@AuthenticationPrincipal User staff) {
        if (staff.getRole() != Role.STAFF) {
            return ResponseEntity.status(403).body(Map.of("error", "Access Denied"));
        }

        int subjectsCount = staffAssignmentRepository.findByStaffId(staff.getId()).size();
        int studentsCount = accessScopeService.getAccessibleStudents(staff).size();
        int assignmentsCount = assessmentRepository.findByDepartmentIdAndStudyYearAndType(
                staff.getDepartment().getId(), staff.getYear() != null ? staff.getYear() : 1, AssessmentType.ASSIGNMENT).size();

        Map<String, Object> stats = new HashMap<>();
        stats.put("subjectsHandled", subjectsCount);
        stats.put("studentsCount", studentsCount);
        stats.put("assignmentsUploaded", assignmentsCount);
        stats.put("assignedYear", staff.getYear());

        return ResponseEntity.ok(stats);
    }
}
