package com.academicportal.controller.hod;

import com.academicportal.entity.Role;
import com.academicportal.entity.User;
import com.academicportal.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/hod/dashboard")
public class HodDashboardController {

    private final UserRepository userRepository;

    public HodDashboardController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getDashboard(@AuthenticationPrincipal User hod) {
        if (hod.getRole() != Role.HOD) {
            return ResponseEntity.status(403).body(Map.of("error", "Access Denied"));
        }

        if (hod.getDepartment() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "HOD has no department assigned"));
        }

        Integer deptId = hod.getDepartment().getId();
        int studentsCount = userRepository.findByDepartmentIdAndRole(deptId, Role.STUDENT).size();
        int staffCount = userRepository.findByDepartmentIdAndRole(deptId, Role.STAFF).size();

        Map<String, Object> stats = new HashMap<>();
        stats.put("departmentName", hod.getDepartment().getName());
        stats.put("departmentCode", hod.getDepartment().getCode());
        stats.put("studentsCount", studentsCount);
        stats.put("staffCount", staffCount);

        return ResponseEntity.ok(stats);
    }
}
