package com.bankamen.dto;
import com.bankamen.entity.TransactionType;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class TransactionFilterRequest {
    private LocalDate startDate;          // date de début
    private LocalDate endDate;            // date de fin
    private TransactionType type;         // type de transaction (facultatif)
    private BigDecimal minAmount;         // montant minimal (facultatif)
    private BigDecimal maxAmount;         // montant maximal (facultatif)

    // Getters & setters
}

