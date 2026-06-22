package com.academicportal.repository;

import com.academicportal.entity.Role;
import com.academicportal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE u.email = :identifier OR u.registerNumber = :identifier OR u.staffIdCode = :identifier")
    Optional<User> findByIdentifier(@Param("identifier") String identifier);
    
    List<User> findByRole(Role role);
    
    List<User> findByDepartmentIdAndRole(Integer departmentId, Role role);
    
    List<User> findByDepartmentIdAndYearAndRole(Integer departmentId, Integer year, Role role);
}
