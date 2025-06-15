package com.bankamen.dto;

import com.bankamen.entity.Frequency;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ScheduledTransferUpdateRequest {
    private Double amount;
    private LocalDate startDate;
    private LocalDate endDate;
    private Frequency frequency;
    private String description;
    private boolean active;
}
