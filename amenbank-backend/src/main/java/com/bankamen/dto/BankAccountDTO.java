// BankAccountDTO.java
package com.bankamen.dto;

import com.bankamen.entity.AccountType;
import com.bankamen.entity.BankAccount;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class BankAccountDTO {
    private Long id;
    private String iban;
    private String accountNumber;
    private Double balance;
    private AccountType type;
    private boolean active;
    private Long userId;
    private String userFullName;

    public BankAccountDTO(BankAccount account) {
        this.id = account.getId();
        this.iban = account.getIban();
        this.accountNumber = account.getAccountNumber();
        this.balance = account.getBalance();
        this.type = account.getType();
        this.active = account.isActive();

        if (account.getUser() != null) {
            this.userId = account.getUser().getId();
            this.userFullName = account.getUser().getFirstName() + " " + account.getUser().getLastName();
        }
    }
}





