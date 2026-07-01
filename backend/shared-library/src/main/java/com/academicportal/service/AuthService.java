package com.academicportal.service;

import com.academicportal.entity.User;
import com.academicportal.repository.UserRepository;
import com.academicportal.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public Map<String, Object> login(String identifier, String password) {
        Optional<User> userOpt = userRepository.findByIdentifier(identifier);
        
        if (userOpt.isEmpty() || !passwordEncoder.matches(password, userOpt.get().getPasswordHash())) {
            throw new IllegalArgumentException("Invalid ID/email or password");
        }

        User user = userOpt.get();
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new IllegalArgumentException("User account is inactive");
        }

        String token = jwtUtil.generateToken(user);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("userId", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole().name());
        if (user.getDepartment() != null) {
            response.put("departmentId", user.getDepartment().getId());
            response.put("departmentCode", user.getDepartment().getCode());
        }
        response.put("year", user.getYear());
        if (user.getRegisterNumber() != null) {
            response.put("registerNumber", user.getRegisterNumber());
        }
        if (user.getStaffIdCode() != null) {
            response.put("staffIdCode", user.getStaffIdCode());
        }

        return response;
    }
}
