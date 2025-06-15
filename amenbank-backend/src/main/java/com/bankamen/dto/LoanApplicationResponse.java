package com.bankamen.dto;

import com.bankamen.entity.LoanStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoanApplicationResponse {
    private Long id;
    private Double amount;
    private Integer termInMonths;
    private Double interestRate;
    private LoanStatus status;
    private Long accountId;
}
