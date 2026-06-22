package com.academicportal.controller.staff;

import com.academicportal.entity.Role;
import com.academicportal.entity.User;
import com.academicportal.repository.UserRepository;
import com.academicportal.service.AccessScopeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff/students")
public class StaffStudentController {

    private final AccessScopeService accessScopeService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public StaffStudentController(AccessScopeService accessScopeService,
                                  UserRepository userRepository,
                                  PasswordEncoder passwordEncoder) {
        this.accessScopeService = accessScopeService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PreAuthorize("hasAnyRole('STAFF','HOD','ADMIN')")
    @GetMapping
    public ResponseEntity<List<User>> getMyStudents(@AuthenticationPrincipal User user) {
        List<User> students = accessScopeService.getAccessibleStudents(user);
        return ResponseEntity.ok(students);
    }

    @PreAuthorize("hasRole('STAFF')")
    @PostMapping
    public ResponseEntity<?> addStudent(@AuthenticationPrincipal User staff, @RequestBody Map<String, Object> payload) {
        try {
            String name = (String) payload.get("name");
            String email = (String) payload.get("email");
            String phone = (String) payload.get("phone");
            String password = (String) payload.get("password");
            
            // Handle parsing year safely (integer or string)
            Object yearObj = payload.get("year");
            Integer year;
            if (yearObj instanceof Number) {
                year = ((Number) yearObj).intValue();
            } else {
                year = Integer.parseInt(yearObj.toString());
            }
            
            String registerNumber = (String) payload.get("registerNumber");

            if (userRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
            }
            if (userRepository.findByIdentifier(registerNumber).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Register Number already registered"));
            }

            User student = new User();
            student.setName(name);
            student.setEmail(email);
            student.setPhone(phone);
            student.setPasswordHash(passwordEncoder.encode(password));
            student.setRole(Role.STUDENT);
            student.setDepartment(staff.getDepartment());
            student.setYear(year);
            student.setRegisterNumber(registerNumber);
            student.setIsActive(true);
            student.setCreatedAt(LocalDateTime.now());

            User saved = userRepository.save(student);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
