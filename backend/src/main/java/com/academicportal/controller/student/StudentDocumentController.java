package com.academicportal.controller.student;

import com.academicportal.entity.User;
import com.academicportal.service.DocumentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student/documents")
public class StudentDocumentController {

    private final DocumentService documentService;

    public StudentDocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping
    public ResponseEntity<?> getDocuments(@AuthenticationPrincipal User student) {
        return ResponseEntity.ok(documentService.getStudentDocuments(student.getId()));
    }
}
