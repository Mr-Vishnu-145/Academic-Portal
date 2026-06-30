package com.academicportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "semester_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SemesterResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(nullable = false)
    private Integer semester;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(nullable = false, length = 5)
    private String grade; // O, A+, A, B+, etc.

    @Column(name = "grade_point", nullable = false, precision = 3, scale = 2)
    private BigDecimal gradePoint;

    @Column(nullable = false)
    private Integer credits;

    @Column(name = "is_arrear")
    private Boolean isArrear = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "result_status", nullable = false, length = 20)
    private ResultStatus resultStatus;

    @Column(nullable = false)
    private Boolean published = false;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "arrear_exam_date")
    private LocalDate arrearExamDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "arrear_status", length = 20)
    private ArrearStatus arrearStatus;

    @Column(name = "cleared_semester")
    private Integer clearedSemester;

    @Column(name = "internal_marks", precision = 5, scale = 2)
    private BigDecimal internalMarks;

    @Column(name = "external_marks", precision = 5, scale = 2)
    private BigDecimal externalMarks;

    @Column(name = "total_marks", precision = 5, scale = 2)
    private BigDecimal totalMarks;

    @Column(name = "percentage", precision = 5, scale = 2)
    private BigDecimal percentage;

    // Backwards-compatibility alias getters for frontend
    public Integer getOriginalSemester() {
        return this.semester;
    }

    public ArrearStatus getStatus() {
        if (this.arrearStatus == null && Boolean.TRUE.equals(this.isArrear)) {
            return ArrearStatus.PENDING;
        }
        return this.arrearStatus;
    }
}
