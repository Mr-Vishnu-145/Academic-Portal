package com.academicportal.controller;

import com.academicportal.entity.*;
import com.academicportal.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/exams")
public class ExamScheduleController {

    private final ExamScheduleRepository examScheduleRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    public ExamScheduleController(ExamScheduleRepository examScheduleRepository,
                                  SubjectRepository subjectRepository,
                                  UserRepository userRepository,
                                  DepartmentRepository departmentRepository) {
        this.examScheduleRepository = examScheduleRepository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'HOD', 'ADMIN')")
    public ResponseEntity<?> getExams(@AuthenticationPrincipal User user) {
        if (user.getRole() == Role.STUDENT) {
            Integer deptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
            Integer year = user.getYear();
            String section = user.getSection();
            List<ExamSchedule> studentExams = examScheduleRepository.findStudentExams(user.getId(), deptId, year, section);
            return ResponseEntity.ok(studentExams);
        } else if (user.getRole() == Role.STAFF || user.getRole() == Role.HOD) {
            Integer deptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
            if (deptId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Staff/HOD department is not assigned."));
            }
            List<ExamSchedule> deptExams = examScheduleRepository.findByDepartmentId(deptId);
            return ResponseEntity.ok(deptExams);
        } else if (user.getRole() == Role.ADMIN) {
            List<ExamSchedule> allExams = examScheduleRepository.findAll();
            return ResponseEntity.ok(allExams);
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('STAFF', 'HOD', 'ADMIN')")
    public ResponseEntity<?> createExam(@AuthenticationPrincipal User user, @RequestBody ExamScheduleRequest request) {
        try {
            // Role check: Staff/HOD can only schedule for their department
            if (user.getRole() == Role.STAFF || user.getRole() == Role.HOD) {
                if (user.getDepartment() == null || !user.getDepartment().getId().equals(request.getDepartmentId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "You can only manage exams for your assigned department."));
                }
            }

            Subject subject = subjectRepository.findById(request.getSubjectId())
                    .orElseThrow(() -> new IllegalArgumentException("Subject not found"));

            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Department not found"));

            LocalDate parsedDate = LocalDate.parse(request.getExamDate());
            String timeStr = request.getExamTime();
            if (timeStr.length() == 5) { // HH:mm
                timeStr += ":00";
            }
            LocalTime parsedTime = LocalTime.parse(timeStr);

            LocalDate today = LocalDate.now();
            if (parsedDate.isBefore(today)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Selected date is in the past."));
            }
            if (parsedDate.isEqual(today) && parsedTime.isBefore(LocalTime.now())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Selected time is in the past."));
            }

            ExamSchedule examSchedule = new ExamSchedule();
            examSchedule.setSubject(subject);
            examSchedule.setDepartment(department);
            examSchedule.setExamDate(parsedDate);
            examSchedule.setExamTime(parsedTime);
            
            examSchedule.setHallNumber(request.getHallNumber());
            examSchedule.setUploadedBy(user);
            examSchedule.setAssignmentType(request.getAssignmentType());
            
            if ("INDIVIDUAL".equals(request.getAssignmentType())) {
                if (request.getStudentId() == null) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Student ID is required for Individual assignment."));
                }
                User student = userRepository.findById(request.getStudentId())
                        .orElseThrow(() -> new IllegalArgumentException("Student not found"));
                if (student.getRole() != Role.STUDENT) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Selected user is not a student."));
                }
                if (!student.getDepartment().getId().equals(request.getDepartmentId())) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Selected student belongs to a different department."));
                }
                examSchedule.setStudent(student);
            } else if ("YEAR".equals(request.getAssignmentType())) {
                if (request.getStudyYear() == null) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Study year is required for Year assignment."));
                }
                examSchedule.setStudyYear(request.getStudyYear());
            } else if ("SECTION".equals(request.getAssignmentType())) {
                if (request.getStudyYear() == null || request.getSection() == null || request.getSection().trim().isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Study year and section are required for Section assignment."));
                }
                examSchedule.setStudyYear(request.getStudyYear());
                examSchedule.setSection(request.getSection());
            } else if (!"DEPARTMENT".equals(request.getAssignmentType())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid assignment type. Use INDIVIDUAL, YEAR, SECTION, or DEPARTMENT."));
            }

            if (request.getStatus() != null) {
                examSchedule.setStatus(request.getStatus());
            } else {
                examSchedule.setStatus("UPCOMING");
            }

            ExamSchedule saved = examScheduleRepository.save(examSchedule);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'HOD', 'ADMIN')")
    public ResponseEntity<?> updateExam(@AuthenticationPrincipal User user, @PathVariable Integer id, @RequestBody ExamScheduleRequest request) {
        try {
            ExamSchedule examSchedule = examScheduleRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Exam schedule not found"));

            // Role check: Staff/HOD can only manage exams for their department
            if (user.getRole() == Role.STAFF || user.getRole() == Role.HOD) {
                if (user.getDepartment() == null || !user.getDepartment().getId().equals(examSchedule.getDepartment().getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "You can only manage exams for your assigned department."));
                }
            }

            if (request.getSubjectId() != null) {
                Subject subject = subjectRepository.findById(request.getSubjectId())
                        .orElseThrow(() -> new IllegalArgumentException("Subject not found"));
                examSchedule.setSubject(subject);
            }

            LocalDate dateToValidate = examSchedule.getExamDate();
            LocalTime timeToValidate = examSchedule.getExamTime();

            if (request.getExamDate() != null) {
                dateToValidate = LocalDate.parse(request.getExamDate());
            }

            if (request.getExamTime() != null) {
                String timeStr = request.getExamTime();
                if (timeStr.length() == 5) {
                    timeStr += ":00";
                }
                timeToValidate = LocalTime.parse(timeStr);
            }

            LocalDate today = LocalDate.now();
            if (dateToValidate.isBefore(today)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Selected date is in the past."));
            }
            if (dateToValidate.isEqual(today) && timeToValidate.isBefore(LocalTime.now())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Selected time is in the past."));
            }

            if (request.getExamDate() != null) {
                examSchedule.setExamDate(dateToValidate);
            }

            if (request.getExamTime() != null) {
                examSchedule.setExamTime(timeToValidate);
            }

            if (request.getHallNumber() != null) {
                examSchedule.setHallNumber(request.getHallNumber());
            }

            if (request.getStatus() != null) {
                examSchedule.setStatus(request.getStatus());
            }

            ExamSchedule saved = examScheduleRepository.save(examSchedule);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOD', 'ADMIN')")
    public ResponseEntity<?> deleteExam(@AuthenticationPrincipal User user, @PathVariable Integer id) {
        try {
            ExamSchedule examSchedule = examScheduleRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Exam schedule not found"));

            // Role check: HOD can only manage exams for their department
            if (user.getRole() == Role.HOD) {
                if (user.getDepartment() == null || !user.getDepartment().getId().equals(examSchedule.getDepartment().getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "You can only delete exams for your assigned department."));
                }
            }

            examScheduleRepository.delete(examSchedule);
            return ResponseEntity.ok(Map.of("message", "Exam schedule deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class ExamScheduleRequest {
        private Integer subjectId;
        private String examDate;
        private String examTime;
        private String hallNumber;
        private String assignmentType;
        private Integer departmentId;
        private Integer studyYear;
        private String section;
        private Integer studentId;
        private String status;

        public Integer getSubjectId() { return subjectId; }
        public void setSubjectId(Integer subjectId) { this.subjectId = subjectId; }
        public String getExamDate() { return examDate; }
        public void setExamDate(String examDate) { this.examDate = examDate; }
        public String getExamTime() { return examTime; }
        public void setExamTime(String examTime) { this.examTime = examTime; }
        public String getHallNumber() { return hallNumber; }
        public void setHallNumber(String hallNumber) { this.hallNumber = hallNumber; }
        public String getAssignmentType() { return assignmentType; }
        public void setAssignmentType(String assignmentType) { this.assignmentType = assignmentType; }
        public Integer getDepartmentId() { return departmentId; }
        public void setDepartmentId(Integer departmentId) { this.departmentId = departmentId; }
        public Integer getStudyYear() { return studyYear; }
        public void setStudyYear(Integer studyYear) { this.studyYear = studyYear; }
        public String getSection() { return section; }
        public void setSection(String section) { this.section = section; }
        public Integer getStudentId() { return studentId; }
        public void setStudentId(Integer studentId) { this.studentId = studentId; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
