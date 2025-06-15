package com.bankamen.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class LoanApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double amount; // Montant demandé
    private Integer termInMonths; // Durée en mois
    private Double interestRate;

    @Enumerated(EnumType.STRING)
    private LoanStatus status = LoanStatus.PENDING; // Enum : PENDING, APPROVED, REJECTED

    private LocalDate requestDate = LocalDate.now();

    @ManyToOne
    @JoinColumn(name = "account_id")
    private BankAccount account;
}

