package com.academicportal.service;

import com.academicportal.entity.ArrearStatus;
import com.academicportal.entity.SemesterResult;
import com.academicportal.repository.SemesterResultRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ArrearService {

    private final SemesterResultRepository resultRepository;

    public ArrearService(SemesterResultRepository resultRepository) {
        this.resultRepository = resultRepository;
    }

    public List<SemesterResult> getStudentArrears(Integer studentId) {
        return resultRepository.findByStudentId(studentId).stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsArrear()) || r.getArrearStatus() != null)
                .collect(Collectors.toList());
    }

    @Transactional
    public SemesterResult clearArrear(Integer resultId, Integer clearedSemester) {
        SemesterResult result = resultRepository.findById(resultId)
                .orElseThrow(() -> new IllegalArgumentException("Arrear result record not found"));

        result.setArrearStatus(ArrearStatus.CLEARED);
        result.setClearedSemester(clearedSemester);
        return resultRepository.save(result);
    }
}
