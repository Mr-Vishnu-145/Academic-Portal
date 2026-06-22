package com.academicportal.service;

import com.academicportal.entity.*;
import com.academicportal.repository.AssessmentRepository;
import com.academicportal.repository.SubjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class ExamScheduleService {

    private final AssessmentRepository assessmentRepository;
    private final SubjectRepository subjectRepository;

    public ExamScheduleService(AssessmentRepository assessmentRepository,
                               SubjectRepository subjectRepository) {
        this.assessmentRepository = assessmentRepository;
        this.subjectRepository = subjectRepository;
    }

    public List<Assessment> getExamScheduleForClass(Integer departmentId, Integer year) {
        return assessmentRepository.findByDepartmentIdAndStudyYearAndType(departmentId, year, AssessmentType.EXAM);
    }

    @Transactional
    public Assessment createExamSchedule(Integer subjectId, String examTypeStr, LocalDate date,
                                        LocalTime time, String hallNumber, User creator) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new IllegalArgumentException("Subject not found"));

        Assessment schedule = new Assessment();
        schedule.setSubject(subject);
        schedule.setType(AssessmentType.EXAM);
        schedule.setSubType(examTypeStr.toUpperCase());
        schedule.setTitle(examTypeStr.toUpperCase() + " Exam for " + subject.getName());
        schedule.setDueDate(date);
        schedule.setExamTime(time);
        schedule.setHallNumber(hallNumber);
        schedule.setMaxMarks(100); // Default or config max marks for exams
        schedule.setUploadedBy(creator);
        schedule.setDepartment(subject.getDepartment());
        schedule.setStudyYear(creator.getYear() != null ? creator.getYear() : 1);
        
        return assessmentRepository.save(schedule);
    }
}
