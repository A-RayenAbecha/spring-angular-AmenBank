package com.bankamen.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bankamen.entity.TransferNotification;
import com.bankamen.entity.User;

public interface TransferNotificationRepository extends JpaRepository<TransferNotification, Long> {
    List<TransferNotification> findByUserAndIsReadFalseOrderByNotificationDateDesc(User user);
    List<TransferNotification> findByScheduledExecutionDateBeforeAndIsReminderTrue(LocalDateTime date);
} 