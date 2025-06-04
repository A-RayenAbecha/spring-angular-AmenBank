package com.bankamen.dto;

import com.bankamen.entity.Transaction;
import com.bankamen.entity.TransactionType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class TransactionDTO {
    private Long id;
    private LocalDateTime date;
    private Double amount;
    private Double balanceAfter;
    private TransactionType type;
    private String description;
    private Long accountId;
    private String accountIban;

    public TransactionDTO(Transaction transaction) {
        this.id = transaction.getId();
        this.date = transaction.getDate();
        this.amount = transaction.getAmount();
        this.balanceAfter = transaction.getBalanceAfter();
        this.type = transaction.getType();
        this.description = transaction.getDescription();

        // Safely get account information
        if (transaction.getAccount() != null) {
            this.accountId = transaction.getAccount().getId();
            this.accountIban = transaction.getAccount().getIban();
        }
    }
}