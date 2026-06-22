package com.academicportal.service;

import com.academicportal.entity.DocType;
import com.academicportal.entity.Document;
import com.academicportal.entity.User;
import com.academicportal.repository.DocumentRepository;
import com.academicportal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    public DocumentService(DocumentRepository documentRepository, UserRepository userRepository) {
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
    }

    public List<Document> getStudentDocuments(Integer studentId) {
        return documentRepository.findByStudentId(studentId);
    }

    @Transactional
    public Document uploadDocument(Integer studentId, String docTypeStr, Integer semester, String fileUrl, User uploader) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));

        DocType docType = DocType.valueOf(docTypeStr.toUpperCase());

        Document doc = new Document();
        doc.setStudent(student);
        doc.setDocType(docType);
        doc.setSemester(semester);
        doc.setFileUrl(fileUrl);
        doc.setUploadedBy(uploader);
        doc.setUploadedAt(LocalDateTime.now());

        return documentRepository.save(doc);
    }
}
