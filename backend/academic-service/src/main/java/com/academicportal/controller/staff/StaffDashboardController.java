package com.academicportal.controller.staff;

import com.academicportal.entity.*;
import com.academicportal.repository.AssessmentRepository;
import com.academicportal.repository.StaffAssignmentRepository;
import com.academicportal.repository.SubjectRepository;
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
    private final SubjectRepository subjectRepository;

    public StaffDashboardController(StaffAssignmentRepository staffAssignmentRepository,
                                    AssessmentRepository assessmentRepository,
                                    AccessScopeService accessScopeService,
                                    SubjectRepository subjectRepository) {
        this.staffAssignmentRepository = staffAssignmentRepository;
        this.assessmentRepository = assessmentRepository;
        this.accessScopeService = accessScopeService;
        this.subjectRepository = subjectRepository;
    }

    @GetMapping
    public ResponseEntity<?> getDashboard(@AuthenticationPrincipal User staff) {
        if (staff.getRole() != Role.STAFF) {
            return ResponseEntity.status(403).body(Map.of("error", "Access Denied"));
        }

        int subjectsCount = staffAssignmentRepository.findByStaffId(staff.getId()).size();
        if (subjectsCount == 0 && staff.getDepartment() != null && staff.getYear() != null) {
            int semester1 = 2 * staff.getYear() - 1;
            int semester2 = 2 * staff.getYear();
            subjectsCount = (int) subjectRepository.findByDepartmentId(staff.getDepartment().getId())
                    .stream()
                    .filter(sub -> sub.getSemester() == semester1 || sub.getSemester() == semester2)
                    .count();
        }
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
