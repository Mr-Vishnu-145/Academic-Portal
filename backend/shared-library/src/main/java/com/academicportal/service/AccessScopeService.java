package com.academicportal.service;

import com.academicportal.entity.Role;
import com.academicportal.entity.User;
import com.academicportal.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.ResponseStatus;
import java.util.List;

@Service
public class AccessScopeService {

    private final UserRepository userRepository;

    public AccessScopeService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAccessibleStudents(User loggedInUser) {
        switch (loggedInUser.getRole()) {
            case ADMIN:
                return userRepository.findByRole(Role.STUDENT);

            case HOD:
                if (loggedInUser.getDepartment() == null) {
                    throw new AccessDeniedException("HOD has no department assigned");
                }
                return userRepository.findByDepartmentIdAndRole(
                        loggedInUser.getDepartment().getId(), Role.STUDENT);

            case STAFF:
                if (loggedInUser.getDepartment() == null || loggedInUser.getYear() == null) {
                    throw new AccessDeniedException("Staff has no department or year assigned");
                }
                return userRepository.findByDepartmentIdAndYearAndRole(
                        loggedInUser.getDepartment().getId(),
                        loggedInUser.getYear(),
                        Role.STUDENT);

            default:
                throw new AccessDeniedException("Not allowed to access student lists");
        }
    }

    @ResponseStatus(HttpStatus.FORBIDDEN)
    public static class AccessDeniedException extends RuntimeException {
        public AccessDeniedException(String message) {
            super(message);
        }
    }
}
