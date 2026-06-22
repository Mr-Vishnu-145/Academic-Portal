package com.academicportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cgpa_summary")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CgpaSummary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(nullable = false)
    private Integer semester;

    @Column(nullable = false, precision = 4, scale = 2)
    private BigDecimal sgpa;

    @Column(nullable = false, precision = 4, scale = 2)
    private BigDecimal cgpa;

    @Column(name = "total_credits", nullable = false)
    private Integer totalCredits;

    @Column(name = "calculated_at", updatable = false)
    private LocalDateTime calculatedAt = LocalDateTime.now();
}
