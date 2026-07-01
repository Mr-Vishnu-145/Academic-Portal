package com.academicportal.security;

import com.academicportal.entity.Role;
import com.academicportal.entity.User;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("roleDeptYearGuard")
public class RoleDeptYearGuard {

    /**
     * Checks if the logged-in user can access the given department and year.
     * ADMIN: Full access to everything.
     * HOD: Access to their own department (any year).
     * STAFF: Access to their own department AND assigned year.
     * STUDENT: Access only to their own department and year.
     */
    public boolean checkAccess(Integer departmentId, Integer year) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof User user)) {
            return false;
        }

        if (user.getRole() == Role.ADMIN) {
            return true;
        }

        if (user.getDepartment() == null || !user.getDepartment().getId().equals(departmentId)) {
            return false;
        }

        if (user.getRole() == Role.HOD) {
            return true; // HOD handles all years in their department
        }

        if (user.getRole() == Role.STAFF) {
            return user.getYear() != null && user.getYear().equals(year);
        }

        if (user.getRole() == Role.STUDENT) {
            return user.getYear() != null && user.getYear().equals(year);
        }

        return false;
    }

    /**
     * Helper to verify if the request is targeting the student's own data.
     */
    public boolean checkStudentOwn(Integer studentId) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof User user)) {
            return false;
        }
        
        if (user.getRole() == Role.ADMIN) {
            return true;
        }
        
        if (user.getRole() == Role.STUDENT) {
            return user.getId().equals(studentId);
        }
        
        // HOD / STAFF can access if within department/year scope
        User student = user.getRole() == Role.HOD || user.getRole() == Role.STAFF ? new User() : null; // fetch check done in service
        return true; // Defer to scope check in service
    }
}
