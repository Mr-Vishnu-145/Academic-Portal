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
            String section = (String) payload.get("section");

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
            student.setSection(section);
            student.setIsActive(true);
            student.setCreatedAt(LocalDateTime.now());

            User saved = userRepository.save(student);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStudent(@AuthenticationPrincipal User hod, @PathVariable Integer id, @RequestBody Map<String, Object> payload) {
        if (hod.getRole() != Role.HOD || hod.getDepartment() == null) {
            return ResponseEntity.status(403).body(Map.of("error", "Access Denied"));
        }

        try {
            User student = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Student not found"));

            if (!student.getDepartment().getId().equals(hod.getDepartment().getId()) || student.getRole() != Role.STUDENT) {
                return ResponseEntity.status(403).body(Map.of("error", "Access Denied"));
            }

            if (payload.containsKey("name")) student.setName((String) payload.get("name"));
            if (payload.containsKey("email")) {
                String email = (String) payload.get("email");
                if (!email.equalsIgnoreCase(student.getEmail()) && userRepository.findByEmail(email).isPresent()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
                }
                student.setEmail(email);
            }
            if (payload.containsKey("phone")) student.setPhone((String) payload.get("phone"));
            if (payload.containsKey("password") && payload.get("password") != null && !payload.get("password").toString().isEmpty()) {
                student.setPasswordHash(passwordEncoder.encode((String) payload.get("password")));
            }
            if (payload.containsKey("year")) {
                Object yearObj = payload.get("year");
                Integer year;
                if (yearObj instanceof Number) {
                    year = ((Number) yearObj).intValue();
                } else {
                    year = Integer.parseInt(yearObj.toString());
                }
                student.setYear(year);
            }
            if (payload.containsKey("registerNumber")) {
                String registerNumber = (String) payload.get("registerNumber");
                if (registerNumber != null && !registerNumber.equalsIgnoreCase(student.getRegisterNumber()) && userRepository.findByIdentifier(registerNumber).isPresent()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Register Number already registered"));
                }
                student.setRegisterNumber(registerNumber);
            }
            if (payload.containsKey("section")) student.setSection((String) payload.get("section"));
            if (payload.containsKey("isActive")) student.setIsActive((Boolean) payload.get("isActive"));

            User saved = userRepository.save(student);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStudent(@AuthenticationPrincipal User hod, @PathVariable Integer id) {
        if (hod.getRole() != Role.HOD || hod.getDepartment() == null) {
            return ResponseEntity.status(403).body(Map.of("error", "Access Denied"));
        }
        try {
            User student = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Student not found"));
            if (!student.getDepartment().getId().equals(hod.getDepartment().getId()) || student.getRole() != Role.STUDENT) {
                return ResponseEntity.status(403).body(Map.of("error", "Access Denied"));
            }
            student.setIsActive(false);
            userRepository.save(student);
            return ResponseEntity.ok(Map.of("message", "Student deactivated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
