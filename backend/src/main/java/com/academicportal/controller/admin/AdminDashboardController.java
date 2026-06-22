package com.academicportal.controller.admin;

import com.academicportal.entity.Role;
import com.academicportal.entity.User;
import com.academicportal.repository.DepartmentRepository;
import com.academicportal.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    public AdminDashboardController(UserRepository userRepository, DepartmentRepository departmentRepository) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
    }

    @GetMapping
    public ResponseEntity<?> getStats(@AuthenticationPrincipal User admin) {
        if (admin.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Access Denied"));
        }

        long totalUsers = userRepository.count();
        long totalDepartments = departmentRepository.count();
        long studentCount = userRepository.findByRole(Role.STUDENT).size();
        long staffCount = userRepository.findByRole(Role.STAFF).size();
        long hodCount = userRepository.findByRole(Role.HOD).size();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalDepartments", totalDepartments);
        stats.put("studentCount", studentCount);
        stats.put("staffCount", staffCount);
        stats.put("hodCount", hodCount);

        return ResponseEntity.ok(stats);
    }
}
