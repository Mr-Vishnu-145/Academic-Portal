package com.academicportal.service;

import com.academicportal.entity.*;
import com.academicportal.repository.AssessmentRepository;
import com.academicportal.repository.FeeStructureRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.logging.Logger;

@Service
public class DeadlineReminderScheduler {

    private static final Logger LOGGER = Logger.getLogger(DeadlineReminderScheduler.class.getName());

    private final AssessmentRepository assessmentRepository;
    private final FeeStructureRepository feeStructureRepository;
    private final NotificationService notificationService;

    public DeadlineReminderScheduler(AssessmentRepository assessmentRepository,
                                     FeeStructureRepository feeStructureRepository,
                                     NotificationService notificationService) {
        this.assessmentRepository = assessmentRepository;
        this.feeStructureRepository = feeStructureRepository;
        this.notificationService = notificationService;
    }

    // Runs every day at 8:00 AM (configured via cron)
    @Scheduled(cron = "0 0 8 * * *")
    public void checkDeadlines() {
        LOGGER.info("Executing daily deadline checker job...");

        // Assignments due in 24 hours (1 day)
        List<Assessment> dueSoon = assessmentRepository.findDueWithin(AssessmentType.ASSIGNMENT, 1);
        LOGGER.info("Found " + dueSoon.size() + " assignments due within 24 hours.");
        dueSoon.forEach(a -> notificationService.notifyStudents(a, "ASSIGNMENT"));

        // Exams in 3 days
        List<Assessment> upcomingExams = assessmentRepository.findWithinDays(AssessmentType.EXAM, 3);
        LOGGER.info("Found " + upcomingExams.size() + " exams in the next 3 days.");
        upcomingExams.forEach(e -> notificationService.notifyStudents(e, "EXAM"));

        // Fee due in 5 days
        List<FeeStructure> feeDeadlines = feeStructureRepository.findDueWithin(5);
        LOGGER.info("Found " + feeDeadlines.size() + " fee deadlines in the next 5 days.");
        feeDeadlines.forEach(f -> notificationService.notifyStudents(f, "FEE"));
    }
}
