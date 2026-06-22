package com.academicportal.service;

import com.academicportal.entity.CgpaSummary;
import com.academicportal.entity.SemesterResult;
import com.academicportal.entity.User;
import com.academicportal.repository.CgpaSummaryRepository;
import com.academicportal.repository.SemesterResultRepository;
import com.academicportal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CgpaCalculationService {

    private final SemesterResultRepository resultRepository;
    private final CgpaSummaryRepository cgpaSummaryRepository;
    private final UserRepository userRepository;

    public CgpaCalculationService(SemesterResultRepository resultRepository,
                                  CgpaSummaryRepository cgpaSummaryRepository,
                                  UserRepository userRepository) {
        this.resultRepository = resultRepository;
        this.cgpaSummaryRepository = cgpaSummaryRepository;
        this.userRepository = userRepository;
    }

    public double calculateSGPA(int studentId, int semester) {
        List<SemesterResult> results = resultRepository.findByStudentIdAndSemester(studentId, semester);
        if (results.isEmpty()) {
            return 0.0;
        }

        double totalGradePoints = 0;
        int totalCredits = 0;

        for (SemesterResult r : results) {
            totalGradePoints += r.getGradePoint().doubleValue() * r.getCredits();
            totalCredits += r.getCredits();
        }

        if (totalCredits == 0) return 0.0;
        return totalGradePoints / totalCredits;
    }

    public double calculateCGPA(int studentId) {
        List<CgpaSummary> allSemesters = cgpaSummaryRepository.findByStudentId(studentId);
        if (allSemesters.isEmpty()) {
            return 0.0;
        }

        double totalWeighted = 0;
        int totalCredits = 0;

        for (CgpaSummary sem : allSemesters) {
            totalWeighted += sem.getSgpa().doubleValue() * sem.getTotalCredits();
            totalCredits += sem.getTotalCredits();
        }

        if (totalCredits == 0) return 0.0;
        return totalWeighted / totalCredits;
    }

    @Transactional
    public CgpaSummary recalculateAndSaveGpa(int studentId, int semester) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));

        double sgpaVal = calculateSGPA(studentId, semester);
        
        List<SemesterResult> results = resultRepository.findByStudentIdAndSemester(studentId, semester);
        int semesterCredits = results.stream().mapToInt(SemesterResult::getCredits).sum();

        // Check if summary already exists for this semester
        Optional<CgpaSummary> existingOpt = cgpaSummaryRepository.findByStudentIdAndSemester(studentId, semester);
        CgpaSummary summary = existingOpt.orElse(new CgpaSummary());
        
        summary.setStudent(student);
        summary.setSemester(semester);
        summary.setSgpa(BigDecimal.valueOf(sgpaVal).setScale(2, RoundingMode.HALF_UP));
        summary.setTotalCredits(semesterCredits);
        
        // Save first so it's included in CGPA calculations
        cgpaSummaryRepository.saveAndFlush(summary);
        
        // Now calculate cumulative CGPA
        double cgpaVal = calculateCGPA(studentId);
        summary.setCgpa(BigDecimal.valueOf(cgpaVal).setScale(2, RoundingMode.HALF_UP));
        summary.setCalculatedAt(LocalDateTime.now());
        
        return cgpaSummaryRepository.save(summary);
    }
}
