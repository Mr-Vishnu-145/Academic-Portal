package com.academicportal.repository;

import com.academicportal.entity.Assessment;
import com.academicportal.entity.AssessmentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface AssessmentRepository extends JpaRepository<Assessment, Integer> {
    List<Assessment> findByDepartmentIdAndStudyYearAndType(Integer departmentId, Integer studyYear, AssessmentType type);

    @Query("SELECT a FROM Assessment a WHERE a.type = :type AND a.dueDate = :targetDate")
    List<Assessment> findDueOn(@Param("type") AssessmentType type, @Param("targetDate") java.time.LocalDate targetDate);

    @Query("SELECT a FROM Assessment a WHERE a.type = :type AND a.dueDate BETWEEN :startDate AND :endDate")
    List<Assessment> findDueBetween(@Param("type") AssessmentType type, @Param("startDate") java.time.LocalDate startDate, @Param("endDate") java.time.LocalDate endDate);

    default List<Assessment> findDueWithin(AssessmentType type, int days) {
        return findDueOn(type, java.time.LocalDate.now().plusDays(days));
    }

    default List<Assessment> findWithinDays(AssessmentType type, int days) {
        java.time.LocalDate today = java.time.LocalDate.now();
        return findDueBetween(type, today, today.plusDays(days));
    }
}
