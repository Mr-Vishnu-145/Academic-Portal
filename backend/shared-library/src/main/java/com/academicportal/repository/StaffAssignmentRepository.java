package com.academicportal.repository;

import com.academicportal.entity.StaffAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StaffAssignmentRepository extends JpaRepository<StaffAssignment, Integer> {
    List<StaffAssignment> findByStaffId(Integer staffId);
    List<StaffAssignment> findByDepartmentIdAndYearAssigned(Integer departmentId, Integer yearAssigned);
}
