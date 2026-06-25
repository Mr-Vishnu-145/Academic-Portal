package com.academicportal.repository;

import com.academicportal.entity.ExamSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExamScheduleRepository extends JpaRepository<ExamSchedule, Integer> {
    
    @Query("SELECT e FROM ExamSchedule e WHERE " +
           "(e.assignmentType = 'INDIVIDUAL' AND e.student.id = :studentId) OR " +
           "(e.assignmentType = 'YEAR' AND e.department.id = :deptId AND e.studyYear = :year) OR " +
           "(e.assignmentType = 'SECTION' AND e.department.id = :deptId AND e.studyYear = :year AND e.section = :section) OR " +
           "(e.assignmentType = 'DEPARTMENT' AND e.department.id = :deptId)")
    List<ExamSchedule> findStudentExams(
        @Param("studentId") Integer studentId,
        @Param("deptId") Integer deptId,
        @Param("year") Integer year,
        @Param("section") String section
    );

    List<ExamSchedule> findByDepartmentId(Integer departmentId);
}
