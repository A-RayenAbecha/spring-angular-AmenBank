package com.bankamen.dto;

import com.bankamen.entity.Frequency;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class ScheduledTransferDTO {
    private Long id;
    private Double amount;
    private LocalDate startDate;
    private LocalDate endDate;
    private Frequency frequency;
    private String description;
    private boolean active;
    private Long sourceAccountId;
    private String sourceAccount;
    private String targetAccountNumber;
} 