package com.academicportal.controller.student;

import com.academicportal.entity.SemesterResult;
import com.academicportal.entity.User;
import com.academicportal.repository.SemesterResultRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/student/results")
public class StudentResultController {

    private final SemesterResultRepository resultRepository;

    public StudentResultController(SemesterResultRepository resultRepository) {
        this.resultRepository = resultRepository;
    }

    @GetMapping
    public ResponseEntity<?> getResults(@AuthenticationPrincipal User student) {
        List<SemesterResult> publishedResults = resultRepository.findByStudentIdAndPublished(student.getId(), true);
        return ResponseEntity.ok(publishedResults);
    }
}
