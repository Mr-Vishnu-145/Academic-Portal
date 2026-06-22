package com.academicportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "assessment_records", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"assessment_id", "student_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "scored_marks", precision = 5, scale = 2)
    private BigDecimal scoredMarks;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AssessmentRecordStatus status;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "graded_by")
    private User gradedBy;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;

    // Backwards-compatibility getters for frontend JSON response expectations
    public Subject getSubject() {
        return this.assessment != null ? this.assessment.getSubject() : null;
    }

    public String getAssessmentType() {
        return this.assessment != null ? this.assessment.getSubType() : null;
    }

    public Integer getMaxMarks() {
        return this.assessment != null ? this.assessment.getMaxMarks() : null;
    }

    public BigDecimal getMarksGiven() {
        return this.scoredMarks;
    }
}
