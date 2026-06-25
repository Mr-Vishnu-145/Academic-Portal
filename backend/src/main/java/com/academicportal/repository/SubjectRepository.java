package com.academicportal.repository;

import com.academicportal.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Integer> {
    List<Subject> findByDepartmentId(Integer departmentId);
    List<Subject> findByDepartmentIdAndSemester(Integer departmentId, Integer semester);
    Optional<Subject> findByCode(String code);
}
