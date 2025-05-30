package com.bankamen.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class LoanSimulationResponse {
    private Double monthlyPayment;
    private Double totalPayment;
    private List<Installment> schedule;
}

