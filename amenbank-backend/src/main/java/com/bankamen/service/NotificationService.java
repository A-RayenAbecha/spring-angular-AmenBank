package com.bankamen.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bankamen.entity.Notification;
import com.bankamen.entity.ScheduledTransfer;
import com.bankamen.entity.Transaction;
import com.bankamen.entity.TransferNotification;
import com.bankamen.entity.User;
import com.bankamen.repository.NotificationRepository;
import com.bankamen.repository.TransferNotificationRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private TransferNotificationRepository notificationRepo;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Notification> getUnreadNotifications() {
        return notificationRepository.findByIsReadFalseOrderByCreatedAtDesc();
    }

    public long getUnreadCount() {
        return notificationRepository.countByIsReadFalse();
    }

    public List<Notification> getRecentNotifications() {
        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);
        return notificationRepository.findRecentNotifications(oneDayAgo);
    }

    public void createSuspiciousTransactionNotification(Transaction transaction) {
        String title = "🚨 Transaction Suspecte Détectée";
        String message = String.format(
                "Une transaction suspecte de %.2f TND a été détectée sur le compte ID: %d à %s",
                transaction.getAmount(),
                transaction.getAccount().getId(),
                transaction.getDate().toString()
        );

        Notification notification = new Notification(
                title,
                message,
                Notification.NotificationType.SUSPICIOUS_TRANSACTION,
                transaction.getId().toString(),
                transaction.getAmount()
        );

        notificationRepository.save(notification);
        log.info("Suspicious transaction notification created for transaction ID: {}", transaction.getId());
    }

    public void createLargeTransactionNotification(Transaction transaction) {
        String title = "💰 Transaction de Montant Élevé";
        String message = String.format(
                "Une transaction de montant élevé de %.2f TND a été effectuée sur le compte ID: %d",
                transaction.getAmount(),
                transaction.getAccount().getId()
        );

        Notification notification = new Notification(
                title,
                message,
                Notification.NotificationType.LARGE_TRANSACTION,
                transaction.getId().toString(),
                transaction.getAmount()
        );

        notificationRepository.save(notification);
        log.info("Large transaction notification created for transaction ID: {}", transaction.getId());
    }

    public void createFailedLoginNotification(String username, String ipAddress) {
        String title = "⚠️ Tentatives de Connexion Échouées";
        String message = String.format(
                "Plusieurs tentatives de connexion échouées détectées pour l'utilisateur '%s' depuis l'IP: %s",
                username,
                ipAddress
        );

        Notification notification = new Notification(
                title,
                message,
                Notification.NotificationType.FAILED_LOGIN_ATTEMPTS,
                username,
                null
        );

        notificationRepository.save(notification);
        log.info("Failed login notification created for user: {}", username);
    }

    public void createSystemAlert(String title, String message) {
        Notification notification = new Notification(
                title,
                message,
                Notification.NotificationType.SYSTEM_ALERT,
                null,
                null
        );

        notificationRepository.save(notification);
        log.info("System alert notification created: {}", title);
    }

    public void markAsRead(Long notificationId) {
        Optional<Notification> notification = notificationRepository.findById(notificationId);
        if (notification.isPresent()) {
            notification.get().setIsRead(true);
            notificationRepository.save(notification.get());
            log.debug("Notification {} marked as read", notificationId);
        }
    }

    @Transactional
    public void markAllAsRead() {
        List<Notification> unreadNotifications = notificationRepository.findByIsReadFalseOrderByCreatedAtDesc();
        unreadNotifications.forEach(notification -> notification.setIsRead(true));
        notificationRepository.saveAll(unreadNotifications);
        log.info("All notifications marked as read");
    }

    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
        log.info("Notification {} deleted", notificationId);
    }

    public List<Notification> getNotificationsByType(Notification.NotificationType type) {
        return notificationRepository.findByTypeOrderByCreatedAtDesc(type);
    }

    public void createReminderNotification(ScheduledTransfer transfer, LocalDateTime executionDate) {
        TransferNotification notification = new TransferNotification();
        notification.setScheduledTransfer(transfer);
        notification.setUser(transfer.getSourceAccount().getUser());
        notification.setNotificationDate(LocalDateTime.now());
        notification.setScheduledExecutionDate(executionDate);
        notification.setReminder(true);
        notification.setRead(false);
        notification.setMessage(String.format(
            "Rappel : Un virement de %.2f € vers le compte %s est prévu pour le %s",
            transfer.getAmount(),
            transfer.getTargetAccount().getAccountNumber(),
            executionDate.format(DATE_FORMATTER)
        ));
        
        notificationRepo.save(notification);
    }

    public void createExecutionNotification(ScheduledTransfer transfer) {
        TransferNotification notification = new TransferNotification();
        notification.setScheduledTransfer(transfer);
        notification.setUser(transfer.getSourceAccount().getUser());
        notification.setNotificationDate(LocalDateTime.now());
        notification.setScheduledExecutionDate(LocalDateTime.now());
        notification.setReminder(false);
        notification.setRead(false);
        notification.setMessage(String.format(
            "Virement effectué : %.2f € ont été transférés vers le compte %s",
            transfer.getAmount(),
            transfer.getTargetAccount().getAccountNumber()
        ));
        
        notificationRepo.save(notification);
    }

    public List<TransferNotification> getUnreadNotifications(User user) {
        return notificationRepo.findByUserAndIsReadFalseOrderByNotificationDateDesc(user);
    }

    @Scheduled(cron = "0 0 8 * * *") // Run every day at 8:00 AM
    public void sendDailyReminders() {
        LocalDateTime tomorrow = LocalDateTime.now().plusDays(1);
        List<TransferNotification> reminders = notificationRepo
            .findByScheduledExecutionDateBeforeAndIsReminderTrue(tomorrow);
        
        for (TransferNotification reminder : reminders) {
            // Here you could integrate with an email service or push notification service
            System.out.println("Sending reminder: " + reminder.getMessage());
        }
    }

    public void markTransferNotificationAsRead(Long id) {
        notificationRepo.findById(id).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepo.save(notification);
        });
    }

    public void markAllTransferNotificationsAsRead(User user) {
        List<TransferNotification> notifications = notificationRepo.findByUserAndIsReadFalseOrderByNotificationDateDesc(user);
        notifications.forEach(notification -> notification.setRead(true));
        notificationRepo.saveAll(notifications);
    }
}