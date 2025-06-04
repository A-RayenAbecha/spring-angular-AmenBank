package com.bankamen.controller;

import com.bankamen.entity.Notification;
import com.bankamen.entity.TransferNotification;
import com.bankamen.entity.User;
import com.bankamen.service.NotificationService;
import com.bankamen.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    // Admin notifications
    @PreAuthorize("hasRole('SUPERADMIN')")
    @GetMapping("/admin/notifications")
    public ResponseEntity<List<Notification>> getAllNotifications() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

    @PreAuthorize("hasRole('SUPERADMIN')")
    @GetMapping("/admin/notifications/unread")
    public ResponseEntity<List<Notification>> getUnreadAdminNotifications() {
        return ResponseEntity.ok(notificationService.getUnreadNotifications());
    }

    @PreAuthorize("hasRole('SUPERADMIN')")
    @GetMapping("/admin/notifications/count/unread")
    public ResponseEntity<Long> getUnreadCount() {
        return ResponseEntity.ok(notificationService.getUnreadCount());
    }

    @PreAuthorize("hasRole('SUPERADMIN')")
    @PutMapping("/admin/notifications/{id}/read")
    public ResponseEntity<Void> markAdminNotificationAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasRole('SUPERADMIN')")
    @PutMapping("/admin/notifications/read-all")
    public ResponseEntity<Void> markAllAdminNotificationsAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasRole('SUPERADMIN')")
    @DeleteMapping("/admin/notifications/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok().build();
    }

    // Client transfer notifications
    @GetMapping("/api/notifications/unread")
    public ResponseEntity<List<TransferNotification>> getUnreadTransferNotifications(Authentication auth) {
        User user = userService.getUserFromAuth(auth);
        List<TransferNotification> notifications = notificationService.getUnreadNotifications(user);
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/api/notifications/{id}/read")
    public ResponseEntity<Void> markTransferNotificationAsRead(@PathVariable Long id) {
        notificationService.markTransferNotificationAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/api/notifications/read-all")
    public ResponseEntity<Void> markAllTransferNotificationsAsRead(Authentication auth) {
        User user = userService.getUserFromAuth(auth);
        notificationService.markAllTransferNotificationsAsRead(user);
        return ResponseEntity.ok().build();
    }
}