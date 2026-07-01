package com.academicportal.service;

import com.academicportal.entity.*;
import com.academicportal.repository.NotificationRepository;
import com.academicportal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void createNotification(User user, NotificationType type, String title, String message, Integer referenceId) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setReferenceId(referenceId);
        notification.setIsRead(false);
        notification.setSendAt(LocalDateTime.now());
        notification.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyStudents(Assessment a, String typeLabel) {
        List<User> students = userRepository.findByDepartmentIdAndYearAndRole(
                a.getDepartment().getId(), a.getStudyYear(), Role.STUDENT);
        
        for (User student : students) {
            if ("ASSIGNMENT".equals(typeLabel)) {
                String title = "Assignment Due Soon: " + a.getTitle();
                String message = "Your assignment '" + a.getTitle() + "' is due on " + a.getDueDate() + ". Please submit before deadline.";
                createNotification(student, NotificationType.ASSIGNMENT, title, message, a.getId());
            } else if ("EXAM".equals(typeLabel)) {
                String title = "Upcoming Exam Alert: " + a.getSubject().getName();
                String message = "You have a " + a.getSubType() + " exam scheduled for " + a.getSubject().getCode() + 
                                 " on " + a.getDueDate() + " at " + a.getExamTime() + " in Hall " + a.getHallNumber() + ".";
                createNotification(student, NotificationType.EXAM, title, message, a.getId());
            }
        }
    }

    @Transactional
    public void notifyStudents(FeeStructure f, String typeLabel) {
        List<User> students = userRepository.findByDepartmentIdAndYearAndRole(
                f.getDepartment().getId(), f.getYear(), Role.STUDENT);

        for (User student : students) {
            String title = "Fee Payment Reminder: " + f.getFeeType();
            String message = "A fee of INR " + f.getAmount() + " for '" + f.getFeeType() + "' is due on " + f.getDueDate() + ".";
            createNotification(student, NotificationType.FEE, title, message, f.getId());
        }
    }
}
