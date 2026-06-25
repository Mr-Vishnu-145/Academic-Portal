package com.academicportal.controller.staff;

import com.academicportal.entity.*;
import com.academicportal.repository.*;
import com.academicportal.service.AccessScopeService;
import com.academicportal.service.MarksService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/marks/import")
@PreAuthorize("hasAnyRole('STAFF', 'HOD', 'ADMIN')")
public class MarkImportController {

    private final MarkImportLogRepository importLogRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final AssessmentRepository assessmentRepository;
    private final AssessmentRecordRepository recordRepository;
    private final SemesterResultRepository resultRepository;
    private final AccessScopeService accessScopeService;
    private final MarksService marksService;
    private final StaffAssignmentRepository staffAssignmentRepository;

    public MarkImportController(MarkImportLogRepository importLogRepository,
                                UserRepository userRepository,
                                SubjectRepository subjectRepository,
                                AssessmentRepository assessmentRepository,
                                AssessmentRecordRepository recordRepository,
                                SemesterResultRepository resultRepository,
                                AccessScopeService accessScopeService,
                                MarksService marksService,
                                StaffAssignmentRepository staffAssignmentRepository) {
        this.importLogRepository = importLogRepository;
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.assessmentRepository = assessmentRepository;
        this.recordRepository = recordRepository;
        this.resultRepository = resultRepository;
        this.accessScopeService = accessScopeService;
        this.marksService = marksService;
        this.staffAssignmentRepository = staffAssignmentRepository;
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@AuthenticationPrincipal User user) {
        try {
            List<MarkImportLog> logs;
            if (user.getRole() == Role.ADMIN) {
                logs = importLogRepository.findAll();
            } else if (user.getRole() == Role.HOD) {
                if (user.getDepartment() == null) {
                    return ResponseEntity.badRequest().body(Map.of("error", "HOD department is not assigned."));
                }
                logs = importLogRepository.findByDepartmentId(user.getDepartment().getId());
            } else {
                if (user.getDepartment() == null) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Staff department is not assigned."));
                }
                // Staff sees their own uploads or department-level uploads
                logs = importLogRepository.findByDepartmentId(user.getDepartment().getId()).stream()
                        .filter(l -> l.getUploadedBy().getId().equals(user.getId()))
                        .collect(Collectors.toList());
            }
            // Sort by upload time descending
            logs.sort((a, b) -> b.getUploadTime().compareTo(a.getUploadTime()));
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/reference-data")
    public ResponseEntity<?> getReferenceData(@AuthenticationPrincipal User user) {
        try {
            List<User> students = accessScopeService.getAccessibleStudents(user);
            List<Subject> subjects;
            if (user.getRole() == Role.ADMIN) {
                subjects = subjectRepository.findAll();
            } else if (user.getRole() == Role.HOD) {
                subjects = subjectRepository.findByDepartmentId(user.getDepartment().getId());
            } else {
                // Staff: assigned subjects only
                List<Integer> assignedSubjectIds = staffAssignmentRepository.findByStaffId(user.getId()).stream()
                        .map(a -> a.getSubject().getId())
                        .collect(Collectors.toList());
                subjects = subjectRepository.findAll().stream()
                        .filter(s -> assignedSubjectIds.contains(s.getId()))
                        .collect(Collectors.toList());
            }

            // Expose assessments for mapping
            List<Assessment> assessments = assessmentRepository.findAll();

            Map<String, Object> refData = new HashMap<>();
            refData.put("students", students.stream().map(s -> Map.of(
                    "id", s.getId(),
                    "name", s.getName(),
                    "registerNumber", s.getRegisterNumber() != null ? s.getRegisterNumber() : "",
                    "departmentId", s.getDepartment() != null ? s.getDepartment().getId() : 0,
                    "year", s.getYear() != null ? s.getYear() : 1
            )).collect(Collectors.toList()));

            refData.put("subjects", subjects.stream().map(s -> Map.of(
                    "id", s.getId(),
                    "name", s.getName(),
                    "code", s.getCode(),
                    "departmentId", s.getDepartment().getId(),
                    "semester", s.getSemester(),
                    "credits", s.getCredits()
            )).collect(Collectors.toList()));

            refData.put("assessments", assessments.stream().map(a -> Map.of(
                    "id", a.getId(),
                    "title", a.getTitle(),
                    "subjectId", a.getSubject().getId(),
                    "type", a.getType().toString(),
                    "subType", a.getSubType(),
                    "maxMarks", a.getMaxMarks()
            )).collect(Collectors.toList()));

            return ResponseEntity.ok(refData);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/bulk")
    @Transactional
    public ResponseEntity<?> bulkImport(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> payload) {
        try {
            String fileName = (String) payload.get("fileName");
            String importType = (String) payload.get("importType"); // "INTERNAL" or "SEMESTER"
            List<Map<String, Object>> records = (List<Map<String, Object>>) payload.get("records");

            if (records == null || records.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No records found to import."));
            }

            int importedCount = 0;
            int failedCount = 0;

            for (Map<String, Object> rec : records) {
                try {
                    String regNum = (String) rec.get("registerNumber");
                    String subCode = (String) rec.get("subjectCode");
                    String assessmentType = (String) rec.get("assessmentType"); // e.g. CAT1, CAT2, MODEL, SEMESTER
                    String action = (String) rec.get("action"); // "UPDATE" or "SKIP"

                    if (regNum == null || subCode == null) {
                        failedCount++;
                        continue;
                    }

                    // Find student and subject
                    User student = userRepository.findByIdentifier(regNum.trim())
                            .filter(u -> u.getRole() == Role.STUDENT)
                            .orElseThrow(() -> new IllegalArgumentException("Student not found: " + regNum));

                    Subject subject = subjectRepository.findByCode(subCode.trim())
                            .orElseThrow(() -> new IllegalArgumentException("Subject not found: " + subCode));

                    // Verify scopes
                    if (user.getRole() == Role.HOD) {
                        if (user.getDepartment() == null || !user.getDepartment().getId().equals(student.getDepartment().getId())) {
                            throw new IllegalArgumentException("HOD scope mismatch for student " + regNum);
                        }
                    } else if (user.getRole() == Role.STAFF) {
                        if (user.getDepartment() == null || !user.getDepartment().getId().equals(student.getDepartment().getId())) {
                            throw new IllegalArgumentException("Staff department mismatch for student " + regNum);
                        }
                        // Check staff subject assignment
                        boolean isAssigned = staffAssignmentRepository.findByStaffId(user.getId()).stream()
                                .anyMatch(sa -> sa.getSubject().getId().equals(subject.getId()));
                        if (!isAssigned) {
                            throw new IllegalArgumentException("Staff is not assigned to subject: " + subCode);
                        }
                    }

                    if ("INTERNAL".equalsIgnoreCase(importType)) {
                        // Extract marks
                        Object internalMarkObj = rec.get("internalMark");
                        if (internalMarkObj == null) {
                            throw new IllegalArgumentException("Internal mark is missing");
                        }
                        double scoredMarks = Double.parseDouble(internalMarkObj.toString());

                        // Save internal mark using MarksService
                        // Find or create assessment
                        List<Assessment> assessments = assessmentRepository.findByDepartmentIdAndStudyYearAndType(
                                subject.getDepartment().getId(), student.getYear() != null ? student.getYear() : 1, AssessmentType.EXAM);
                        
                        String subType = assessmentType != null ? assessmentType.toUpperCase() : "CAT1";
                        Assessment examAssessment = assessments.stream()
                                .filter(a -> a.getSubject().getId().equals(subject.getId()) && a.getSubType().equalsIgnoreCase(subType))
                                .findFirst()
                                .orElseGet(() -> {
                                    Assessment newExam = new Assessment();
                                    newExam.setSubject(subject);
                                    newExam.setType(AssessmentType.EXAM);
                                    newExam.setSubType(subType);
                                    newExam.setTitle(subType + " Exam for " + subject.getName());
                                    newExam.setDueDate(LocalDate.now());
                                    newExam.setMaxMarks(100);
                                    newExam.setUploadedBy(user);
                                    newExam.setDepartment(subject.getDepartment());
                                    newExam.setStudyYear(student.getYear() != null ? student.getYear() : 1);
                                    return assessmentRepository.save(newExam);
                                });

                        Optional<AssessmentRecord> existingRecord = recordRepository.findByAssessmentIdAndStudentId(examAssessment.getId(), student.getId());
                        if (existingRecord.isPresent()) {
                            if ("SKIP".equalsIgnoreCase(action)) {
                                continue; // Skip existing record
                            }
                        }

                        AssessmentRecord record = existingRecord.orElse(new AssessmentRecord());
                        record.setAssessment(examAssessment);
                        record.setStudent(student);
                        record.setScoredMarks(BigDecimal.valueOf(scoredMarks).setScale(2, RoundingMode.HALF_UP));
                        record.setStatus(AssessmentRecordStatus.GRADED);
                        record.setGradedBy(user);
                        record.setGradedAt(LocalDateTime.now());
                        recordRepository.save(record);
                        importedCount++;

                    } else { // SEMESTER results
                        String grade = (String) rec.get("grade");
                        if (grade == null || grade.trim().isEmpty()) {
                            throw new IllegalArgumentException("Grade is missing");
                        }
                        grade = grade.trim().toUpperCase();

                        // Determine grade points, status, arrears
                        BigDecimal gradePoint = getGradePoint(grade);
                        ResultStatus resultStatus = ("U".equals(grade) || "RA".equals(grade) || "F".equals(grade) || "AB".equals(grade)) 
                                ? ResultStatus.ARREAR : ResultStatus.PASS;
                        boolean isArrear = resultStatus == ResultStatus.ARREAR;

                        List<SemesterResult> existingResults = resultRepository.findByStudentIdAndSemester(student.getId(), subject.getSemester());
                        Optional<SemesterResult> existingResult = existingResults.stream()
                                .filter(r -> r.getSubject().getId().equals(subject.getId()))
                                .findFirst();

                        if (existingResult.isPresent()) {
                            if ("SKIP".equalsIgnoreCase(action)) {
                                continue; // Skip existing record
                            }
                        }

                        SemesterResult result = existingResult.orElse(new SemesterResult());
                        result.setStudent(student);
                        result.setSemester(subject.getSemester());
                        result.setSubject(subject);
                        result.setGrade(grade);
                        result.setGradePoint(gradePoint);
                        result.setCredits(subject.getCredits());
                        result.setIsArrear(isArrear);
                        result.setResultStatus(resultStatus);
                        result.setPublished(false); // require explicit publishing later

                        resultRepository.save(result);
                        importedCount++;
                    }

                } catch (Exception e) {
                    System.err.println("Error importing row: " + e.getMessage());
                    failedCount++;
                }
            }

            // Create log entry
            MarkImportLog log = new MarkImportLog();
            log.setFileName(fileName != null ? fileName : "Imported_Sheet");
            log.setUploadedBy(user);
            log.setDepartment(user.getDepartment());
            log.setRecordsImported(importedCount);
            log.setFailedRecords(failedCount);
            log.setStatus(failedCount == 0 ? "SUCCESS" : (importedCount > 0 ? "WARNING" : "FAILED"));
            importLogRepository.save(log);

            Map<String, Object> summary = new HashMap<>();
            summary.put("recordsImported", importedCount);
            summary.put("failedRecords", failedCount);
            summary.put("status", log.getStatus());

            return ResponseEntity.ok(summary);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private BigDecimal getGradePoint(String grade) {
        double gp;
        switch (grade) {
            case "O": gp = 10.0; break;
            case "A+": gp = 9.0; break;
            case "A": gp = 8.0; break;
            case "B+": gp = 7.0; break;
            case "B": gp = 6.0; break;
            case "C": gp = 5.0; break;
            default: gp = 0.0;
        }
        return BigDecimal.valueOf(gp).setScale(2, RoundingMode.HALF_UP);
    }
}
