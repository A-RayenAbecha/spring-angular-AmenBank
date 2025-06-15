package com.bankamen.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoanApplicationRequest {
    private Double amount;
    private Integer termInMonths;
    private Double interestRate;
    private Long accountId;

}
