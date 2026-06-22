package com.academicportal.controller.hod;

import com.academicportal.entity.*;
import com.academicportal.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hod/staff")
public class HodStaffController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public HodStaffController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<?> getDeptStaff(@AuthenticationPrincipal User hod) {
        if (hod.getRole() != Role.HOD || hod.getDepartment() == null) {
            return ResponseEntity.status(403).body(Map.of("error", "Access Denied"));
        }
        List<User> staffList = userRepository.findByDepartmentIdAndRole(
                hod.getDepartment().getId(), Role.STAFF);
        return ResponseEntity.ok(staffList);
    }

    @PostMapping("/add")
    public ResponseEntity<?> addStaff(@AuthenticationPrincipal User hod, @RequestBody Map<String, Object> payload) {
        if (hod.getRole() != Role.HOD || hod.getDepartment() == null) {
            return ResponseEntity.status(403).body(Map.of("error", "Access Denied"));
        }

        try {
            String name = (String) payload.get("name");
            String email = (String) payload.get("email");
            String phone = (String) payload.get("phone");
            String password = (String) payload.get("password");
            Integer year = (Integer) payload.get("year"); // Assigned year

            User staff = new User();
            staff.setName(name);
            staff.setEmail(email);
            staff.setPhone(phone);
            staff.setPasswordHash(passwordEncoder.encode(password));
            staff.setRole(Role.STAFF);
            staff.setDepartment(hod.getDepartment());
            staff.setYear(year);
            staff.setStaffIdCode("STF" + System.currentTimeMillis() % 1000000);
            staff.setIsActive(true);
            staff.setCreatedAt(LocalDateTime.now());

            User saved = userRepository.save(staff);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
