package com.academicportal.repository;

import com.academicportal.entity.SemesterResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SemesterResultRepository extends JpaRepository<SemesterResult, Integer> {
    List<SemesterResult> findByStudentId(Integer studentId);
    List<SemesterResult> findByStudentIdAndSemester(Integer studentId, Integer semester);
    List<SemesterResult> findByStudentIdAndPublished(Integer studentId, Boolean published);
    List<SemesterResult> findByStudentIdAndSemesterAndPublished(Integer studentId, Integer semester, Boolean published);
    List<SemesterResult> findByStudentIdIn(List<Integer> studentIds);

    @Query("SELECT r FROM SemesterResult r WHERE r.student.department.id = :departmentId AND r.semester = :semester")
    List<SemesterResult> findByDepartmentAndSemester(
        @org.springframework.data.repository.query.Param("departmentId") Integer departmentId, 
        @org.springframework.data.repository.query.Param("semester") Integer semester
    );

    @Query("SELECT COUNT(r) FROM SemesterResult r WHERE r.student.department.id = :departmentId AND r.semester = :semester AND r.published = :published")
    long countByDepartmentAndSemesterAndPublished(
        @org.springframework.data.repository.query.Param("departmentId") Integer departmentId, 
        @org.springframework.data.repository.query.Param("semester") Integer semester, 
        @org.springframework.data.repository.query.Param("published") Boolean published
    );
}
