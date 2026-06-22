package com.academicportal.controller.admin;

import com.academicportal.entity.*;
import com.academicportal.repository.DepartmentRepository;
import com.academicportal.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserController(UserRepository userRepository,
                               DepartmentRepository departmentRepository,
                               PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> payload) {
        try {
            String name = (String) payload.get("name");
            String email = (String) payload.get("email");
            String phone = (String) payload.get("phone");
            String password = (String) payload.get("password");
            String roleStr = (String) payload.get("role");
            Integer departmentId = (Integer) payload.get("departmentId");
            Integer year = (Integer) payload.get("year");
            String registerNumber = (String) payload.get("registerNumber");
            String staffIdCode = (String) payload.get("staffIdCode");

            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPhone(phone);
            user.setPasswordHash(passwordEncoder.encode(password));
            user.setRole(Role.valueOf(roleStr.toUpperCase()));
            
            if (departmentId != null) {
                Department dept = departmentRepository.findById(departmentId)
                        .orElseThrow(() -> new IllegalArgumentException("Department not found"));
                user.setDepartment(dept);
            }
            
            user.setYear(year);
            user.setRegisterNumber(registerNumber);
            user.setStaffIdCode(staffIdCode);
            user.setIsActive(true);
            user.setCreatedAt(LocalDateTime.now());

            User saved = userRepository.save(user);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Integer id, @RequestBody Map<String, Object> payload) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            if (payload.containsKey("name")) user.setName((String) payload.get("name"));
            if (payload.containsKey("email")) user.setEmail((String) payload.get("email"));
            if (payload.containsKey("phone")) user.setPhone((String) payload.get("phone"));
            if (payload.containsKey("password") && payload.get("password") != null && !payload.get("password").toString().isEmpty()) {
                user.setPasswordHash(passwordEncoder.encode((String) payload.get("password")));
            }
            if (payload.containsKey("role")) user.setRole(Role.valueOf(payload.get("role").toString().toUpperCase()));
            
            if (payload.containsKey("departmentId")) {
                Integer departmentId = (Integer) payload.get("departmentId");
                if (departmentId != null) {
                    Department dept = departmentRepository.findById(departmentId)
                            .orElseThrow(() -> new IllegalArgumentException("Department not found"));
                    user.setDepartment(dept);
                } else {
                    user.setDepartment(null);
                }
            }
            
            if (payload.containsKey("year")) user.setYear((Integer) payload.get("year"));
            if (payload.containsKey("registerNumber")) user.setRegisterNumber((String) payload.get("registerNumber"));
            if (payload.containsKey("staffIdCode")) user.setStaffIdCode((String) payload.get("staffIdCode"));
            if (payload.containsKey("isActive")) user.setIsActive((Boolean) payload.get("isActive"));

            User saved = userRepository.save(user);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            // For production-like logic, we soft-delete by setting isActive = false
            user.setIsActive(false);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
