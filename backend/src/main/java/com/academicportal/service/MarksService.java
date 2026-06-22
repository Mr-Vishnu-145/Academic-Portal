package com.academicportal.service;

import com.academicportal.entity.*;
import com.academicportal.repository.AssessmentRepository;
import com.academicportal.repository.AssessmentRecordRepository;
import com.academicportal.repository.SubjectRepository;
import com.academicportal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class MarksService {

    private final AssessmentRepository assessmentRepository;
    private final AssessmentRecordRepository recordRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    public MarksService(AssessmentRepository assessmentRepository,
                        AssessmentRecordRepository recordRepository,
                        SubjectRepository subjectRepository,
                        UserRepository userRepository) {
        this.assessmentRepository = assessmentRepository;
        this.recordRepository = recordRepository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
    }

    public List<AssessmentRecord> getStudentMarks(Integer studentId) {
        return recordRepository.findByStudentIdAndAssessmentType(studentId, AssessmentType.EXAM);
    }

    @Transactional
    public AssessmentRecord saveInternalMark(Integer studentId, Integer subjectId, String assessmentTypeStr,
                                          Integer maxMarks, double scoredMarks, User enteredBy) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new IllegalArgumentException("Subject not found"));

        String subType = assessmentTypeStr.toUpperCase(); // e.g. CAT1, CAT2, MODEL

        // Find or create the Assessment for this exam subType
        List<Assessment> assessments = assessmentRepository.findByDepartmentIdAndStudyYearAndType(
                subject.getDepartment().getId(), student.getYear() != null ? student.getYear() : 1, AssessmentType.EXAM);
        
        Assessment examAssessment = assessments.stream()
                .filter(a -> a.getSubject().getId().equals(subjectId) && a.getSubType().equalsIgnoreCase(subType))
                .findFirst()
                .orElseGet(() -> {
                    Assessment newExam = new Assessment();
                    newExam.setSubject(subject);
                    newExam.setType(AssessmentType.EXAM);
                    newExam.setSubType(subType);
                    newExam.setTitle(subType + " Exam for " + subject.getName());
                    newExam.setDueDate(LocalDate.now()); // Default to today
                    newExam.setMaxMarks(maxMarks);
                    newExam.setUploadedBy(enteredBy);
                    newExam.setDepartment(subject.getDepartment());
                    newExam.setStudyYear(student.getYear() != null ? student.getYear() : 1);
                    return assessmentRepository.save(newExam);
                });

        // Check if record already exists for student and this exam assessment
        AssessmentRecord record = recordRepository.findByAssessmentIdAndStudentId(examAssessment.getId(), studentId)
                .orElse(new AssessmentRecord());

        record.setAssessment(examAssessment);
        record.setStudent(student);
        record.setScoredMarks(BigDecimal.valueOf(scoredMarks).setScale(2, RoundingMode.HALF_UP));
        record.setStatus(AssessmentRecordStatus.GRADED);
        record.setGradedBy(enteredBy);
        record.setGradedAt(LocalDateTime.now());

        return recordRepository.save(record);
    }
}
