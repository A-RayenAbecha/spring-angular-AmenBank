package com.bankamen.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime date;

    private Double amount;

    private Double balanceAfter; // Solde après l'opération

    @Enumerated(EnumType.STRING)
    private TransactionType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    @JsonIgnoreProperties({"transactions", "outgoingScheduledTransfers", "incomingScheduledTransfers", "user"})
    private BankAccount account;

    private String description;

    // Add a method to get account ID without loading the full account
    @JsonProperty("accountId")
    public Long getAccountId() {
        return account != null ? account.getId() : null;
    }
}