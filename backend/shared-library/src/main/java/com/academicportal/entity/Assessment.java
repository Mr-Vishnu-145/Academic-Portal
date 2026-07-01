package com.academicportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "assessments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Assessment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AssessmentType type; // EXAM, ASSIGNMENT

    @Column(name = "sub_type", nullable = false, length = 50)
    private String subType; // CAT1, CAT2, MODEL, SEMESTER, ARREAR, ASSIGNMENT, etc.

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "exam_time")
    private LocalTime examTime;

    @Column(name = "hall_number", length = 20)
    private String hallNumber;

    @Column(name = "max_marks", nullable = false)
    private Integer maxMarks;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(name = "study_year", nullable = false)
    private Integer studyYear;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
