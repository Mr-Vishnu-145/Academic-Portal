package com.academicportal.repository;

import com.academicportal.entity.SemesterResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SemesterResultRepository extends JpaRepository<SemesterResult, Integer> {
    List<SemesterResult> findByStudentId(Integer studentId);
    List<SemesterResult> findByStudentIdAndSemester(Integer studentId, Integer semester);
    List<SemesterResult> findByStudentIdAndPublished(Integer studentId, Boolean published);
    List<SemesterResult> findByStudentIdAndSemesterAndPublished(Integer studentId, Integer semester, Boolean published);
}
