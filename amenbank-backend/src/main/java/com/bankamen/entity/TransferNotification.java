package com.bankamen.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class TransferNotification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "scheduled_transfer_id")
    private ScheduledTransfer scheduledTransfer;

    private LocalDateTime notificationDate;
    private LocalDateTime scheduledExecutionDate;
    private boolean isReminder; // true for reminder, false for execution confirmation
    private boolean isRead;
    private String message;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
} 