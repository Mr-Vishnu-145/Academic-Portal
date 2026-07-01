package com.academicportal.repository;

import com.academicportal.entity.AssessmentRecord;
import com.academicportal.entity.AssessmentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface AssessmentRecordRepository extends JpaRepository<AssessmentRecord, Integer> {
    Optional<AssessmentRecord> findByAssessmentIdAndStudentId(Integer assessmentId, Integer studentId);
    List<AssessmentRecord> findByAssessmentId(Integer assessmentId);
    List<AssessmentRecord> findByStudentId(Integer studentId);
    @Query("SELECT r FROM AssessmentRecord r WHERE r.student.id = :studentId AND r.assessment.type = :type")
    List<AssessmentRecord> findByStudentIdAndAssessmentType(@Param("studentId") Integer studentId, @Param("type") AssessmentType type);

    @Query("SELECT r FROM AssessmentRecord r WHERE r.student.id = :studentId AND r.assessment.subject.id = :subjectId")
    List<AssessmentRecord> findByStudentIdAndAssessmentSubjectId(@Param("studentId") Integer studentId, @Param("subjectId") Integer subjectId);
}
