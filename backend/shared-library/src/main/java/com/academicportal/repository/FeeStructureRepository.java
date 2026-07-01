package com.academicportal.repository;

import com.academicportal.entity.FeeStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface FeeStructureRepository extends JpaRepository<FeeStructure, Integer> {
    List<FeeStructure> findByDepartmentIdAndYear(Integer departmentId, Integer year);
    
    @Query("SELECT f FROM FeeStructure f WHERE f.dueDate BETWEEN :startDate AND :endDate")
    List<FeeStructure> findFeesDueBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    default List<FeeStructure> findDueWithin(int days) {
        LocalDate today = LocalDate.now();
        LocalDate targetDate = today.plusDays(days);
        return findFeesDueBetween(today, targetDate);
    }
}
