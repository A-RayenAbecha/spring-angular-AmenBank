package com.bankamen.dto;

import com.bankamen.entity.TransactionType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateTransactionRequest {

    private Double amount;
    private TransactionType type;
    private String description;
    private Long targetAccountId;


}
