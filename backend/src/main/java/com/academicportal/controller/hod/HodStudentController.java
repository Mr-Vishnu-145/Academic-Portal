package com.academicportal.controller.hod;

import com.academicportal.entity.Role;
import com.academicportal.entity.User;
import com.academicportal.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hod/students")
public class HodStudentController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public HodStudentController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<?> getDeptStudents(@AuthenticationPrincipal User hod) {
        if (hod.getRole() != Role.HOD || hod.getDepartment() == null) {
            return ResponseEntity.status(403).body(Map.of("error", "Access Denied"));
        }
        
        List<User> students = userRepository.findByDepartmentIdAndRole(
                hod.getDepartment().getId(), Role.STUDENT);
        return ResponseEntity.ok(students);
    }

    @PostMapping
    public ResponseEntity<?> addStudent(@AuthenticationPrincipal User hod, @RequestBody Map<String, Object> payload) {
        if (hod.getRole() != Role.HOD || hod.getDepartment() == null) {
            return ResponseEntity.status(403).body(Map.of("error", "Access Denied"));
        }

        try {
            String name = (String) payload.get("name");
            String email = (String) payload.get("email");
            String phone = (String) payload.get("phone");
            String password = (String) payload.get("password");
            
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
            student.setDepartment(hod.getDepartment());
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
