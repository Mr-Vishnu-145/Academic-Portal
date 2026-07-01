package com.academicportal.service;

import com.academicportal.entity.Attendance;
import com.academicportal.entity.AttendanceStatus;
import com.academicportal.entity.Subject;
import com.academicportal.entity.User;
import com.academicportal.repository.AttendanceRepository;
import com.academicportal.repository.SubjectRepository;
import com.academicportal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             SubjectRepository subjectRepository,
                             UserRepository userRepository) {
        this.attendanceRepository = attendanceRepository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
    }

    public List<Attendance> getStudentAttendance(Integer studentId) {
        return attendanceRepository.findByStudentId(studentId);
    }

    @Transactional
    public List<Attendance> markBulkAttendance(Integer subjectId, LocalDate date, Map<Integer, String> studentStatuses, User markedBy) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new IllegalArgumentException("Subject not found"));

        List<Attendance> markedList = new ArrayList<>();

        for (Map.Entry<Integer, String> entry : studentStatuses.entrySet()) {
            Integer studentId = entry.getKey();
            String statusStr = entry.getValue();

            User student = userRepository.findById(studentId)
                    .orElseThrow(() -> new IllegalArgumentException("Student ID " + studentId + " not found"));

            AttendanceStatus status = AttendanceStatus.valueOf(statusStr.toUpperCase());

            // Check if attendance record already exists for this subject, date, student
            List<Attendance> existing = attendanceRepository.findByStudentIdAndSubjectId(studentId, subjectId);
            Attendance attendance = existing.stream()
                    .filter(a -> a.getClassDate().equals(date))
                    .findFirst()
                    .orElse(new Attendance());

            attendance.setStudent(student);
            attendance.setSubject(subject);
            attendance.setClassDate(date);
            attendance.setStatus(status);
            attendance.setMarkedBy(markedBy);

            markedList.add(attendanceRepository.save(attendance));
        }

        return markedList;
    }
}
