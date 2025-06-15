package com.bankamen.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class BankAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String iban;

    // Add accountNumber field if it doesn't exist
    @Column(name = "account_number")
    private String accountNumber;

    private Double balance;

    @Enumerated(EnumType.STRING)
    private AccountType type;

    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"accounts", "password", "resetToken", "resetTokenExpiry", "email2FACode", "email2FAExpiry"})
    private User user;

    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"account"})
    private List<Transaction> transactions;

    // Scheduled transfers where this account is the source
    @OneToMany(mappedBy = "sourceAccount", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"sourceAccount", "targetAccount"})
    private List<ScheduledTransfer> outgoingScheduledTransfers = new ArrayList<>();

    // Scheduled transfers where this account is the target
    @OneToMany(mappedBy = "targetAccount", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"sourceAccount", "targetAccount"})
    private List<ScheduledTransfer> incomingScheduledTransfers = new ArrayList<>();

}