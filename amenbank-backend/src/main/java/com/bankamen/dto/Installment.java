package com.bankamen.dto;

import lombok.Getter;
import lombok.Setter;
@Getter
@Setter
public class Installment {
    private int month;
    private Double principal;
    private Double interest;
    private Double total;
}

