package com.bankamen.dto;

import com.bankamen.entity.AccountType;
import com.bankamen.entity.BankAccount;
import lombok.Data;

@Data
public class BankAccountDTO {
    private Long id;
    private String iban;
    private Double balance;
    private AccountType type;

    public BankAccountDTO(BankAccount account) {
        this.id = account.getId();
        this.iban = account.getIban();
        this.balance = account.getBalance();
        this.type = account.getType();
    }
}
