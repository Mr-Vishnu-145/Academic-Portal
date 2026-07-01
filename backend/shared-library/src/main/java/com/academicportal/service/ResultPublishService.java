package com.academicportal.service;

import com.academicportal.entity.SemesterResult;
import com.academicportal.entity.User;
import com.academicportal.repository.SemesterResultRepository;
import com.academicportal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ResultPublishService {

    private final SemesterResultRepository resultRepository;
    private final CgpaCalculationService cgpaCalculationService;
    private final UserRepository userRepository;

    public ResultPublishService(SemesterResultRepository resultRepository,
                                CgpaCalculationService cgpaCalculationService,
                                UserRepository userRepository) {
        this.resultRepository = resultRepository;
        this.cgpaCalculationService = cgpaCalculationService;
        this.userRepository = userRepository;
    }

    @Transactional
    public void publishSemesterResults(Integer departmentId, Integer semester) {
        // Find all student results for this department and semester
        List<SemesterResult> targetResults = resultRepository.findByDepartmentAndSemester(departmentId, semester);

        if (targetResults.isEmpty()) {
            throw new IllegalArgumentException("No results found to publish for department ID " + departmentId + " and semester " + semester);
        }

        // Publish all of them
        for (SemesterResult r : targetResults) {
            r.setPublished(true);
            r.setPublishedAt(LocalDateTime.now());
            resultRepository.save(r);
        }

        // Recalculate GPA for all affected students
        Set<Integer> studentIds = targetResults.stream()
                .map(r -> r.getStudent().getId())
                .collect(Collectors.toSet());

        for (Integer studentId : studentIds) {
            cgpaCalculationService.recalculateAndSaveGpa(studentId, semester);
        }
    }

    public long getDraftCount(Integer departmentId, Integer semester) {
        return resultRepository.countByDepartmentAndSemesterAndPublished(departmentId, semester, false);
    }
}
