package com.academicportal.controller;

import com.academicportal.entity.Notification;
import com.academicportal.entity.User;
import com.academicportal.repository.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(@AuthenticationPrincipal User user) {
        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getMyUnreadNotifications(@AuthenticationPrincipal User user) {
        List<Notification> list = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(user.getId());
        return ResponseEntity.ok(list);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Integer id, @AuthenticationPrincipal User user) {
        Notification notification = notificationRepository.findById(id).orElse(null);
        if (notification == null || !notification.getUser().getId().equals(user.getId())) {
            return ResponseEntity.notFound().build();
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
        return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
    }
}
