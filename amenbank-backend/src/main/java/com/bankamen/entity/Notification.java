package com.bankamen.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private Boolean isRead = false;

    @Column
    private String relatedEntityId; // For linking to transaction, user, etc.

    @Column
    private Double amount; // For transaction-related notifications

    public Notification(String title, String message, NotificationType type, String relatedEntityId, Double amount) {
        this.title = title;
        this.message = message;
        this.type = type;
        this.relatedEntityId = relatedEntityId;
        this.amount = amount;
        this.createdAt = LocalDateTime.now();
        this.isRead = false;
    }

    public enum NotificationType {
        SUSPICIOUS_TRANSACTION,
        LARGE_TRANSACTION,
        FAILED_LOGIN_ATTEMPTS,
        SYSTEM_ALERT,
        INFO
    }
}