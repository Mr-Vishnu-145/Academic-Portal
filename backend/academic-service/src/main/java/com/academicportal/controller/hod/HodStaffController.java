package com.academicportal.controller.hod;

import com.academicportal.entity.*;
import com.academicportal.repository.DepartmentRepository;
import com.academicportal.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final SimpMessagingTemplate messagingTemplate;

    public HodStaffController(UserRepository userRepository, DepartmentRepository departmentRepository,
                               PasswordEncoder passwordEncoder, SimpMessagingTemplate messagingTemplate) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.messagingTemplate = messagingTemplate;
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
            Integer year = com.academicportal.util.TypeParser.parseInt(payload.get("year")); // Assigned year
            String staffIdCode = (String) payload.get("staffIdCode");
            String designation = (String) payload.get("designation");

            if (userRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
            }
            if (staffIdCode != null && !staffIdCode.trim().isEmpty() && userRepository.findByIdentifier(staffIdCode).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Employee ID / Staff Code already registered"));
            }

            User staff = new User();
            staff.setName(name);
            staff.setEmail(email);
            staff.setPhone(phone);
            staff.setPasswordHash(passwordEncoder.encode(password));
            staff.setRole(Role.STAFF);
            staff.setDepartment(hod.getDepartment());
            staff.setYear(year);
            if (staffIdCode != null && !staffIdCode.trim().isEmpty()) {
                staff.setStaffIdCode(staffIdCode);
            } else {
                staff.setStaffIdCode("STF" + System.currentTimeMillis() % 1000000);
            }
            staff.setDesignation(designation);
            staff.setIsActive(true);
            staff.setCreatedAt(LocalDateTime.now());

            User saved = userRepository.save(staff);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
     }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStaff(@AuthenticationPrincipal User hod, @PathVariable Integer id, @RequestBody Map<String, Object> payload) {
        if (hod.getRole() != Role.HOD || hod.getDepartment() == null) {
            return ResponseEntity.status(403).body(Map.of("error", "Access Denied"));
        }

        try {
            User staff = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Staff not found"));

            if (!staff.getDepartment().getId().equals(hod.getDepartment().getId()) || staff.getRole() != Role.STAFF) {
                return ResponseEntity.status(403).body(Map.of("error", "Access Denied"));
            }

            if (payload.containsKey("name")) staff.setName((String) payload.get("name"));
            if (payload.containsKey("email")) {
                String email = (String) payload.get("email");
                if (!email.equalsIgnoreCase(staff.getEmail()) && userRepository.findByEmail(email).isPresent()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
                }
                staff.setEmail(email);
            }
            if (payload.containsKey("phone")) staff.setPhone((String) payload.get("phone"));
            if (payload.containsKey("password") && payload.get("password") != null && !payload.get("password").toString().isEmpty()) {
                staff.setPasswordHash(passwordEncoder.encode((String) payload.get("password")));
            }
            if (payload.containsKey("year")) {
                Object yearObj = payload.get("year");
                Integer year;
                if (yearObj instanceof Number) {
                    year = ((Number) yearObj).intValue();
                } else {
                    year = Integer.parseInt(yearObj.toString());
                }
                staff.setYear(year);
            }
            if (payload.containsKey("staffIdCode")) {
                String staffIdCode = (String) payload.get("staffIdCode");
                if (staffIdCode != null && !staffIdCode.equalsIgnoreCase(staff.getStaffIdCode()) && userRepository.findByIdentifier(staffIdCode).isPresent()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Employee ID / Staff Code already registered"));
                }
                staff.setStaffIdCode(staffIdCode);
            }
            if (payload.containsKey("designation")) staff.setDesignation((String) payload.get("designation"));
            if (payload.containsKey("departmentId")) {
                Object deptIdObj = payload.get("departmentId");
                if (deptIdObj != null) {
                    Integer deptId = (deptIdObj instanceof Number) ? ((Number) deptIdObj).intValue() : Integer.parseInt(deptIdObj.toString());
                    Department dept = departmentRepository.findById(deptId)
                            .orElseThrow(() -> new IllegalArgumentException("Department not found"));
                    staff.setDepartment(dept);
                    // Broadcast department transfer via WebSocket
                    User saved = userRepository.save(staff);
                    messagingTemplate.convertAndSend("/topic/staff-updates", Map.of(
                        "type", "DEPT_TRANSFER",
                        "staffId", saved.getId(),
                        "staffName", saved.getName(),
                        "newDeptCode", dept.getCode(),
                        "newDeptName", dept.getName()
                    ));
                    return ResponseEntity.ok(saved);
                }
            }
            if (payload.containsKey("isActive")) staff.setIsActive((Boolean) payload.get("isActive"));

            User saved = userRepository.save(staff);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStaff(@AuthenticationPrincipal User hod, @PathVariable Integer id) {
        if (hod.getRole() != Role.HOD || hod.getDepartment() == null) {
            return ResponseEntity.status(403).body(Map.of("error", "Access Denied"));
        }
        try {
            User staff = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Staff not found"));
            if (!staff.getDepartment().getId().equals(hod.getDepartment().getId()) || staff.getRole() != Role.STAFF) {
                return ResponseEntity.status(403).body(Map.of("error", "Access Denied"));
            }
            staff.setIsActive(false);
            userRepository.save(staff);
            return ResponseEntity.ok(Map.of("message", "Staff deactivated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
