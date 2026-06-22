package com.academicportal.controller.staff;

import com.academicportal.entity.Role;
import com.academicportal.entity.Subject;
import com.academicportal.entity.User;
import com.academicportal.repository.StaffAssignmentRepository;
import com.academicportal.repository.SubjectRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/staff/subjects")
public class StaffGeneralController {

    private final StaffAssignmentRepository staffAssignmentRepository;
    private final SubjectRepository subjectRepository;

    public StaffGeneralController(StaffAssignmentRepository staffAssignmentRepository,
                                  SubjectRepository subjectRepository) {
        this.staffAssignmentRepository = staffAssignmentRepository;
        this.subjectRepository = subjectRepository;
    }

    @PreAuthorize("hasAnyRole('STAFF','HOD','ADMIN')")
    @GetMapping
    public ResponseEntity<List<Subject>> getMySubjects(@AuthenticationPrincipal User user) {
        if (user.getRole() == Role.ADMIN) {
            return ResponseEntity.ok(subjectRepository.findAll());
        } else if (user.getRole() == Role.HOD) {
            if (user.getDepartment() == null) {
                return ResponseEntity.ok(List.of());
            }
            return ResponseEntity.ok(subjectRepository.findByDepartmentId(user.getDepartment().getId()));
        } else {
            List<Subject> subjects = staffAssignmentRepository.findByStaffId(user.getId())
                    .stream()
                    .map(sa -> sa.getSubject())
                    .collect(Collectors.toList());
            return ResponseEntity.ok(subjects);
        }
    }
}
