package com.academicportal.controller.admin;

import com.academicportal.entity.Department;
import com.academicportal.repository.DepartmentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/departments")
public class AdminDepartmentController {

    private final DepartmentRepository departmentRepository;

    public AdminDepartmentController(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentRepository.findAll());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<?> createDepartment(@RequestBody Map<String, String> payload) {
        try {
            String name = payload.get("name");
            String code = payload.get("code");

            Department dept = new Department();
            dept.setName(name);
            dept.setCode(code);

            Department saved = departmentRepository.save(dept);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
