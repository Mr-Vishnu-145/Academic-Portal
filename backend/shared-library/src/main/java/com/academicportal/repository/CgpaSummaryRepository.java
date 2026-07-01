package com.academicportal.repository;

import com.academicportal.entity.CgpaSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CgpaSummaryRepository extends JpaRepository<CgpaSummary, Integer> {
    List<CgpaSummary> findByStudentId(Integer studentId);
    Optional<CgpaSummary> findByStudentIdAndSemester(Integer studentId, Integer semester);
}
