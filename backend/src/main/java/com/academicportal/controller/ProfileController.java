package com.academicportal.controller;

import com.academicportal.entity.User;
import com.academicportal.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ProfileController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal User user) {
        Map<String, Object> details = new HashMap<>();
        details.put("id", user.getId());
        details.put("name", user.getName());
        details.put("email", user.getEmail());
        details.put("phone", user.getPhone() != null ? user.getPhone() : "");
        details.put("role", user.getRole().name());
        if (user.getDepartment() != null) {
            details.put("departmentName", user.getDepartment().getName());
            details.put("departmentCode", user.getDepartment().getCode());
        } else {
            details.put("departmentName", "N/A");
            details.put("departmentCode", "N/A");
        }
        details.put("year", user.getYear());
        details.put("registerNumber", user.getRegisterNumber() != null ? user.getRegisterNumber() : "");
        details.put("staffIdCode", user.getStaffIdCode() != null ? user.getStaffIdCode() : "");
        details.put("isActive", user.getIsActive());

        return ResponseEntity.ok(details);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> payload) {
        
        String currentPassword = payload.get("currentPassword");
        String newPassword = payload.get("newPassword");

        if (currentPassword == null || newPassword == null || currentPassword.isEmpty() || newPassword.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Both current and new passwords are required"));
        }

        // Fetch fresh user from DB just in case
        User dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(currentPassword, dbUser.getPasswordHash())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Incorrect current password"));
        }

        dbUser.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(dbUser);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
