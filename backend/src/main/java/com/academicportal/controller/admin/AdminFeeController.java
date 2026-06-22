package com.academicportal.controller.admin;

import com.academicportal.entity.Department;
import com.academicportal.entity.FeeStructure;
import com.academicportal.repository.DepartmentRepository;
import com.academicportal.repository.FeeStructureRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/fees/structures")
@PreAuthorize("hasRole('ADMIN')")
public class AdminFeeController {

    private final FeeStructureRepository feeStructureRepository;
    private final DepartmentRepository departmentRepository;

    public AdminFeeController(FeeStructureRepository feeStructureRepository,
                              DepartmentRepository departmentRepository) {
        this.feeStructureRepository = feeStructureRepository;
        this.departmentRepository = departmentRepository;
    }

    @GetMapping
    public ResponseEntity<List<FeeStructure>> getAllFeeStructures() {
        return ResponseEntity.ok(feeStructureRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> createFeeStructure(@RequestBody Map<String, Object> payload) {
        try {
            Integer departmentId = (Integer) payload.get("departmentId");
            Integer year = (Integer) payload.get("year");
            String feeType = (String) payload.get("feeType");
            double amount = Double.parseDouble(payload.get("amount").toString());
            LocalDate dueDate = LocalDate.parse((String) payload.get("dueDate"));
            String academicYear = (String) payload.get("academicYear");

            Department dept = departmentRepository.findById(departmentId)
                    .orElseThrow(() -> new IllegalArgumentException("Department not found"));

            FeeStructure fs = new FeeStructure();
            fs.setDepartment(dept);
            fs.setYear(year);
            fs.setFeeType(feeType);
            fs.setAmount(BigDecimal.valueOf(amount));
            fs.setDueDate(dueDate);
            fs.setAcademicYear(academicYear);

            FeeStructure saved = feeStructureRepository.save(fs);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
