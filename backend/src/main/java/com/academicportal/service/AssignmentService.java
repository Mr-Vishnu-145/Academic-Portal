package com.academicportal.service;

import com.academicportal.entity.*;
import com.academicportal.repository.AssessmentRepository;
import com.academicportal.repository.AssessmentRecordRepository;
import com.academicportal.repository.SubjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AssignmentService {

    private final AssessmentRepository assessmentRepository;
    private final AssessmentRecordRepository recordRepository;
    private final SubjectRepository subjectRepository;

    public AssignmentService(AssessmentRepository assessmentRepository,
                             AssessmentRecordRepository recordRepository,
                             SubjectRepository subjectRepository) {
        this.assessmentRepository = assessmentRepository;
        this.recordRepository = recordRepository;
        this.subjectRepository = subjectRepository;
    }

    public List<Assessment> getAssignmentsForClass(Integer departmentId, Integer year) {
        return assessmentRepository.findByDepartmentIdAndStudyYearAndType(departmentId, year, AssessmentType.ASSIGNMENT);
    }

    @Transactional
    public Assessment createAssignment(Integer subjectId, String title, String description,
                                      LocalDate dueDate, Integer maxMarks, User uploader) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new IllegalArgumentException("Subject not found"));

        Assessment assignment = new Assessment();
        assignment.setSubject(subject);
        assignment.setType(AssessmentType.ASSIGNMENT);
        assignment.setSubType("ASSIGNMENT");
        assignment.setTitle(title);
        assignment.setDescription(description);
        assignment.setDueDate(dueDate);
        assignment.setMaxMarks(maxMarks);
        assignment.setUploadedBy(uploader);
        assignment.setDepartment(subject.getDepartment());
        assignment.setStudyYear(uploader.getYear() != null ? uploader.getYear() : 1);
        
        return assessmentRepository.save(assignment);
    }

    @Transactional
    public AssessmentRecord submitAssignment(Integer assignmentId, User student, String fileUrl) {
        Assessment assignment = assessmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        AssessmentRecord record = recordRepository.findByAssessmentIdAndStudentId(assignmentId, student.getId())
                .orElse(new AssessmentRecord());

        record.setAssessment(assignment);
        record.setStudent(student);
        record.setFileUrl(fileUrl);
        record.setSubmittedAt(LocalDateTime.now());
        
        if (LocalDate.now().isAfter(assignment.getDueDate())) {
            record.setStatus(AssessmentRecordStatus.LATE);
        } else {
            record.setStatus(AssessmentRecordStatus.SUBMITTED);
        }

        return recordRepository.save(record);
    }

    public List<AssessmentRecord> getSubmissionsForAssignment(Integer assignmentId) {
        return recordRepository.findByAssessmentId(assignmentId);
    }

    @Transactional
    public AssessmentRecord gradeSubmission(Integer recordId, double marks, User grader) {
        AssessmentRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));

        record.setScoredMarks(BigDecimal.valueOf(marks).setScale(2, RoundingMode.HALF_UP));
        record.setStatus(AssessmentRecordStatus.GRADED);
        record.setGradedBy(grader);
        record.setGradedAt(LocalDateTime.now());
        
        return recordRepository.save(record);
    }
}
