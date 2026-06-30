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

        // Step 1: Calculate CGPA from existing saved summaries BEFORE touching this semester's row.
        // This avoids the NOT NULL constraint violation on 'cgpa' during a premature saveAndFlush.
        double cgpaVal = 0.0;
        List<CgpaSummary> existingSummaries = cgpaSummaryRepository.findByStudentId(studentId);
        if (existingSummaries.isEmpty()) {
            // Very first semester — CGPA equals SGPA
            cgpaVal = sgpaVal;
        } else {
            // Include all other semesters + this semester's contribution
            double totalWeighted = 0;
            int totalCredits = 0;
            for (CgpaSummary sem : existingSummaries) {
                if (sem.getSemester() != semester) { // exclude current semester row if it already exists
                    totalWeighted += sem.getSgpa().doubleValue() * sem.getTotalCredits();
                    totalCredits += sem.getTotalCredits();
                }
            }
            // Add current semester contribution
            totalWeighted += sgpaVal * semesterCredits;
            totalCredits += semesterCredits;
            cgpaVal = (totalCredits == 0) ? 0.0 : totalWeighted / totalCredits;
        }

        // Step 2: Load or create summary row, then set ALL fields before saving.
        Optional<CgpaSummary> existingOpt = cgpaSummaryRepository.findByStudentIdAndSemester(studentId, semester);
        CgpaSummary summary = existingOpt.orElse(new CgpaSummary());

        summary.setStudent(student);
        summary.setSemester(semester);
        summary.setSgpa(BigDecimal.valueOf(sgpaVal).setScale(2, RoundingMode.HALF_UP));
        summary.setCgpa(BigDecimal.valueOf(cgpaVal).setScale(2, RoundingMode.HALF_UP));
        summary.setTotalCredits(semesterCredits);
        summary.setCalculatedAt(LocalDateTime.now());

        // Step 3: Single save — all non-nullable fields are populated.
        return cgpaSummaryRepository.save(summary);
    }
}
