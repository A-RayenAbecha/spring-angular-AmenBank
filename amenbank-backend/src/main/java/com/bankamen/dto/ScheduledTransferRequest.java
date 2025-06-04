package com.bankamen.dto;

import java.time.LocalDate;

import com.bankamen.entity.Frequency;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ScheduledTransferRequest {
    private Double amount;
    private LocalDate startDate;
    private LocalDate endDate;
    private Frequency frequency;
    private String description;
    private Long sourceAccountId;
    private String targetAccountNumber;
}
