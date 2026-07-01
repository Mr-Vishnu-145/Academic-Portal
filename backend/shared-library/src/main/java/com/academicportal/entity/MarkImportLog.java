package com.academicportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "mark_import_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MarkImportLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "upload_time")
    private LocalDateTime uploadTime = LocalDateTime.now();

    @Column(name = "records_imported", nullable = false)
    private Integer recordsImported;

    @Column(name = "failed_records", nullable = false)
    private Integer failedRecords;

    @Column(nullable = false)
    private String status;

    @Lob
    @Column(name = "import_details", columnDefinition = "LONGTEXT")
    private String importDetails;

    @Column(name = "assessment_type")
    private String assessmentType;

    @Column(name = "custom_assessment_name")
    private String customAssessmentName;

}
