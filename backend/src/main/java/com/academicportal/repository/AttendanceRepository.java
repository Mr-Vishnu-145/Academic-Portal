package com.academicportal.repository;

import com.academicportal.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Integer> {
    List<Attendance> findByStudentId(Integer studentId);
    List<Attendance> findByStudentIdAndSubjectId(Integer studentId, Integer subjectId);
    List<Attendance> findBySubjectIdAndClassDate(Integer subjectId, LocalDate classDate);
}
