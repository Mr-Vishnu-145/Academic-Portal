package com.academicportal.repository;

import com.academicportal.entity.MarkImportLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MarkImportLogRepository extends JpaRepository<MarkImportLog, Integer> {
    List<MarkImportLog> findByDepartmentId(Integer departmentId);
}
