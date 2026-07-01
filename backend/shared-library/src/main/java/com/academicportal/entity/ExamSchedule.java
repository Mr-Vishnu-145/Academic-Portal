package com.academicportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(name = "exam_date", nullable = false)
    private LocalDate examDate;

    @Column(name = "exam_time", nullable = false)
    private LocalTime examTime;

    @Column(name = "hall_number", nullable = false, length = 20)
    private String hallNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @Column(name = "assignment_type", nullable = false, length = 20)
    private String assignmentType; // INDIVIDUAL, YEAR, SECTION, DEPARTMENT

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(name = "study_year")
    private Integer studyYear;

    @Column(name = "section", length = 10)
    private String section;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id")
    private User student;

    @Column(nullable = false, length = 20)
    private String status = "UPCOMING"; // UPCOMING, COMPLETED, CANCELLED

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
